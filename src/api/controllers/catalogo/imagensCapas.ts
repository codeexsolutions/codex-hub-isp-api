import sharp from "sharp";
import { subirArquivo } from "../capasGuardadas";
import { salvarFicha } from "./fichasGuardadas";
import type { CapasTmdb } from "./tmdb";

// Capas deitadas GUARDADAS no nosso Storage (capas-tmdb/<tmdbId>/...): o app
// carregava cada cena do TMDB passando por um otimizador externo — lento, e
// na troca de capa aparecia quebrado. Aqui, na 1ª vez, cada cena é baixada,
// reduzida (640px, JPEG leve) e guardada; o logo (PNG transparente) é
// copiado como está. A ficha no banco passa a apontar pras cópias (CDN).
// `grande` guarda a cena original em 1280px (o destaque do topo usa).

const LARGURA_CARD = 640;
const SIMULTANEAS = 2;

const fila: Array<() => Promise<void>> = [];
const emAndamento = new Set<string>();
let ativas = 0;

function proxima() {
    while (ativas < SIMULTANEAS && fila.length) {
        const tarefa = fila.shift() as () => Promise<void>;
        ativas++;
        tarefa()
            .catch(() => {})
            .finally(() => {
                ativas--;
                proxima();
            });
    }
}

async function baixar(url: string): Promise<Buffer | null> {
    const r = await fetch(url, { signal: AbortSignal.timeout(15000) }).catch(() => null);
    if (!r || !r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
}

const nomeDe = (url: string) => (url.split("/").pop() || "img").replace(/\.[a-z0-9]+$/i, "");

async function guardar(chave: string, capas: CapasTmdb): Promise<void> {
    const pasta = `capas-tmdb/${capas.tmdbId}`;
    const fundos = [];
    for (const f of capas.fundos) {
        if (/supabase/i.test(f.url)) { fundos.push(f); continue; } // já guardada
        const bruto = await baixar(f.url);
        const jpg = bruto ? await sharp(bruto).resize({ width: LARGURA_CARD, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toBuffer().catch(() => null) : null;
        const url = jpg ? await subirArquivo(`${pasta}/${nomeDe(f.url)}-${LARGURA_CARD}.jpg`, jpg, "image/jpeg") : null;
        if (!url) return; // falhou no meio: tenta de novo numa próxima (não grava pela metade)
        fundos.push({ url, temTitulo: f.temTitulo, grande: f.grande || f.url.replace("/t/p/w780/", "/t/p/w1280/") });
    }
    let logo = capas.logo;
    if (logo && !/supabase/i.test(logo)) {
        const png = await baixar(logo);
        const url = png ? await subirArquivo(`${pasta}/logo-${nomeDe(logo)}.png`, png, "image/png") : null;
        if (!url) return;
        logo = url;
    }
    await salvarFicha(chave, { ...capas, fundos, logo, guardadas: true });
}

// Em segundo plano (a resposta não espera). Uma vez por chave.
export function guardarImagensCapas(chave: string, capas: CapasTmdb): void {
    if (capas.guardadas || !capas.fundos.length || emAndamento.has(chave)) return;
    emAndamento.add(chave);
    fila.push(() => guardar(chave, capas).finally(() => emAndamento.delete(chave)));
    proxima();
}
