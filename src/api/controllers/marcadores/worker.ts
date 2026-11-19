import { marcadoresDaTemporada, creditosPelaImagem, creditosValidos } from "./deteccao";
import { duracao, impressaoDoTrecho, analisarFim, JANELA_INICIO_S, JANELA_FIM_S, JANELA_FIM_FILME_S } from "./extracao";
import { episodiosExtraidos, salvarErro, salvarExtracao, salvarMarcador, TipoMidia } from "./repositorio";

// Worker dos marcadores de abertura/créditos.
//
// De onde vem o vídeo: não guardamos senha de ninguém. Quando alguém abre
// um episódio no app, o app manda a temporada + a conta IPTV dele; o worker
// usa essa conta SÓ na memória, enquanto analisa, e esquece em seguida.
// O resultado fica salvo pelo vídeo (servidor + id), então vale pra todos
// os clientes daquele servidor — cada episódio é analisado uma vez só.
//
// Cuidados:
//   - um trabalho por vez, um download por vez (CPU e banda do servidor);
//   - antes de cada download confere a conta: se ela já está no limite de
//     telas (max_connections), espera — nunca derruba quem está assistindo;
//   - limite de episódios por dia (MARCADORES_MAX_POR_DIA) e de fila;
//   - liga só com MARCADORES_ATIVO=true (a consulta funciona sempre).

export type Conta = { base: string; usuario: string; senha: string };
export type EpisodioPedido = { id: string; numero: number; extensao: string };

type Trabalho =
    | { chave: string; tipo: "temporada"; servidor: string; conta: Conta; serieId: number; temporada: number; episodios: EpisodioPedido[]; faltando: string[]; adiamentos: number }
    | { chave: string; tipo: "filme"; servidor: string; conta: Conta; id: string; extensao: string; adiamentos: number };

const num = (v: string | undefined, padrao: number) => {
    const n = Number(v);
    return isFinite(n) && n > 0 ? n : padrao;
};

const MAX_FILA = num(process.env.MARCADORES_MAX_FILA, 60);
const MAX_POR_DIA = num(process.env.MARCADORES_MAX_POR_DIA, 400);
// Temporada enorme (anime de 100+ episódios): um pedaço por vez — os
// próximos pedidos continuam de onde parou.
const MAX_EPISODIOS_POR_TRABALHO = 30;
const ESPERA_ADIAMENTO_MS = 10 * 60 * 1000;
const MAX_ADIAMENTOS = 6;

export function marcadoresAtivos(): boolean {
    return process.env.MARCADORES_ATIVO === "true";
}

const fila: Trabalho[] = [];
const naFila = new Set<string>();
let rodando = false;
let atual: string | null = null;
let cota = { dia: "", usados: 0 };

function cotaDoDia(): number {
    const hoje = new Date().toISOString().slice(0, 10);
    if (cota.dia !== hoje) cota = { dia: hoje, usados: 0 };
    return MAX_POR_DIA - cota.usados;
}

export function estadoDoWorker() {
    return { ativo: marcadoresAtivos(), rodando, atual, naFila: fila.length, cotaRestanteHoje: cotaDoDia(), maxPorDia: MAX_POR_DIA };
}

export function pedirTemporada(servidor: string, conta: Conta, serieId: number, temporada: number, episodios: EpisodioPedido[], faltando: string[]): boolean {
    return enfileirar({ chave: `t|${servidor}|${serieId}|${temporada}`, tipo: "temporada", servidor, conta, serieId, temporada, episodios, faltando, adiamentos: 0 });
}

export function pedirFilme(servidor: string, conta: Conta, id: string, extensao: string): boolean {
    return enfileirar({ chave: `f|${servidor}|${id}`, tipo: "filme", servidor, conta, id, extensao, adiamentos: 0 });
}

function enfileirar(t: Trabalho): boolean {
    if (!marcadoresAtivos()) return false;
    if (naFila.has(t.chave)) return true;
    if (fila.length >= MAX_FILA || cotaDoDia() <= 0) return false;
    naFila.add(t.chave);
    fila.push(t);
    void rodar();
    return true;
}

async function rodar(): Promise<void> {
    if (rodando) return;
    rodando = true;
    try {
        while (fila.length) {
            const t = fila.shift()!;
            atual = t.tipo === "temporada" ? `série ${t.serieId} T${t.temporada}` : `filme ${t.id}`;
            let resultado: "fim" | "adiar" = "fim";
            try {
                resultado = t.tipo === "temporada" ? await processarTemporada(t) : await processarFilme(t);
            } catch (e: any) {
                // mensagem nossa ou do banco — nunca tem a URL do vídeo
                console.error("[marcadores] falha no trabalho:", String(e?.message || e).slice(0, 160));
            }
            if (resultado === "adiar" && t.adiamentos < MAX_ADIAMENTOS) {
                t.adiamentos++;
                setTimeout(() => {
                    fila.push(t);
                    void rodar();
                }, ESPERA_ADIAMENTO_MS);
                continue; // continua "na fila" (não duplica se pedirem de novo)
            }
            naFila.delete(t.chave); // a conta sai da memória com o trabalho
        }
    } finally {
        rodando = false;
        atual = null;
    }
}

type EstadoConta = "livre" | "ocupada" | "invalida";

