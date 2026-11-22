import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";
import { rodarFfmpeg, duracaoDoVideo, COMO_PLAYER } from "./capaVideo";
import { trechoGuardado, guardarTrecho } from "./capasGuardadas";

// TRECHO DEFINITIVO da prévia: o app tocava a prévia direto do arquivo no
// IPTV (lento, pesado, e cada pessoa baixava de novo). Depois que uma prévia
// toca de verdade, o app pede pra guardar: aqui o ffmpeg corta ~45s do
// vídeo (no mesmo ponto "interessante" que o app usa, ~30% da duração),
// reduz pra 720p H.264/AAC com faststart e sobe pro Supabase Storage. Daí
// em diante, todo mundo daquele servidor toca o MP4 guardado (CDN).
//
// Cuidados:
//   - UM corte por vez (é pesado) e fila curta — o resto fica pra depois;
//   - falha (servidor fora, formato estranho) vale por 1 dia;
//   - arquivo temporário no disco (o faststart precisa de saída "buscável")
//     e sempre apagado.

const DURACAO_TRECHO_S = 45;
const LIMITE_MS = 4 * 60 * 1000;
const MAX_FILA = 30;
const VALIDADE_FALHA_MS = 24 * 60 * 60 * 1000;

const falhas = new Map<string, number>();
const pendentes = new Set<string>();
const fila: string[] = [];
let rodando = false;

function pontoDoTrecho(total: number): number {
    if (!isFinite(total) || total <= 0) return 120; // duração desconhecida: pula a abertura
    if (total < 300) return total * 0.2;
    return total * 0.3;
}

async function cortar(url: string): Promise<Buffer | null> {
    const total = await duracaoDoVideo(url);
    // curta demais pra um trecho: nem tenta
    if (total > 0 && total < DURACAO_TRECHO_S + 10) return null;
    const saida = join(tmpdir(), `trecho-${randomBytes(8).toString("hex")}.mp4`);
    try {
        const r = await rodarFfmpeg(
            [
                "-hide_banner", "-nostdin", "-loglevel", "error",
                "-rw_timeout", "20000000",
                ...COMO_PLAYER,
                "-ss", String(Math.floor(pontoDoTrecho(total))),
                "-i", url,
                "-t", String(DURACAO_TRECHO_S),
                "-map", "0:v:0", "-map", "0:a:0?",
                "-vf", "scale='min(1280,iw)':-2,format=yuv420p",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "27",
                "-maxrate", "2500k", "-bufsize", "5000k",
                "-c:a", "aac", "-b:a", "128k", "-ac", "2",
                "-movflags", "+faststart",
                "-y", saida,
            ],
            LIMITE_MS
        );
        if (r.codigo !== 0) return null;
        const mp4 = await fs.readFile(saida).catch(() => null);
        // muito pequeno = falhou no meio (só cabeçalho / tela preta curta)
        return mp4 && mp4.length > 200 * 1024 ? mp4 : null;
    } finally {
        fs.unlink(saida).catch(() => {});
    }
}

async function processarFila(): Promise<void> {
    if (rodando) return;
    rodando = true;
    try {
        while (fila.length) {
            const url = fila.shift() as string;
            try {
                // outra instância/pedido já guardou nesse meio tempo?
                if (await trechoGuardado(url)) continue;
                const mp4 = await cortar(url);
                const ok = mp4 ? await guardarTrecho(url, mp4) : false;
                if (!ok) falhas.set(url, Date.now());
            } catch {
                falhas.set(url, Date.now());
            } finally {
                pendentes.delete(url);
            }
        }
    } finally {
        rodando = false;
    }
}

// Pede pra guardar (segundo plano). Devolve se entrou (ou já estava) na fila.
export function pedirTrecho(url: string): boolean {
    if (pendentes.has(url)) return true;
    const falhou = falhas.get(url);
    if (falhou && Date.now() - falhou < VALIDADE_FALHA_MS) return false;
    if (fila.length >= MAX_FILA) return false;
    if (falhas.size > 5000) falhas.clear();
    pendentes.add(url);
    fila.push(url);
    processarFila().catch(() => {});
    return true;
}
