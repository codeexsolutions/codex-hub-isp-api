import { SEGUNDOS_POR_QUADRO, trechoEmComum } from "./impressao";

// Decide os pontos de cada episódio/filme a partir do que foi extraído.
// Puro (sem rede/ffmpeg/banco) — testado em __tests__/deteccao.test.ts.

// Abertura: entre 15 s e 3 min (anime ~1:30, série americana ~0:30–1:00).
export const ABERTURA_MIN_S = 15;
export const ABERTURA_MAX_S = 180;
// Créditos: o trecho igual no fim precisa de pelo menos 15 s.
export const CREDITOS_MIN_S = 15;

export type EpisodioAnalisado = {
    id: string;
    numero: number;
    duracao: number;
    // impressão do começo (a partir do segundo 0) e do fim (a partir de fimInicio)
    fpInicio: Uint32Array | null;
    fpFim: Uint32Array | null;
    fimInicio: number;
    // créditos achados pela imagem (tela escura com letreiro), se houver
    creditosImagem: number | null;
};

export type Marcador = {
    aberturaInicio: number | null;
    aberturaFim: number | null;
    creditosInicio: number | null;
    fonteCreditos: "audio" | "imagem" | null;
};

const arred = (s: number) => Math.round(s * 10) / 10;

// Temporada inteira: compara cada episódio com o vizinho (por número). Um
// episódio pega a abertura/créditos do par em que o trecho igual for maior —
// assim um episódio especial (sem abertura) não estraga os vizinhos.
// Assíncrona: entre um par e outro devolve a vez pro Node (cada comparação
// leva ~100 ms de CPU; a API não pode ficar parada a temporada inteira).
export async function marcadoresDaTemporada(episodios: EpisodioAnalisado[]): Promise<Map<string, Marcador>> {
    const eps = episodios.slice().sort((x, y) => x.numero - y.numero);
    const aberturas = new Map<string, { ini: number; fim: number }>();
    const creditos = new Map<string, { ini: number; tam: number }>();

    const guardarAbertura = (id: string, ini: number, fim: number) => {
        const atual = aberturas.get(id);
        if (!atual || fim - ini > atual.fim - atual.ini) aberturas.set(id, { ini, fim });
    };
    const guardarCreditos = (id: string, ini: number, tam: number) => {
        const atual = creditos.get(id);
        if (!atual || tam > atual.tam) creditos.set(id, { ini, tam });
    };

    const minAb = Math.round(ABERTURA_MIN_S / SEGUNDOS_POR_QUADRO);
    const maxAb = Math.round(ABERTURA_MAX_S / SEGUNDOS_POR_QUADRO);
    const minCr = Math.round(CREDITOS_MIN_S / SEGUNDOS_POR_QUADRO);

    // vizinho imediato e, se faltar impressão nele, o seguinte
    for (let i = 0; i < eps.length; i++) {
        for (let salto = 1; salto <= 2; salto++) {
            const a = eps[i];
            const b = eps[i + salto];
            if (!b) break;
            if (salto === 2 && eps[i + 1] && eps[i + 1].fpInicio && eps[i + 1].fpFim) break;
            await new Promise<void>((ok) => setImmediate(ok));

            if (a.fpInicio && b.fpInicio) {
                const t = trechoEmComum(a.fpInicio, b.fpInicio, minAb, maxAb);
                if (t) {
                    guardarAbertura(a.id, t.inicioA * SEGUNDOS_POR_QUADRO, t.fimA * SEGUNDOS_POR_QUADRO);
                    guardarAbertura(b.id, t.inicioB * SEGUNDOS_POR_QUADRO, t.fimB * SEGUNDOS_POR_QUADRO);
                }
            }
            if (a.fpFim && b.fpFim) {
                const max = Math.max(a.fpFim.length, b.fpFim.length);
                const t = trechoEmComum(a.fpFim, b.fpFim, minCr, max);
                if (t) {
                    const tam = (t.fimA - t.inicioA) * SEGUNDOS_POR_QUADRO;
                    guardarCreditos(a.id, a.fimInicio + t.inicioA * SEGUNDOS_POR_QUADRO, tam);
                    guardarCreditos(b.id, b.fimInicio + t.inicioB * SEGUNDOS_POR_QUADRO, tam);
                }
            }
        }
    }

    const saida = new Map<string, Marcador>();
    for (const e of eps) {
        const ab = aberturas.get(e.id);
        // abertura na 1ª metade do episódio (senão é outra coisa repetida)
        const aberturaOk = ab && (!e.duracao || ab.fim < e.duracao * 0.5);
        const cr = creditos.get(e.id);
        const crAudio = cr && creditosValidos(cr.ini, e.duracao) ? cr.ini : null;
        const crImagem = e.creditosImagem !== null && creditosValidos(e.creditosImagem, e.duracao) ? e.creditosImagem : null;
        const creditosInicio = crAudio !== null ? crAudio : crImagem;
        saida.set(e.id, {
            aberturaInicio: aberturaOk ? arred(ab!.ini) : null,
            aberturaFim: aberturaOk ? arred(ab!.fim) : null,
            creditosInicio: creditosInicio !== null ? arred(creditosInicio) : null,
            fonteCreditos: crAudio !== null ? "audio" : crImagem !== null ? "imagem" : null,
        });
    }
    return saida;
}

