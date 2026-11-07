import { Router, Request, Response } from "express";
import { jogosDoDia } from "../controllers/futebol/jogos";

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

export default futebolRoute;