// player_api.php sem "action" = login: devolve user_info com o limite de
// telas (max_connections) e quantas estão em uso agora (active_cons).
export async function estadoDaConta(conta: Conta): Promise<EstadoConta> {
    const url = `${conta.base}/player_api.php?username=${encodeURIComponent(conta.usuario)}&password=${encodeURIComponent(conta.senha)}`;
    try {
        const r = await fetch(url, { headers: { "User-Agent": "VLC/3.0.20 LibVLC/3.0.20", Connection: "close" }, signal: AbortSignal.timeout(15000) });
        const json: any = await r.json().catch(() => null);
        const info = json && json.user_info;
        if (!info || Number(info.auth) !== 1 || (info.status && info.status !== "Active")) return "invalida";
        const max = Number(info.max_connections);
        const ativas = Number(info.active_cons);
        if (isFinite(max) && max > 0 && isFinite(ativas) && ativas >= max) return "ocupada";
        return "livre";
    } catch {
        return "ocupada"; // painel instável agora: tenta mais tarde
    }
}

const urlDoVideo = (conta: Conta, pasta: "series" | "movie", id: string, extensao: string) =>
    `${conta.base}/${pasta}/${encodeURIComponent(conta.usuario)}/${encodeURIComponent(conta.senha)}/${id}.${extensao}`;

async function processarTemporada(t: Extract<Trabalho, { tipo: "temporada" }>): Promise<"fim" | "adiar"> {
    const porId = new Map(t.episodios.map((e) => [e.id, e]));
    const pendentes = t.faltando.filter((id) => porId.has(id));
    let extraidos = 0;

    while (pendentes.length && extraidos < MAX_EPISODIOS_POR_TRABALHO) {
        if (cotaDoDia() <= 0) break;
        const conta = await estadoDaConta(t.conta);
        if (conta === "invalida") return "fim";
        if (conta === "ocupada") {
            if (extraidos) await recalcularTemporada(t.servidor, t.serieId, t.temporada);
            t.faltando = pendentes.slice();
            return "adiar";
        }
        const ep = porId.get(pendentes.shift()!)!;
        cota.usados++;
        extraidos++;
        await extrairEpisodio(t, ep);
    }
    await recalcularTemporada(t.servidor, t.serieId, t.temporada);
    return "fim";
}

async function extrairEpisodio(t: Extract<Trabalho, { tipo: "temporada" }>, ep: EpisodioPedido): Promise<void> {
    const meta = { serieId: t.serieId, temporada: t.temporada, numero: ep.numero };
    const url = urlDoVideo(t.conta, "series", ep.id, ep.extensao);
    const dur = await duracao(url);
    if (!dur || !isFinite(dur)) return salvarErro(t.servidor, "episodio", ep.id, "sem_duracao", meta);

    const janelaInicio = Math.min(JANELA_INICIO_S, dur * 0.35);
    const fpInicio = await impressaoDoTrecho(url, 0, janelaInicio).catch(() => null);
    const fimInicio = Math.max(dur - JANELA_FIM_S, dur * 0.6);
    const fim = await analisarFim(url, fimInicio, true).catch(() => ({ fp: null, amostras: [] }));
    if (!fpInicio && !fim.fp && !fim.amostras.length) return salvarErro(t.servidor, "episodio", ep.id, "sem_leitura", meta);

    await salvarExtracao({
        servidor: t.servidor,
        tipo: "episodio",
        id: ep.id,
        ...meta,
        duracao: dur,
        fpInicio,
        fpFim: fim.fp,
        fimInicio,
        creditosImagem: creditosPelaImagem(fim.amostras, dur),
    });
}

// Compara a temporada inteira (o que já estava salvo + o que acabou de
// chegar) — só CPU, nada de rede.
async function recalcularTemporada(servidor: string, serieId: number, temporada: number): Promise<void> {
    const eps = await episodiosExtraidos(servidor, serieId, temporada);
    const marcadores = await marcadoresDaTemporada(eps);
    for (const [id, m] of marcadores) await salvarMarcador(servidor, "episodio" as TipoMidia, id, m);
}

// Filme não tem "vizinho" pra comparar o som: créditos pela imagem (letreiro
// em tela escura nos últimos minutos).
async function processarFilme(t: Extract<Trabalho, { tipo: "filme" }>): Promise<"fim" | "adiar"> {
    if (cotaDoDia() <= 0) return "fim";
    const conta = await estadoDaConta(t.conta);
    if (conta === "invalida") return "fim";
    if (conta === "ocupada") return "adiar";
    cota.usados++;
    const url = urlDoVideo(t.conta, "movie", t.id, t.extensao);
    const dur = await duracao(url);
    if (!dur || !isFinite(dur)) {
        await salvarErro(t.servidor, "filme", t.id, "sem_duracao");
        return "fim";
    }
    const fimInicio = Math.max(dur - JANELA_FIM_FILME_S, dur * 0.6);
    const fim = await analisarFim(url, fimInicio, false).catch(() => ({ fp: null, amostras: [] }));
    if (!fim.amostras.length) {
        await salvarErro(t.servidor, "filme", t.id, "sem_leitura");
        return "fim";
    }
    const cr = creditosPelaImagem(fim.amostras, dur);
    const creditosInicio = cr !== null && creditosValidos(cr, dur) ? Math.round(cr * 10) / 10 : null;
    await salvarExtracao({
        servidor: t.servidor,
        tipo: "filme",
        id: t.id,
        duracao: dur,
        fpInicio: null,
        fpFim: null,
        fimInicio,
        creditosImagem: cr,
        marcador: { aberturaInicio: null, aberturaFim: null, creditosInicio, fonteCreditos: creditosInicio !== null ? "imagem" : null },
    });
    return "fim";
}
