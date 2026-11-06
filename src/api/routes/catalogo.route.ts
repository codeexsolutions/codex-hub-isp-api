import { Router, Request, Response } from "express";
import { UNIVERSOS, VERSAO_UNIVERSOS } from "../controllers/catalogo/universos";
import { tmdbConfigurado, filmePorTitulo, colecaoPorId, colecaoPorBusca } from "../controllers/catalogo/tmdb";

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

export default catalogoRoute;
