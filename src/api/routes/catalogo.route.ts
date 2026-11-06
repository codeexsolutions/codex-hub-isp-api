import { Router, Request, Response } from "express";
import { UNIVERSOS, VERSAO_UNIVERSOS } from "../controllers/catalogo/universos";

// Catálogo próprio do Synk TV (dados nossos, por cima da lista do IPTV).
const catalogoRoute = Router();

// Universos/sagas: nomes oficiais, ordem e nomes alternativos — o app usa
// pra organizar a busca, os nomes e o "a seguir". Público e cacheável.
catalogoRoute.get("/universos", (_req: Request, res: Response) => {
    res.set("Cache-Control", "public, max-age=3600");
    res.json({ versao: VERSAO_UNIVERSOS, universos: UNIVERSOS });
});

export default catalogoRoute;
