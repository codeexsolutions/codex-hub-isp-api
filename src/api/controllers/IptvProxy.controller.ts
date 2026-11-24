import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { Readable } from "stream";
import { quadroAoVivo, capaDoVideo, quadroNoSegundo, urlPermitida, diagnosticoFfmpeg } from "./capaVideo";
import { capaGuardada, guardarCapa, trechoGuardado, ehVideoDoPainel } from "./capasGuardadas";
import { pedirTrecho } from "./trechoVideo";
import { verificarImagens } from "./imagensPainel";

// O app central (synk-app) é servido em HTTPS — o navegador bloqueia qualquer
// chamada pra um servidor Xtream em HTTP puro (comum nesse mercado) por
// "mixed content", tanto a API quanto o próprio vídeo. Esse proxy resolve os
// dois: as chamadas de API viram POST pro nosso backend (servidor-a-servidor,
// sem restrição de mixed content), e o stream ao vivo passa pelo Manifesto/
// Segmento abaixo, que buscam o conteúdo em HTTP e devolvem por HTTPS.
// Escopo: só canais ao vivo (o único tipo de conteúdo do módulo IPTV no app
// central — filme/série ficam só no app Synk TV nativo).

// Limite de concorrência pro Manifesto/Segmento — não é abuso de UM IP (um
// único espectador já gera várias chamadas simultâneas, é assim que HLS
// funciona), é VOLUME total: muitos espectadores (ou vários travando e
// tentando outra cópia ao mesmo tempo) derrubaram essa instância uma vez
// (14h deployzada, Railway "Application failed to respond" até reiniciar na
// mão). Acima do teto, devolve 503 rápido em vez de empilhar mais uma
// chamada pro servidor IPTV de terceiro — o player tenta de novo sozinho.
const MAX_SEGMENTOS_SIMULTANEOS = 40;
let segmentosEmAndamento = 0;
const MAX_MANIFESTOS_SIMULTANEOS = 80;
let manifestosEmAndamento = 0;

function normalizarServidor(url: string): string {
    let s = (url || "").trim();
    if (!s) return s;
    if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
    return s.replace(/\/+$/, "");
}

// Faixas de IP privadas/loopback — nunca deixa o proxy alcançar a rede
// interna do servidor a partir de um "servidor" IPTV controlado pelo
// usuário (SSRF). Cobre só os casos óbvios (IPv4 privado/loopback/link-local
// e IPv6 loopback/link-local/ULA); não tenta blindar contra DNS rebinding —
// suficiente pro risco real aqui (servidor de IPTV de terceiro).
function enderecoProibido(hostname: string): boolean {
    const h = hostname.toLowerCase();
    if (h === "localhost" || h === "::1" || h === "0.0.0.0") return true;

    const partesIpv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (partesIpv4) {
        const [a, b] = [Number(partesIpv4[1]), Number(partesIpv4[2])];
        if (a === 127) return true;
        if (a === 10) return true;
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 192 && b === 168) return true;
        if (a === 169 && b === 254) return true;
        if (a === 100 && b >= 64 && b <= 127) return true;
        return false;
    }

    return h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd");
}

@injectable()
export default class IptvProxyController {

    // Relay genérico pro player_api.php — cobre as ações que Autenticar/
    // Categorias/Canais (abaixo) não cobrem: filmes, séries e seus detalhes
    // (get_vod_categories, get_vod_streams, get_series_categories,
    // get_series, get_vod_info, get_series_info). Usado pelo app Synk TV
    // (webOS/Tizen) pra TODAS as chamadas de API Xtream — alguns servidores
    // (proteção anti-bot tipo Cloudflare) bloqueiam a chamada quando ela
    // parte direto do navegador da TV, mas respondem normal quando parte do
    // backend (confirmado manualmente contra um servidor real). `params` é
    // repassado como querystring adicional pro player_api.php (ex.:
    // "action=get_vod_streams&category_id=5").
    async Chamar(req: Request, res: Response) {
        const { servidor, usuario, senha, params } = req.body as { servidor: string; usuario: string; senha: string; params?: string };

        const base = normalizarServidor(servidor);
        if (!base) return res.status(400).json({ statusCode: 400, message: "Parâmetro 'servidor' é obrigatório.", data: null });

        let alvo: URL;
        try {
            alvo = new URL(`${base}/player_api.php?username=${encodeURIComponent(usuario)}&password=${encodeURIComponent(senha)}${params ? `&${params}` : ""}`);
        } catch {
            return res.status(400).json({ statusCode: 400, message: "Servidor inválido.", data: null });
        }
        if (alvo.protocol !== "http:" && alvo.protocol !== "https:")
            return res.status(400).json({ statusCode: 400, message: "Servidor precisa usar http ou https.", data: null });
        if (enderecoProibido(alvo.hostname))
            return res.status(400).json({ statusCode: 400, message: "Servidor não permitido.", data: null });

        try {
            const upstream = await fetch(alvo.toString(), { headers: { Connection: "close" }, signal: AbortSignal.timeout(20000) });
            const texto = await upstream.text();
            res.status(upstream.ok ? 200 : upstream.status);
            res.type("application/json");
            return res.send(texto);
        } catch (error: any) {
            return res.status(502).json({ statusCode: 502, message: error?.message || "Não foi possível alcançar o servidor IPTV.", data: null });
        }
    }

