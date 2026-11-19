import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { urlPermitida } from "../controllers/capaVideo";
import { buscarMarcadores } from "../controllers/marcadores/repositorio";
import { pedirTemporada, pedirFilme, estadoDoWorker, marcadoresAtivos, Conta, EpisodioPedido } from "../controllers/marcadores/worker";

// Marcadores de abertura e créditos pro player do Synk TV ("Pular abertura",
// "Próximo episódio", "A seguir" no começo real dos créditos).
//
// POST /marcadores/temporada  { servidor, usuario?, senha?, serieId, temporada, episodios: [{ id, numero, extensao }] }
// POST /marcadores/filme      { servidor, usuario?, senha?, streamId, extensao }
//   → { statusCode, message, data: { marcadores: { [id]: { aberturaInicio, aberturaFim, creditosInicio } }, analisando } }
//   Devolve o que já se sabe. Com usuário e senha, o que faltar entra na
//   fila do worker (ver controllers/marcadores/worker.ts) — o app pergunta
//   de novo na próxima vez que abrir o episódio.
// GET  /marcadores/estado     → fila, cota do dia (sem dados de ninguém)

const marcadoresRoute = Router();

marcadoresRoute.use(
    rateLimit({
        windowMs: 60 * 1000,
        limit: 60,
        standardHeaders: true,
        legacyHeaders: false,
        message: { statusCode: 429, message: "Muitas consultas.", data: { marcadores: {}, analisando: false } },
    })
);

function normalizarServidor(url: string): string {
    let s = String(url || "").trim();
    if (!s) return s;
    if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
    return s.replace(/\/+$/, "");
}

// Servidor → base pra montar as URLs + "host:porta" que identifica o painel
// no banco (sem usuário/senha).
function lerServidor(bruto: unknown): { base: string; host: string } | null {
    const base = normalizarServidor(String(bruto || ""));
    if (!base || !urlPermitida(base)) return null;
    try {
        return { base, host: new URL(base).host.toLowerCase() };
    } catch {
        return null;
    }
}

const idValido = (v: unknown) => /^\d{1,12}$/.test(String(v ?? ""));
const extensaoValida = (v: unknown) => (/^[a-z0-9]{2,5}$/i.test(String(v ?? "")) ? String(v).toLowerCase() : "mp4");

function conta(base: string, corpo: any): Conta | null {
    const usuario = typeof corpo.usuario === "string" ? corpo.usuario : "";
    const senha = typeof corpo.senha === "string" ? corpo.senha : "";
    return usuario && senha ? { base, usuario, senha } : null;
}

const resposta = (res: Response, marcadores: Record<string, unknown>, analisando: boolean) =>
    res.json({ statusCode: 200, message: "ok", data: { marcadores, analisando } });

const semPonto = (m: { aberturaInicio: number | null; aberturaFim: number | null; creditosInicio: number | null }) => ({
    aberturaInicio: m.aberturaInicio,
    aberturaFim: m.aberturaFim,
    creditosInicio: m.creditosInicio,
});

marcadoresRoute.post("/temporada", async (req: Request, res: Response) => {
    const corpo = req.body || {};
    const srv = lerServidor(corpo.servidor);
    const serieId = Number(corpo.serieId);
    const temporada = Number(corpo.temporada);
    if (!srv || !Number.isInteger(serieId) || !Number.isInteger(temporada) || !Array.isArray(corpo.episodios))
        return res.status(400).json({ statusCode: 400, message: "Pedido inválido.", data: null });

    const episodios: EpisodioPedido[] = corpo.episodios
        .filter((e: any) => e && idValido(e.id))
        .slice(0, 300)
        .map((e: any, i: number) => ({ id: String(e.id), numero: Number.isFinite(Number(e.numero)) ? Number(e.numero) : i + 1, extensao: extensaoValida(e.extensao) }));
    if (!episodios.length) return resposta(res, {}, false);

    try {
        const { prontos, resolvidos } = await buscarMarcadores(srv.host, "episodio", episodios.map((e) => e.id));
        const marcadores: Record<string, unknown> = {};
        for (const m of prontos) marcadores[m.id] = semPonto(m);
        const faltando = episodios.filter((e) => !resolvidos.has(e.id)).map((e) => e.id);
        const c = conta(srv.base, corpo);
        const analisando = !!(faltando.length && c && marcadoresAtivos() && pedirTemporada(srv.host, c, serieId, temporada, episodios, faltando));
        return resposta(res, marcadores, analisando);
    } catch (e: any) {
        console.error("[marcadores] consulta da temporada falhou:", String(e?.message || e).slice(0, 160));
        return resposta(res, {}, false); // o player segue sem marcadores
    }
});

marcadoresRoute.post("/filme", async (req: Request, res: Response) => {
    const corpo = req.body || {};
    const srv = lerServidor(corpo.servidor);
    if (!srv || !idValido(corpo.streamId)) return res.status(400).json({ statusCode: 400, message: "Pedido inválido.", data: null });
    const id = String(corpo.streamId);
    try {
        const { prontos, resolvidos } = await buscarMarcadores(srv.host, "filme", [id]);
        const marcadores: Record<string, unknown> = {};
        for (const m of prontos) marcadores[m.id] = semPonto(m);
        const c = conta(srv.base, corpo);
        const analisando = !!(!resolvidos.has(id) && c && marcadoresAtivos() && pedirFilme(srv.host, c, id, extensaoValida(corpo.extensao)));
        return resposta(res, marcadores, analisando);
    } catch (e: any) {
        console.error("[marcadores] consulta do filme falhou:", String(e?.message || e).slice(0, 160));
        return resposta(res, {}, false);
    }
});

marcadoresRoute.get("/estado", (_req: Request, res: Response) => {
    res.json({ statusCode: 200, message: "ok", data: estadoDoWorker() });
});

export default marcadoresRoute;
