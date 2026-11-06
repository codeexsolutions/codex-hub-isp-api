import { spawn } from "child_process";
import { existsSync } from "fs";

// "Capa inventada" de filme sem capa: tira um quadro do próprio vídeo com o
// ffmpeg, aqui no servidor. O app da TV não consegue fazer isso sozinho
// quando o servidor IPTV não manda o cabeçalho CORS (o navegador bloqueia a
// leitura do quadro) — e assim a TV baixa só um JPEG pequeno, não pedaços
// do filme.
//
// Cuidados:
//   - no máximo 2 ffmpeg ao mesmo tempo (fila), com tempo limite;
//   - cache em memória (os mais recentes) + Cache-Control longo na resposta;
//   - só http(s) e nunca endereço interno (localhost, rede privada).

// Qual ffmpeg usar, em ordem: FFMPEG_PATH → "ffmpeg" do SISTEMA (apt, ver
// railpack.json/nixpacks.toml) → binário do pacote ffmpeg-static. O do
// sistema vem antes: no Railway o estático roda "-version" mas morre na hora
// ao abrir uma URL (rede/DNS de binário estático dentro do container).
function binarioDoPacote(): string | null {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const p: string | null = require("ffmpeg-static");
        return p && existsSync(p) ? p : null;
    } catch {
        return null;
    }
}

const CANDIDATOS = [process.env.FFMPEG_PATH || "", "ffmpeg", binarioDoPacote() || ""].filter(Boolean);
let caminhoFfmpeg = CANDIDATOS[0] || "ffmpeg";
let escolhido: Promise<void> | null = null;

// Na primeira capa: fica com o primeiro candidato que roda.
function escolherFfmpeg(): Promise<void> {
    if (!escolhido) {
        escolhido = (async () => {
            for (const c of CANDIDATOS) {
                const r = await rodarCom(c, ["-hide_banner", "-version"], 8000);
                if (r.codigo === 0) {
                    caminhoFfmpeg = c;
                    return;
                }
            }
        })();
    }
    return escolhido;
}

// Painéis IPTV costumam recusar quem não se apresenta como player (o ffmpeg
// diz "Lavf/..."): entra como VLC. Segue os redirecionamentos do painel
// (/movie/usuario/senha/ID → CDN) normalmente.
const COMO_PLAYER = ["-user_agent", "VLC/3.0.20 LibVLC/3.0.20", "-multiple_requests", "1"];

const MAX_SIMULTANEOS = 2;
// capas (~40 KB) + miniaturas da barra do player (~15 KB, ~120 por filme)
const MAX_CACHE = 3000;
const LIMITE_DURACAO_MS = 12000;
const LIMITE_QUADRO_MS = 25000;

const cache = new Map<string, Buffer>();
// Falhas (servidor fora, formato estranho) valem só por um tempo.
const falhas = new Map<string, number>();
const VALIDADE_FALHA_MS = 10 * 60 * 1000;
const emAndamento = new Map<string, Promise<Buffer | null>>();
let ativos = 0;
const fila: Array<() => void> = [];

function guardar(chave: string, valor: Buffer | null) {
    if (!valor) {
        falhas.set(chave, Date.now());
        if (falhas.size > MAX_CACHE * 2) falhas.clear();
        return;
    }
    cache.set(chave, valor);
    if (cache.size > MAX_CACHE) {
        const maisAntiga = cache.keys().next().value;
        if (maisAntiga !== undefined) cache.delete(maisAntiga);
    }
}

async function naVez<T>(tarefa: () => Promise<T>): Promise<T> {
    if (ativos >= MAX_SIMULTANEOS) await new Promise<void>((ok) => fila.push(ok));
    ativos++;
    try {
        return await tarefa();
    } finally {
        ativos--;
        const proximo = fila.shift();
        if (proximo) proximo();
    }
}

export function urlPermitida(url: string): boolean {
    let u: URL;
    try {
        u = new URL(url);
    } catch {
        return false;
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || h === "::1" || h === "[::1]") return false;
    const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(h);
    if (m) {
        const [a, b] = [Number(m[1]), Number(m[2])];
        if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 100 && b >= 64 && b <= 127)) return false;
    }
    return true;
}

type Resultado = { saida: Buffer; erro: string; codigo: number | null; sinal: string | null };

function rodar(args: string[], limiteMs: number): Promise<Resultado> {
    return rodarCom(caminhoFfmpeg, args, limiteMs);
}

function rodarCom(binario: string, args: string[], limiteMs: number): Promise<Resultado> {
    return new Promise((resolve) => {
        let proc: ReturnType<typeof spawn>;
        try {
            proc = spawn(binario, args, { stdio: ["ignore", "pipe", "pipe"] });
        } catch (e: any) {
            return resolve({ saida: Buffer.alloc(0), erro: String(e?.message || e), codigo: null, sinal: null });
        }
        const partes: Buffer[] = [];
        let erro = "";
        const timer = setTimeout(() => proc.kill("SIGKILL"), limiteMs);
        proc.stdout!.on("data", (d: Buffer) => partes.push(d));
        proc.stderr!.on("data", (d: Buffer) => {
            if (erro.length < 20000) erro += d.toString();
        });
        let terminou = false;
        const fim = (codigo: number | null, sinal: string | null) => {
            if (terminou) return;
            terminou = true;
            clearTimeout(timer);
            resolve({ saida: Buffer.concat(partes), erro, codigo, sinal });
        };
        proc.on("close", (codigo, sinal) => fim(codigo, sinal));
        proc.on("error", (e) => {
            erro += String(e?.message || e);
            fim(null, null);
        });
    });
}

