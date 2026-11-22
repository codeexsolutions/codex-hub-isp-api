import { Router, Request, Response } from "express";
import { UNIVERSOS, VERSAO_UNIVERSOS } from "../controllers/catalogo/universos";
import { tmdbConfigurado, filmePorTitulo, colecaoPorId, colecaoPorBusca, parecidosPorTitulo, episodiosPorTitulo, seriePorTituloCompleta, capasPorTitulo, SerieTmdb, EpisodioTmdb, CapasTmdb } from "../controllers/catalogo/tmdb";
import { lerFicha, salvarFicha, chaveFicha } from "../controllers/catalogo/fichasGuardadas";

// Catálogo próprio do Synk TV (dados nossos, por cima da lista do IPTV).
const catalogoRoute = Router();

// Universos/sagas: nomes oficiais, ordem e nomes alternativos — o app usa
// pra organizar a busca, os nomes e o "a seguir". Público e cacheável.
catalogoRoute.get("/universos", (_req: Request, res: Response) => {
    res.set("Cache-Control", "public, max-age=3600");
    res.json({ versao: VERSAO_UNIVERSOS, universos: UNIVERSOS });
});

// ---- TMDB (dados oficiais: pôster, fundo, sinopse, nota, coleção) ----
// Só leitura; o token fica na variável TMDB_TOKEN do servidor.

function semTmdb(res: Response): boolean {
    if (tmdbConfigurado()) return false;
    res.status(503).json({ erro: "TMDB não configurado" });
    return true;
}

// GET /catalogo/tmdb/filme?titulo=Harry Potter e a Pedra Filosofal&ano=2001
catalogoRoute.get("/tmdb/filme", async (req: Request, res: Response) => {
    if (semTmdb(res)) return;
    const titulo = String(req.query.titulo || "").trim().slice(0, 200);
    const ano = Number(req.query.ano) || undefined;
    if (!titulo) return res.status(400).json({ erro: "titulo obrigatório" });
    const filme = await filmePorTitulo(titulo, ano);
    res.set("Cache-Control", "public, max-age=86400");
    res.json({ filme });
});

// Pistas opcionais do painel (anime=1|0, temps=N, eps=N) pra escolher a
// série certa entre homônimas (One Piece anime x live action).
function dicasDe(req: Request) {
    const anime = req.query.anime === "1" ? true : req.query.anime === "0" ? false : undefined;
    const temporadas = Number(req.query.temps) || undefined;
    const episodios = Number(req.query.eps) || undefined;
    return { anime, temporadas, episodios };
}

// GET /catalogo/tmdb/serie?titulo=Suits&ano=2011 → sinopse, nota, gêneros…
catalogoRoute.get("/tmdb/serie", async (req: Request, res: Response) => {
    if (semTmdb(res)) return;
    const titulo = String(req.query.titulo || "").trim().slice(0, 200);
    const ano = Number(req.query.ano) || undefined;
    if (!titulo) return res.status(400).json({ erro: "titulo obrigatório" });
    const dicas = dicasDe(req);
    // ficha guardada de vez no banco (sinopse etc.) — o TMDB só na 1ª vez
    const chave = chaveFicha("serie", titulo, ano, [dicas.anime, dicas.temporadas, dicas.episodios]);
    let serie = await lerFicha<SerieTmdb>(chave);
    if (!serie) {
        serie = (await seriePorTituloCompleta(titulo, ano, dicas)) || undefined;
        if (serie && serie.sinopse) salvarFicha(chave, serie);
    }
    res.set("Cache-Control", "public, max-age=86400");
    res.json({ serie: serie || null });
});

// GET /catalogo/tmdb/episodios?titulo=Suits&temporada=1&ano=2011 → nome,
// resumo, imagem e duração de cada episódio da temporada
catalogoRoute.get("/tmdb/episodios", async (req: Request, res: Response) => {
    if (semTmdb(res)) return;
    const titulo = String(req.query.titulo || "").trim().slice(0, 200);
    const temporada = Number(req.query.temporada) || 1;
    const ano = Number(req.query.ano) || undefined;
    if (!titulo) return res.status(400).json({ erro: "titulo obrigatório" });
    const dicas = dicasDe(req);
    const chave = chaveFicha("episodios", titulo, ano, [dicas.anime, dicas.temporadas, dicas.episodios, temporada]);
    let episodios = await lerFicha<EpisodioTmdb[]>(chave);
    if (!episodios) {
        episodios = await episodiosPorTitulo(titulo, temporada, ano, dicas);
        // Só guarda de vez temporada COMPLETA (todo episódio com nome e
        // resumo): temporada ainda passando ou sem tradução volta ao TMDB.
        if (episodios.length && episodios.every((e) => e.nome && e.sinopse)) salvarFicha(chave, episodios);
    }
    res.set("Cache-Control", "public, max-age=86400");
    res.json({ episodios });
});

// GET /catalogo/tmdb/capas?tipo=filme|serie&titulo=Suits&ano=2011 → capas
// deitadas (cenas 16:9 + logo) — o app escolhe uma por perfil (estilo
// Netflix). Guardadas de vez no banco depois da 1ª busca.
catalogoRoute.get("/tmdb/capas", async (req: Request, res: Response) => {
    if (semTmdb(res)) return;
    const tipo = req.query.tipo === "serie" ? "serie" : "filme";
    const titulo = String(req.query.titulo || "").trim().slice(0, 200);
    const ano = Number(req.query.ano) || undefined;
    if (!titulo) return res.status(400).json({ erro: "titulo obrigatório" });
    const dicas = dicasDe(req);
    const chave = chaveFicha("capas", titulo, ano, [tipo, dicas.anime]);
    let capas = await lerFicha<CapasTmdb>(chave);
    if (!capas) {
        capas = (await capasPorTitulo(tipo, titulo, ano, tipo === "serie" ? dicas : {})) || undefined;
        if (capas && capas.fundos.length) salvarFicha(chave, capas);
    }
    res.set("Cache-Control", "public, max-age=86400");
    res.json({ capas: capas || null });
});

// GET /catalogo/tmdb/colecao/1241  → saga em ordem de lançamento
catalogoRoute.get("/tmdb/colecao/:id", async (req: Request, res: Response) => {
    if (semTmdb(res)) return;
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ erro: "id inválido" });
    const colecao = await colecaoPorId(id);
    res.set("Cache-Control", "public, max-age=86400");
    res.json({ colecao });
});

// GET /catalogo/tmdb/colecao?busca=007
catalogoRoute.get("/tmdb/colecao", async (req: Request, res: Response) => {
    if (semTmdb(res)) return;
    const busca = String(req.query.busca || "").trim().slice(0, 100);
    if (busca.length < 2) return res.status(400).json({ erro: "busca obrigatória" });
    const colecao = await colecaoPorBusca(busca);
    res.set("Cache-Control", "public, max-age=86400");
    res.json({ colecao });
});

// GET /catalogo/tmdb/parecidos?titulo=Matrix&ano=1999 → recomendações
catalogoRoute.get("/tmdb/parecidos", async (req: Request, res: Response) => {
    if (semTmdb(res)) return;
    const titulo = String(req.query.titulo || "").trim().slice(0, 200);
    const ano = Number(req.query.ano) || undefined;
    if (!titulo) return res.status(400).json({ erro: "titulo obrigatório" });
    const filmes = await parecidosPorTitulo(titulo, ano);
    res.set("Cache-Control", "public, max-age=86400");
    res.json({ filmes });
});

export default catalogoRoute;