    async Autenticar(req: Request, res: Response) {
        try {
            const { servidor, usuario, senha } = req.body;
            const base = normalizarServidor(servidor);
            const url = `${base}/player_api.php?username=${encodeURIComponent(usuario)}&password=${encodeURIComponent(senha)}`;
            const upstream = await fetch(url, { headers: { Connection: "close" }, signal: AbortSignal.timeout(20000) });
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
            const upstream = await fetch(url, { headers: { Connection: "close" }, signal: AbortSignal.timeout(20000) });
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
            const upstream = await fetch(url, { headers: { Connection: "close" }, signal: AbortSignal.timeout(20000) });
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
        if (manifestosEmAndamento >= MAX_MANIFESTOS_SIMULTANEOS) {
            res.set("Retry-After", "2");
            return res.status(503).json({ message: "Servidor de proxy sobrecarregado, tente de novo em instantes." });
        }
        manifestosEmAndamento++;
        res.on("close", () => { manifestosEmAndamento--; });

        try {
            const { servidor, usuario, senha, streamId } = req.query as Record<string, string>;
            const base = normalizarServidor(servidor);
            const url = `${base}/live/${encodeURIComponent(usuario)}/${encodeURIComponent(senha)}/${streamId}.m3u8`;

            let alvo: URL;
            try {
                alvo = new URL(url);
            } catch {
                return res.status(400).json({ message: "Servidor inválido." });
            }
            if (alvo.protocol !== "http:" && alvo.protocol !== "https:") return res.status(400).json({ message: "Servidor precisa usar http ou https." });
            if (enderecoProibido(alvo.hostname)) return res.status(400).json({ message: "Servidor não permitido." });

            const upstream = await fetch(url, { headers: { Connection: "close" }, signal: AbortSignal.timeout(15000) });
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

    // Capa de filme sem capa: um quadro do próprio vídeo (JPEG), tirado aqui
    // com ffmpeg — ver capaVideo.ts. GET ?u=<url do vídeo em base64>&p=0.5
    async Capa(req: Request, res: Response) {
        try {
            const u = String(req.query.u || "");
            const url = Buffer.from(u, "base64").toString("utf-8");
            const p = Math.min(0.9, Math.max(0.05, Number(req.query.p) || 0.2));
            if (!urlPermitida(url)) return res.status(400).end();
            // ?s=segundos → miniatura da barra de progresso (segundo exato)
            const s = req.query.s !== undefined ? Number(req.query.s) : NaN;
            const porSegundo = isFinite(s) && s >= 0;
            const variante = porSegundo ? `s${Math.round(s)}` : `p${Math.round(p * 100)}`;
            // Já tirada antes (por qualquer pessoa)? Vai direto pra foto
            // guardada no Supabase — sem ffmpeg, sem abrir o IPTV.
            const guardada = await capaGuardada(url, variante);
            if (guardada) {
                res.set("Cache-Control", "public, max-age=2592000, immutable");
                res.set("Access-Control-Allow-Origin", "*");
                return res.redirect(302, guardada);
            }
            const jpg = porSegundo ? await quadroNoSegundo(url, s) : await capaDoVideo(url, Math.round(p * 100) / 100);
            if (jpg) guardarCapa(url, variante, jpg); // guarda de vez (segundo plano)
            if (!jpg) {
                res.set("Cache-Control", "public, max-age=3600");
                return res.status(404).end();
            }
            res.set("Content-Type", "image/jpeg");
            res.set("Cache-Control", "public, max-age=2592000, immutable");
            res.set("Access-Control-Allow-Origin", "*");
            return res.status(200).send(jpg);
        } catch {
            return res.status(502).end();
        }
    }

    // Capas do painel guardadas no Storage (ver imagensPainel.ts).
    // POST { itens: [{ u: "<url da imagem>", w: 320 }, ...] } (até 60)
    //   → { guardadas: [true, false, ...] } — as que faltam entram na fila.
    async Imagens(req: Request, res: Response) {
        try {
            const itens = Array.isArray(req.body && req.body.itens) ? req.body.itens.slice(0, 60) : [];
            const guardadas = await verificarImagens(itens);
            res.set("Cache-Control", "no-store");
            return res.json({ guardadas });
        } catch {
            return res.status(502).json({ guardadas: [] });
        }
    }

    // Trecho DEFINITIVO da prévia (ver trechoVideo.ts).
    // GET ?u=<url do vídeo em base64>          → { url } se já guardado, senão { url: null }
    // GET ?u=...&gerar=1 (a prévia tocou de verdade) → também põe na fila pra guardar
    async Trecho(req: Request, res: Response) {
        try {
            const url = Buffer.from(String(req.query.u || ""), "base64").toString("utf-8");
            if (!urlPermitida(url) || !ehVideoDoPainel(url)) return res.status(400).json({ url: null });
            const guardado = await trechoGuardado(url);
            if (guardado) {
                res.set("Cache-Control", "public, max-age=2592000, immutable");
                return res.json({ url: guardado });
            }
            const naFila = req.query.gerar === "1" ? pedirTrecho(url) : false;
            res.set("Cache-Control", "no-store");
            return res.json({ url: null, gerando: naFila });
        } catch {
            return res.status(502).json({ url: null });
        }
    }

    // GET /iptv/proxy/ao-vivo?u=<url em base64> → JPEG de AGORA do canal
    // ao vivo (prévia das câmeras no player). Guardado ~2 min no servidor.
    async AoVivo(req: Request, res: Response) {
        try {
            const url = Buffer.from(String(req.query.u || ""), "base64").toString("utf-8");
            if (!urlPermitida(url)) return res.status(400).end();
            const jpg = await quadroAoVivo(url);
            res.set("Access-Control-Allow-Origin", "*");
            if (!jpg) {
                res.set("Cache-Control", "public, max-age=30");
                return res.status(404).end();
            }
            res.set("Content-Type", "image/jpeg");
            res.set("Cache-Control", "public, max-age=60");
            return res.status(200).send(jpg);
        } catch {
            return res.status(502).end();
        }
    }

    async CapaDiagnostico(_req: Request, res: Response) {
        try {
            const u = _req.query.u ? Buffer.from(String(_req.query.u), "base64").toString("utf-8") : undefined;
            return res.json(await diagnosticoFfmpeg(u));
        } catch (e: any) {
            return res.status(500).json({ erro: String(e?.message || e) });
        }
    }

    async Segmento(req: Request, res: Response) {
        if (segmentosEmAndamento >= MAX_SEGMENTOS_SIMULTANEOS) {
            res.set("Retry-After", "2");
            return res.status(503).end();
        }
        segmentosEmAndamento++;
        res.on("close", () => { segmentosEmAndamento--; });

        try {
            const u = req.query.u as string;
            const upstreamUrl = Buffer.from(u, "base64").toString("utf-8");

            let alvo: URL;
            try {
                alvo = new URL(upstreamUrl);
            } catch {
                return res.status(400).end();
            }
            if (alvo.protocol !== "http:" && alvo.protocol !== "https:") return res.status(400).end();
            if (enderecoProibido(alvo.hostname)) return res.status(400).end();

            // Timeout maior que o do Manifesto: aqui é o segmento de vídeo
            // inteiro (alguns MB), não só o texto da playlist — servidor de
            // teste mais lento já estourou os 15s antigos no meio do envio,
            // deixando a resposta pela metade (ERR_HTTP2_PROTOCOL_ERROR no
            // navegador em vez de um erro limpo).
            const upstream = await fetch(upstreamUrl, { headers: { Connection: "close" }, signal: AbortSignal.timeout(30000) });
            if (!upstream.ok || !upstream.body) return res.status(upstream.status || 502).end();

            res.set("Content-Type", upstream.headers.get("content-type") || "video/mp2t");
            res.set("Cache-Control", "no-store");
            const leitura = Readable.fromWeb(upstream.body as any);
            // Se o upstream cair no meio (abort do timeout, conexão
            // derrubada), destrói a resposta em vez de deixá-la pendurada
            // esperando um fim que nunca chega — é isso que gera o 200 OK
            // seguido de ERR_HTTP2_PROTOCOL_ERROR no navegador.
            leitura.on("error", () => res.destroy());
            leitura.pipe(res);
        } catch {
            return res.status(502).end();
        }
    }
}