async function duracaoSegundos(url: string): Promise<number> {
    // Sem arquivo de saída o ffmpeg só lê o cabeçalho e imprime "Duration:".
    const { erro } = await rodar(["-hide_banner", "-nostdin", "-rw_timeout", "10000000", ...COMO_PLAYER, "-i", url], LIMITE_DURACAO_MS);
    const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(erro);
    return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
}

async function quadroEm(url: string, segundos: number, largura = 480): Promise<Buffer | null> {
    const { saida } = await rodar(
        [
            "-hide_banner", "-nostdin", "-loglevel", "error",
            "-rw_timeout", "15000000",
            ...COMO_PLAYER,
            "-ss", String(Math.max(0, Math.floor(segundos))),
            "-i", url,
            "-frames:v", "1",
            "-vf", `scale=${largura}:-2`,
            "-q:v", "6",
            "-f", "image2", "-c:v", "mjpeg",
            "pipe:1",
        ],
        LIMITE_QUADRO_MS
    );
    return saida.length > 1000 ? saida : null;
}

// fracao: 0.5 = meio do filme; 0.2 = depois da abertura.
export function capaDoVideo(url: string, fracao: number): Promise<Buffer | null> {
    const chave = `${fracao}|${url}`;
    const pronta = cache.get(chave);
    if (pronta) return Promise.resolve(pronta);
    const falhou = falhas.get(chave);
    if (falhou && Date.now() - falhou < VALIDADE_FALHA_MS) return Promise.resolve(null);
    const andamento = emAndamento.get(chave);
    if (andamento) return andamento;

    const p = naVez(async () => {
        await escolherFfmpeg();
        const total = await duracaoSegundos(url);
        const pontos = total > 0 ? [fracao, fracao + 0.08, fracao - 0.08].map((f) => total * Math.min(0.95, Math.max(0.02, f))) : [60, 180];
        for (const t of pontos) {
            const jpg = await quadroEm(url, t);
            // Quadro muito pequeno costuma ser tela preta (fade/cena escura): tenta o próximo ponto.
            if (jpg && jpg.length > 6000) return jpg;
        }
        return null;
    })
        .catch(() => null)
        .then((r) => {
            emAndamento.delete(chave);
            guardar(chave, r);
            return r;
        });
    emAndamento.set(chave, p);
    return p;
}

// Miniatura da barra de progresso do player: quadro no SEGUNDO exato (o
// app já sabe a duração — não precisa medir), menor (320px) e mais rápido.
export function quadroNoSegundo(url: string, segundos: number): Promise<Buffer | null> {
    const s = Math.max(0, Math.round(segundos));
    const chave = `s${s}|${url}`;
    const pronta = cache.get(chave);
    if (pronta) return Promise.resolve(pronta);
    const falhou = falhas.get(chave);
    if (falhou && Date.now() - falhou < VALIDADE_FALHA_MS) return Promise.resolve(null);
    const andamento = emAndamento.get(chave);
    if (andamento) return andamento;
    const p = naVez(async () => {
        await escolherFfmpeg();
        return quadroEm(url, s, 320);
    })
        .catch(() => null)
        .then((r) => {
            emAndamento.delete(chave);
            guardar(chave, r);
            return r;
        });
    emAndamento.set(chave, p);
    return p;
}

// Diagnóstico (sem dados sensíveis): qual ffmpeg está sendo usado, se ele
// roda, e qual commit está no ar — pra saber por que a capa falha em produção.
export async function diagnosticoFfmpeg(urlTeste?: string): Promise<Record<string, unknown>> {
    if (urlTeste && !urlPermitida(urlTeste)) return { erro: "url não permitida" };
    await escolherFfmpeg();
    const candidatos = [];
    for (const c of CANDIDATOS) {
        const v = await rodarCom(c, ["-hide_banner", "-version"], 8000);
        const item: Record<string, unknown> = {
            binario: c,
            versao: (v.saida.toString() || v.erro).split(/\r?\n/)[0].slice(0, 100),
            codigo: v.codigo,
            sinal: v.sinal,
        };
        if (urlTeste) {
            const t0 = Date.now();
            const r = await rodarCom(c, ["-hide_banner", "-nostdin", "-rw_timeout", "10000000", ...COMO_PLAYER, "-i", urlTeste], LIMITE_DURACAO_MS);
            const total = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(r.erro);
            item.teste = { ms: Date.now() - t0, codigo: r.codigo, sinal: r.sinal, duracao: total ? total[0] : null, fim: r.erro.slice(-400) };
        }
        candidatos.push(item);
    }
    return {
        emUso: caminhoFfmpeg,
        candidatos,
        commit: (process.env.RAILWAY_GIT_COMMIT_SHA || "").slice(0, 7) || null,
    };
}
