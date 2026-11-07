import { createHash } from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Capas/quadros de vídeo GUARDADOS DE VEZ no Supabase Storage (o cache em
// memória some a cada reinício/deploy do Railway). A chave é o VÍDEO no
// painel — servidor + tipo + número (sem usuário/senha da URL) — então a
// foto tirada uma vez serve pra todo mundo, pra sempre:
//   capas-video/<hash do vídeo>-<p50 | s1234>.jpg
// Pedido seguinte = redirect pra URL pública (CDN), sem ffmpeg nem IPTV.

const BUCKET = "provedores";
const PASTA = "capas-video";

let cliente: SupabaseClient | null = null;
function storage(): SupabaseClient | null {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
    if (!cliente) cliente = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    return cliente;
}

// "http://servidor:80/movie/USUARIO/SENHA/12345.mp4" → "servidor:80|movie|12345"
function idDoVideo(url: string): string {
    const m = /^https?:\/\/([^/]+)\/(movie|series|live)\/[^/]+\/[^/]+\/(\d+)/i.exec(url);
    return m ? `${m[1].toLowerCase()}|${m[2].toLowerCase()}|${m[3]}` : url;
}

function caminho(url: string, variante: string): string {
    const h = createHash("sha1").update(idDoVideo(url)).digest("hex").slice(0, 24);
    return `${PASTA}/${h}-${variante}.jpg`;
}

function urlPublica(path: string): string | null {
    const sb = storage();
    return sb ? sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null;
}

// existe? (lembra: as que existem pra sempre; as que faltam por 10 min)
const conhecidas = new Map<string, { existe: boolean; em: number }>();
const VALIDADE_FALTA_MS = 10 * 60 * 1000;

export async function capaGuardada(url: string, variante: string): Promise<string | null> {
    const path = caminho(url, variante);
    const pub = urlPublica(path);
    if (!pub) return null;
    const k = conhecidas.get(path);
    if (k && (k.existe || Date.now() - k.em < VALIDADE_FALTA_MS)) return k.existe ? pub : null;
    const existe = await fetch(pub, { method: "HEAD", signal: AbortSignal.timeout(4000) })
        .then((r) => r.ok)
        .catch(() => false);
    conhecidas.set(path, { existe, em: Date.now() });
    if (conhecidas.size > 20000) {
        const velha = conhecidas.keys().next().value;
        if (velha !== undefined) conhecidas.delete(velha);
    }
    return existe ? pub : null;
}

// Guarda (em segundo plano — a resposta não espera o upload).
export function guardarCapa(url: string, variante: string, jpg: Buffer): void {
    const sb = storage();
    if (!sb) return;
    const path = caminho(url, variante);
    sb.storage
        .from(BUCKET)
        .upload(path, jpg, { contentType: "image/jpeg", upsert: true, cacheControl: "31536000" })
        .then(({ error }) => {
            if (!error) conhecidas.set(path, { existe: true, em: Date.now() });
        })
        .catch(() => {});
}