// Créditos fazem sentido só no último terço, e não colados no fim.
export function creditosValidos(inicio: number, duracao: number): boolean {
    if (!duracao) return inicio > 0;
    return inicio >= duracao * 0.6 && inicio <= duracao - 8;
}

/* -------------------- Créditos pela imagem -------------------- */

// Uma amostra por quadro-chave do fim do vídeo: tempo (s, absoluto) e
// quanto da imagem é preto (0–100) — saída do filtro blackframe do ffmpeg.
export type AmostraImagem = { t: number; preto: number };

// "[Parsed_blackframe_1 @ 0x..] frame:12 pblack:93 pts:... t:84.08 type:I ..."
// t é relativo ao ponto de onde a leitura começou (inicio).
export function lerLogBlackframe(log: string, inicio: number): AmostraImagem[] {
    const amostras: AmostraImagem[] = [];
    const re = /pblack:(\d+)[^\n]*?\bt:(-?[\d.]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(log))) {
        const t = Number(m[2]);
        if (isFinite(t)) amostras.push({ t: inicio + Math.max(0, t), preto: Number(m[1]) });
    }
    return amostras.sort((x, y) => x.t - y.t);
}

// Letreiro de créditos = tela quase toda preta (texto claro em cima).
const PRETO_MIN = 85;
// Do começo dos créditos até o fim, a grande maioria das amostras é "preta".
const FRACAO_MIN = 0.8;
const CREDITOS_IMAGEM_MIN_S = 25;

// Primeiro instante a partir do qual o vídeo fica "de créditos" até o fim.
export function creditosPelaImagem(amostras: AmostraImagem[], duracao: number): number | null {
    const n = amostras.length;
    if (n < 4) return null;
    const fimVideo = duracao > 0 ? duracao : amostras[n - 1].t;
    // sufixo: quantas amostras pretas daqui até o fim
    const pretasAte = new Uint32Array(n + 1);
    for (let i = n - 1; i >= 0; i--) pretasAte[i] = pretasAte[i + 1] + (amostras[i].preto >= PRETO_MIN ? 1 : 0);
    for (let i = 0; i < n; i++) {
        if (amostras[i].preto < PRETO_MIN) continue;
        const restantes = n - i;
        if (restantes < 3) break;
        if (fimVideo - amostras[i].t < CREDITOS_IMAGEM_MIN_S) break;
        if (pretasAte[i] / restantes >= FRACAO_MIN) return amostras[i].t;
    }
    return null;
}
