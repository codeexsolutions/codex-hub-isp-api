import { Router, Request, Response } from "express";
import { jogosDoDia } from "../controllers/futebol/jogos";
import { tabela, timeDetalhe, jogoDetalhe, capaDoJogo } from "../controllers/futebol/dados";

// Futebol pro app Synk TV: jogos do dia com escudos, cores, placar e minuto.
const futebolRoute = Router();

// GET /futebol/jogos            → ao vivo + próximas 36h + últimas 12h
// GET /futebol/jogos?dia=20261108 → um dia específico
futebolRoute.get("/jogos", async (req: Request, res: Response) => {
    const dia = /^\d{8}$/.test(String(req.query.dia || "")) ? String(req.query.dia) : undefined;
    const jogos = await jogosDoDia(dia);
    res.set("Cache-Control", "public, max-age=60");
    res.json({ atualizadoEm: new Date().toISOString(), jogos });
});

// GET /futebol/tabela/bra.1 → classificação com escudos
futebolRoute.get("/tabela/:liga", async (req: Request, res: Response) => {
    const t = await tabela(String(req.params.liga));
    if (!t) return res.status(404).json({ erro: "sem tabela" });
    res.set("Cache-Control", "public, max-age=300");
    res.json({ tabela: t });
});

// GET /futebol/time/bra.1/3445 → time + elenco (fotos recortadas quando há)
futebolRoute.get("/time/:liga/:id", async (req: Request, res: Response) => {
    const t = await timeDetalhe(String(req.params.liga), String(req.params.id));
    if (!t) return res.status(404).json({ erro: "time não encontrado" });
    res.set("Cache-Control", "public, max-age=3600");
    res.json({ time: t });
});

// GET /futebol/jogo/bra.1/401841302 → escalações, gols/cartões, estatísticas
futebolRoute.get("/jogo/:liga/:id", async (req: Request, res: Response) => {
    const j = await jogoDetalhe(String(req.params.liga), String(req.params.id));
    if (!j) return res.status(404).json({ erro: "jogo não encontrado" });
    res.set("Cache-Control", "public, max-age=30");
    res.json({ jogo: j });
});

// GET /futebol/capa?ea=<escudo A>&ca=<cor A>&eb=…&cb=…&k=<id do jogo> → arte do jogo (JPEG)
futebolRoute.get("/capa", async (req: Request, res: Response) => {
    const q = req.query as Record<string, string>;
    const espn = (u?: string) => (u && /^https:\/\/a\.espncdn\.com\//.test(u) ? u : undefined); // só escudos da ESPN
    const cor = (c?: string) => (c && /^#?[0-9a-f]{6}$/i.test(c) ? (c.startsWith("#") ? c : "#" + c) : undefined);
    const k = String(q.k || "").replace(/[^a-z0-9.:_-]/gi, "").slice(0, 60);
    if (!k) return res.status(400).end();
    const r = await capaDoJogo({ escudo: espn(q.ea), cor: cor(q.ca) }, { escudo: espn(q.eb), cor: cor(q.cb) }, "futebol-capa:" + k).catch(() => null);
    if (!r) return res.status(502).end();
    res.set("Cache-Control", "public, max-age=2592000, immutable");
    res.set("Access-Control-Allow-Origin", "*");
    if (r.redirect) return res.redirect(302, r.redirect);
    res.set("Content-Type", "image/jpeg");
    return res.send(r.jpg);
});

export default futebolRoute;
