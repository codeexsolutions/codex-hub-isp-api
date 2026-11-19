import { rodarFfmpeg, duracaoDoVideo, COMO_PLAYER } from "../capaVideo";
import { impressaoDoAudio, pcmDeBuffer, TAXA_AMOSTRAGEM } from "./impressao";
import { AmostraImagem, lerLogBlackframe } from "./deteccao";

// O que é baixado do servidor IPTV pra analisar um episódio/filme. Nunca o
// vídeo inteiro: só o começo (áudio) e o fim (áudio + quadros-chave).
//
// "-ss" ANTES do "-i": o ffmpeg pula direto pro ponto pedido (pedido de
// faixa de bytes no MP4/MKV), sem baixar o que vem antes. O som sai mono a
// 8 kHz pelo stdout; o filtro blackframe escreve no stderr quanto de cada
// quadro-chave é preto (pra achar letreiro de créditos).
//
// Nada daqui loga a URL nem o stderr do ffmpeg: a URL leva usuário e senha
// da conta IPTV no caminho.

const num = (v: string | undefined, padrao: number) => {
    const n = Number(v);
    return isFinite(n) && n > 0 ? n : padrao;
};

// Quanto de cada ponta analisar (segundos). Abertura costuma estar nos
// primeiros 5 min (com cena antes); créditos de série nos últimos 2–3 min.
export const JANELA_INICIO_S = num(process.env.MARCADORES_JANELA_INICIO_S, 420);
export const JANELA_FIM_S = num(process.env.MARCADORES_JANELA_FIM_S, 300);
export const JANELA_FIM_FILME_S = num(process.env.MARCADORES_JANELA_FIM_FILME_S, 600);

const ENTRADA = ["-hide_banner", "-nostdin", "-rw_timeout", "20000000", ...COMO_PLAYER];
// Baixar alguns minutos de vídeo de um painel lento pode demorar.
const LIMITE_MS = 8 * 60 * 1000;
const MIN_SEGUNDOS_AUDIO = 20;

export function duracao(url: string): Promise<number> {
    return duracaoDoVideo(url).catch(() => 0);
}

// Áudio de [inicio, inicio + segundos) → impressão digital.
export async function impressaoDoTrecho(url: string, inicio: number, segundos: number): Promise<Uint32Array | null> {
    const { saida } = await rodarFfmpeg(
        [
            ...ENTRADA,
            "-loglevel", "error",
            ...(inicio > 0 ? ["-ss", String(Math.floor(inicio))] : []),
            "-t", String(Math.ceil(segundos)),
            "-i", url,
            "-map", "0:a:0", "-vn",
            "-ac", "1", "-ar", String(TAXA_AMOSTRAGEM),
            "-f", "s16le", "pipe:1",
        ],
        LIMITE_MS
    );
    if (saida.length < TAXA_AMOSTRAGEM * 2 * MIN_SEGUNDOS_AUDIO) return null;
    return impressaoDoAudio(pcmDeBuffer(saida));
}

// Fim do vídeo a partir de `inicio`, numa leitura só: o áudio (se pedido) e
// quanto de cada quadro-chave é preto. -skip_frame nokey: decodifica só os
// quadros-chave (um a cada poucos segundos) — barato de CPU.
export async function analisarFim(url: string, inicio: number, comAudio: boolean): Promise<{ fp: Uint32Array | null; amostras: AmostraImagem[] }> {
    const { saida, erro } = await rodarFfmpeg(
        [
            ...ENTRADA,
            "-loglevel", "info",
            "-skip_frame", "nokey",
            "-ss", String(Math.floor(inicio)),
            "-i", url,
            ...(comAudio ? ["-map", "0:a:0", "-vn", "-ac", "1", "-ar", String(TAXA_AMOSTRAGEM), "-f", "s16le", "pipe:1"] : []),
            "-map", "0:v:0", "-an",
            "-vf", "scale=160:-2,blackframe=amount=0:threshold=32",
            "-f", "null", "-",
        ],
        LIMITE_MS,
        4 * 1024 * 1024
    );
    const fp = comAudio && saida.length >= TAXA_AMOSTRAGEM * 2 * MIN_SEGUNDOS_AUDIO ? impressaoDoAudio(pcmDeBuffer(saida)) : null;
    return { fp, amostras: lerLogBlackframe(erro, Math.floor(inicio)) };
}
