import sharp from "sharp";
import { arquivoGuardado, subirArquivo } from "./capasGuardadas";
import { urlPermitida } from "./capaVideo";

// CAPAS DO PAINEL guardadas no nosso Storage (imagens/<hash>-<largura>):
// pôster de filme/série, capa provisória dos adultos, logo de canal. O app
// usa a cópia guardada direto do CDN (calcula o endereço sozinho, sem
// passar pela API); quando ainda não tem, mostra pelo wsrv.nl e pede pra
// guardar EM LOTE (POST /iptv/proxy/imagens). Aqui cada imagem é baixada,
// reduzida pro tamanho do card e guardada uma vez só, pra todo mundo.
//   - transparente (logo) → PNG; o resto → JPEG leve;
//   - no máximo 3 ao mesmo tempo; fila curta; falha vale por 1 dia.

// Mesmo hash do app (packages/core/src/api/imagem.ts — cyrb53).
export function hashImagem(s: string): string {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < s.length; i++) {
        const ch = s.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export const LARGURAS = [160, 240, 320, 480, 640, 960, 1280];
const caminho = (url: string, w: number) => `imagens/${hashImagem(url)}-${w}`;

const SIMULTANEAS = 3;
const MAX_FILA = 400;
const MAX_BYTES = 15 * 1024 * 1024;
const VALIDADE_FALHA_MS = 24 * 60 * 60 * 1000;
const falhas = new Map<string, number>();
const pendentes = new Set<string>();
const fila: Array<{ url: string; w: number; path: string }> = [];
let ativas = 0;

async function processar(url: string, w: number, path: string): Promise<boolean> {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (SynkTV)" }, signal: AbortSignal.timeout(12000) }).catch(() => null);
    if (!r || !r.ok) return false;
    const tamanho = Number(r.headers.get("content-length") || 0);
    if (tamanho > MAX_BYTES) return false;
    const bruto = Buffer.from(await r.arrayBuffer());
    if (!bruto.length || bruto.length > MAX_BYTES) return false;
    const img = sharp(bruto, { failOn: "none" }).rotate();
    const meta = await img.metadata().catch(() => null);
    if (!meta || !meta.width) return false;
    const redim = img.resize({ width: w, withoutEnlargement: true });
    const transparente = !!meta.hasAlpha;
    const saida = transparente
        ? await redim.png({ compressionLevel: 9, palette: true, quality: 85 }).toBuffer().catch(() => null)
        : await redim.flatten({ background: "#000" }).jpeg({ quality: 72, mozjpeg: true }).toBuffer().catch(() => null);
    if (!saida) return false;
    return !!(await subirArquivo(path, saida, transparente ? "image/png" : "image/jpeg"));
}

function proxima() {
    while (ativas < SIMULTANEAS && fila.length) {
        const t = fila.shift() as { url: string; w: number; path: string };
        ativas++;
        processar(t.url, t.w, t.path)
            .catch(() => false)
            .then((ok) => {
                if (!ok) falhas.set(t.path, Date.now());
            })
            .finally(() => {
                ativas--;
                pendentes.delete(t.path);
                proxima();
            });
    }
}

// Lote do app: diz quais já estão guardadas e põe as outras na fila.
export async function verificarImagens(itens: Array<{ u: string; w: number }>): Promise<boolean[]> {
    return Promise.all(
        itens.map(async (it) => {
            const url = String((it && it.u) || "");
            const w = Number(it && it.w);
            if (!url || LARGURAS.indexOf(w) === -1 || !urlPermitida(url)) return false;
            const path = caminho(url, w);
            if (await arquivoGuardado(path)) return true;
            const falhou = falhas.get(path);
            if (falhou && Date.now() - falhou < VALIDADE_FALHA_MS) return false;
            if (!pendentes.has(path) && fila.length < MAX_FILA) {
                if (falhas.size > 20000) falhas.clear();
                pendentes.add(path);
                fila.push({ url, w, path });
                proxima();
            }
            return false;
        })
    );
}
