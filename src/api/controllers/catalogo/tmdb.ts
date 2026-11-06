// Integração com o TMDB (The Movie Database) — dados oficiais de filmes:
// pôster, fundo, sinopse, nota, gêneros, ano e COLEÇÃO (a saga, com os
// filmes em ordem de lançamento). Só leitura.
//
// Token: variável de ambiente TMDB_TOKEN (o "Token de leitura da API" v4).
// Nunca no código. Sem token, as rotas respondem 503.
//
// Cache em memória (24h) por consulta: o TMDB é chamado uma vez por título/
// coleção; os apps ainda guardam do lado deles.

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";
const VALIDADE_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE = 5000;

export function tmdbConfigurado(): boolean {
    return !!process.env.TMDB_TOKEN;
}

const cache = new Map<string, { em: number; valor: unknown }>();

async function chamar<T>(caminho: string, params: Record<string, string | undefined>): Promise<T | null> {
    const q = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`)
        .join("&");
    const url = `${BASE}${caminho}${q ? "?" + q : ""}`;
    const guardado = cache.get(url);
    if (guardado && Date.now() - guardado.em < VALIDADE_MS) return guardado.valor as T;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${process.env.TMDB_TOKEN}`, Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
    }).catch(() => null);
    if (!res || !res.ok) return null;
    const valor = (await res.json().catch(() => null)) as T | null;
    if (valor === null) return null;
    cache.set(url, { em: Date.now(), valor });
    if (cache.size > MAX_CACHE) {
        const velha = cache.keys().next().value;
        if (velha !== undefined) cache.delete(velha);
    }
    return valor;
}

const img = (caminho: string | null | undefined, tamanho: string) => (caminho ? `${IMG}/${tamanho}${caminho}` : undefined);

function normalizar(t: string): string {
    return (t || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

export type FilmeTmdb = {
    tmdbId: number;
    titulo: string;
    tituloOriginal: string;
    ano?: number;
    sinopse?: string;
    nota?: number;
    generos: string[];
    duracaoMin?: number;
    poster?: string;
    fundo?: string;
    colecao?: { id: number; nome: string };
};

export type ParteColecao = { tmdbId: number; titulo: string; tituloOriginal: string; ano?: number; poster?: string };
export type ColecaoTmdb = { id: number; nome: string; fundo?: string; partes: ParteColecao[] };

const anoDe = (data?: string) => (data && /^\d{4}/.test(data) ? Number(data.slice(0, 4)) : undefined);

// Acha o filme pelo título (e ano, se souber). Escolhe o resultado cujo
// título (pt ou original) mais bate com o buscado; empate → mais popular.
export async function filmePorTitulo(titulo: string, ano?: number): Promise<FilmeTmdb | null> {
    const busca = await chamar<any>("/search/movie", { query: titulo, language: "pt-BR", include_adult: "false", year: ano ? String(ano) : undefined });
    const resultados: any[] = (busca && busca.results) || [];
    if (!resultados.length) return null;
    const alvo = normalizar(titulo);
    const pontua = (r: any) => {
        const a = normalizar(r.title), b = normalizar(r.original_title);
        return (a === alvo || b === alvo ? 100 : a.indexOf(alvo) === 0 || alvo.indexOf(a) === 0 ? 40 : 0) + Math.min(30, (r.popularity || 0) / 10) + (r.vote_count > 50 ? 10 : 0);
    };
    const ordenados = resultados.slice(0, 8).sort((x, y) => pontua(y) - pontua(x));
    let melhor = ordenados[0];
    // Título exato mas obscuro ("Os Vingadores" de 1998) e existe um
    // "Título: Subtítulo" MUITO mais visto ("Os Vingadores: The Avengers",
    // 2012) → os painéis quase sempre têm o famoso. Não troca quando o exato
    // também é conhecido ("Batman" de 1989 continua Batman).
    const famoso = resultados.find((r: any) => normalizar(r.title).indexOf(alvo + " ") === 0 && /:/.test(r.title) && (r.vote_count || 0) >= 10 * Math.max(1, melhor.vote_count || 0));
    if (famoso && !ano) melhor = famoso;
    const d = await chamar<any>(`/movie/${melhor.id}`, { language: "pt-BR" });
    if (!d) return null;
    return {
        tmdbId: d.id,
        titulo: d.title,
        tituloOriginal: d.original_title,
        ano: anoDe(d.release_date),
        sinopse: d.overview || undefined,
        nota: d.vote_average ? Math.round(d.vote_average * 10) / 10 : undefined,
        generos: (d.genres || []).map((g: any) => g.name),
        duracaoMin: d.runtime || undefined,
        poster: img(d.poster_path, "w500"),
        fundo: img(d.backdrop_path, "w1280"),
        colecao: d.belongs_to_collection ? { id: d.belongs_to_collection.id, nome: d.belongs_to_collection.name } : undefined,
    };
}

// Coleção (saga) com os filmes em ordem de lançamento.
export async function colecaoPorId(id: number): Promise<ColecaoTmdb | null> {
    const c = await chamar<any>(`/collection/${id}`, { language: "pt-BR" });
    if (!c) return null;
    const partes: ParteColecao[] = (c.parts || [])
        .filter((p: any) => p.release_date) // ainda sem data = não lançado
        .sort((a: any, b: any) => String(a.release_date).localeCompare(String(b.release_date)))
        .map((p: any) => ({ tmdbId: p.id, titulo: p.title, tituloOriginal: p.original_title, ano: anoDe(p.release_date), poster: img(p.poster_path, "w342") }));
    return { id: c.id, nome: c.name, fundo: img(c.backdrop_path, "w1280"), partes };
}

// Termo de busca → coleção (ex.: "007", "vingadores", "toy story").
export async function colecaoPorBusca(termo: string): Promise<ColecaoTmdb | null> {
    const r = await chamar<any>("/search/collection", { query: termo, language: "pt-BR" });
    const primeira = r && r.results && r.results[0];
    return primeira ? colecaoPorId(primeira.id) : null;
}

// Filmes parecidos (recomendações do TMDB — "quem viu também viu" — e, se
// vierem poucas, os "similares" por gênero/palavras-chave). Até 40.
export async function parecidosPorTitulo(titulo: string, ano?: number): Promise<ParteColecao[]> {
    const f = await filmePorTitulo(titulo, ano);
    if (!f) return [];
    const rec = await chamar<any>(`/movie/${f.tmdbId}/recommendations`, { language: "pt-BR" });
    let lista: any[] = (rec && rec.results) || [];
    if (lista.length < 12) {
        const sim = await chamar<any>(`/movie/${f.tmdbId}/similar`, { language: "pt-BR" });
        lista = lista.concat((sim && sim.results) || []);
    }
    const vistos = new Set<number>([f.tmdbId]);
    return lista
        .filter((r) => r && !r.adult && !vistos.has(r.id) && (vistos.add(r.id), true))
        .slice(0, 40)
        .map((r) => ({ tmdbId: r.id, titulo: r.title, tituloOriginal: r.original_title, ano: anoDe(r.release_date), poster: img(r.poster_path, "w342") }));
}
