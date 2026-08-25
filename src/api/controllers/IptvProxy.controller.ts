import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { Readable } from "stream";

// O app central (synk-app) é servido em HTTPS — o navegador bloqueia qualquer
// chamada pra um servidor Xtream em HTTP puro (comum nesse mercado) por
// "mixed content", tanto a API quanto o próprio vídeo. Esse proxy resolve os
// dois: as chamadas de API viram POST pro nosso backend (servidor-a-servidor,
// sem restrição de mixed content), e o stream ao vivo passa pelo Manifesto/
// Segmento abaixo, que buscam o conteúdo em HTTP e devolvem por HTTPS.
// Escopo: só canais ao vivo (o único tipo de conteúdo do módulo IPTV no app
// central — filme/série ficam só no app Synk TV nativo).

function normalizarServidor(url: string): string {
    let s = (url || "").trim();
    if (!s) return s;
    if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
    return s.replace(/\/+$/, "");
}

@injectable()
export default class IptvProxyController {

    async Autenticar(req: Request, res: Response) {
        try {
            const { servidor, usuario, senha } = req.body;
            const base = normalizarServidor(servidor);
            const url = `${base}/player_api.php?username=${encodeURIComponent(usuario)}&password=${encodeURIComponent(senha)}`;
            const upstream = await fetch(url);
            if (!upstream.ok) return res.json({ data: { auth: false, mensagem: `Servidor respondeu ${upstream.status}` } });

            const json: any = await upstream.json().catch(() => null);
            const info = json?.user_info;
            if (!info) return res.json({ data: { auth: false, mensagem: "Resposta inesperada do servidor" } });

            return res.json({
                data: {
                    auth: Number(info.auth) === 1,
                    status: info.status,
                    mensagem: info.status !== "Active" ? `Conta ${info.status ?? "inválida"}` : undefined,
                },
            });
        } catch {
            return res.json({ data: { auth: false, mensagem: "Não foi possível conectar ao servidor." } });
        }
    }

    async Categorias(req: Request, res: Response) {
        try {
            const { servidor, usuario, senha } = req.body;
            const base = normalizarServidor(servidor);
            const url = `${base}/player_api.php?username=${encodeURIComponent(usuario)}&password=${encodeURIComponent(senha)}&action=get_live_categories`;
            const upstream = await fetch(url);
            const json = upstream.ok ? await upstream.json() : [];
            return res.json({ data: Array.isArray(json) ? json : [] });
        } catch {
            return res.json({ data: [] });
        }
    }

    async Canais(req: Request, res: Response) {
        try {
            const { servidor, usuario, senha } = req.body;
            const base = normalizarServidor(servidor);
            const url = `${base}/player_api.php?username=${encodeURIComponent(usuario)}&password=${encodeURIComponent(senha)}&action=get_live_streams`;
            const upstream = await fetch(url);
            const json = upstream.ok ? await upstream.json() : [];
            return res.json({ data: Array.isArray(json) ? json : [] });
        } catch {
            return res.json({ data: [] });
        }
    }

    // Manifesto (.m3u8) — busca no servidor Xtream e reescreve cada segmento
    // pra passar de novo pelo nosso proxy (senão o navegador bloqueia eles,
    // já que apontam pro servidor HTTP original).
    async Manifesto(req: Request, res: Response) {
        try {
            const { servidor, usuario, senha, streamId } = req.query as Record<string, string>;
            const base = normalizarServidor(servidor);
            const url = `${base}/live/${encodeURIComponent(usuario)}/${encodeURIComponent(senha)}/${streamId}.m3u8`;
            const upstream = await fetch(url);
            if (!upstream.ok) return res.status(upstream.status).end();

            const texto = await upstream.text();
            const baseUpstream = upstream.url; // URL final, já após redirecionamentos

            const reescrito = texto
                .split("\n")
                .map((linha) => {
                    const l = linha.trim();
                    if (!l || l.startsWith("#")) return linha;
                    const absoluta = /^https?:\/\//i.test(l) ? l : new URL(l, baseUpstream).toString();
                    return `/v1/iptv/proxy/segmento?u=${encodeURIComponent(Buffer.from(absoluta).toString("base64"))}`;
                })
                .join("\n");

            res.set("Content-Type", "application/vnd.apple.mpegurl");
            res.set("Cache-Control", "no-store");
            return res.status(200).send(reescrito);
        } catch {
            return res.status(502).json({ message: "Não foi possível carregar o canal." });
        }
    }

    async Segmento(req: Request, res: Response) {
        try {
            const u = req.query.u as string;
            const upstreamUrl = Buffer.from(u, "base64").toString("utf-8");
            const upstream = await fetch(upstreamUrl);
            if (!upstream.ok || !upstream.body) return res.status(upstream.status || 502).end();

            res.set("Content-Type", upstream.headers.get("content-type") || "video/mp2t");
            res.set("Cache-Control", "no-store");
            Readable.fromWeb(upstream.body as any).pipe(res);
        } catch {
            return res.status(502).end();
        }
    }
}
