import { Router, Request, Response } from "express";
import { painelF1 } from "../controllers/esportes/f1";
import { painelUfc } from "../controllers/esportes/ufc";
import { painelEua } from "../controllers/esportes/ligasEua";

// Esportes além do futebol pro app Synk TV (o futebol tem a rota /futebol):
// GET /esportes/f1   → próximo GP (sessões), calendário, campeonatos, última corrida, sessão ao vivo
// GET /esportes/ufc  → evento da semana (todas as lutas) + agenda
// GET /esportes/nba  → jogos + classificação Leste/Oeste
// GET /esportes/nfl  → jogos da semana + classificação AFC/NFC
// Fontes públicas (Jolpica, ESPN) com cache aqui — ver controllers/esportes.
const esportesRoute = Router();

const responder = (res: Response, dado: unknown, maxAge = 60) => {
    if (!dado) return res.status(502).json({ erro: "fonte indisponível" });
    res.set("Cache-Control", `public, max-age=${maxAge}`);
    return res.json({ atualizadoEm: new Date().toISOString(), painel: dado });
};

esportesRoute.get("/f1", async (_req: Request, res: Response) => responder(res, await painelF1()));
esportesRoute.get("/ufc", async (_req: Request, res: Response) => responder(res, await painelUfc()));
esportesRoute.get("/nba", async (_req: Request, res: Response) => responder(res, await painelEua("nba"), 30));
esportesRoute.get("/nfl", async (_req: Request, res: Response) => responder(res, await painelEua("nfl"), 30));

export default esportesRoute;
