import type { Server as HttpServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";

// SALAS do Synk TV — "assistir junto" (o Synk do nome: sincronia).
// Perfis de contas diferentes entram na mesma sala por um código de 6 letras;
// cada um toca o filme com a PRÓPRIA conta IPTV (a sala só carrega QUAL
// filme e EM QUE PONTO — nunca usuário/senha nem a URL de ninguém).
//
// Tudo em memória (salas são passageiras: somem 3 h depois de ficarem
// vazias). Protocolo JSON, uma mensagem por frame:
//
//  app → servidor
//    { t: "criar",  perfil, midia? }        cria e entra (resposta: "sala")
//    { t: "entrar", codigo, perfil }        entra (resposta: "sala" ou "erro")
//    { t: "estado", midia, tempo, tocando } alguém deu play/pausa/pulou/trocou
//    { t: "chat",   texto }
//    { t: "reacao", emoji }
//    { t: "ping",   c }                     relógio (resposta: "pong")
//    { t: "sair" }
//  servidor → app
//    { t: "sala", codigo, voce, membros, estado, mensagens }
//    { t: "membros", membros }
//    { t: "estado", estado }                estado.em = relógio do servidor
//    { t: "chat", msg } / { t: "reacao", de, emoji }
//    { t: "pong", c, s } / { t: "erro", motivo }

export type Perfil = { nome: string; cor: string };
export type Midia = Record<string, unknown> & { tipo: string; nome: string };
export type Estado = { midia: Midia | null; tempo: number; tocando: boolean; em: number; por: string | null };
type Membro = { id: string; perfil: Perfil; ws: WebSocket; vivo: boolean; janela: number[] };
type Mensagem = { id: string; de: Perfil & { id: string }; texto: string; em: number };
type Sala = { codigo: string; membros: Map<string, Membro>; estado: Estado; mensagens: Mensagem[]; vaziaDesde: number | null };

export const CAMINHO_WS = "/v1/salas/ws";
const MAX_MEMBROS = 12;
const MAX_SALAS = 2000;
const MAX_BYTES = 4096;
const MAX_TEXTO = 300;
const HISTORICO_CHAT = 100;
const SALA_VAZIA_MS = 3 * 60 * 60 * 1000; // vazia: dura 3h (quem saiu do player ou fechou o app ainda volta)
const LIMITE_MSGS = 30; // por membro, a cada 10s
const JANELA_MS = 10 * 1000;
const REACOES = ["😂", "❤️", "😱", "👏", "🔥", "😢", "😮", "👍"];
// sem letras/números que confundem na TV (0/O, 1/I/L)
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const salas = new Map<string, Sala>();

function novoCodigo(): string {
    for (let tentativa = 0; tentativa < 50; tentativa++) {
        let c = "";
        for (let i = 0; i < 6; i++) c += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
        if (!salas.has(c)) return c;
    }
    throw new Error("sem código livre");
}

const novoId = () => Math.random().toString(36).slice(2, 10);

function limparPerfil(p: unknown): Perfil | null {
    if (!p || typeof p !== "object") return null;
    const nome = String((p as any).nome || "").trim().slice(0, 24);
    const cor = String((p as any).cor || "");
    if (!nome) return null;
    return { nome, cor: /^#[0-9a-fA-F]{6}$/.test(cor) ? cor : "#8B5CF6" };
}

// Mídia: só campos simples e curtos (é o que cada app usa pra achar o MESMO
// filme no próprio provedor). Nada de URL — ela teria usuário/senha.
function limparMidia(m: unknown): Midia | null {
    if (!m || typeof m !== "object") return null;
    const saida: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(m as Record<string, unknown>).slice(0, 16)) {
        if (/url|uri|senha|usuario|password|username/i.test(k)) continue;
        if (typeof v === "number" && isFinite(v)) saida[k] = v;
        else if (typeof v === "string") {
            if (/^https?:\/\//i.test(v) && /\/(movie|series|live)\/[^/]+\/[^/]+\//i.test(v)) continue; // URL com credenciais
            saida[k] = v.slice(0, 300);
        } else if (typeof v === "boolean") saida[k] = v;
    }
    if (typeof saida.tipo !== "string" || typeof saida.nome !== "string") return null;
    return saida as Midia;
}

function listaMembros(sala: Sala) {
    return Array.from(sala.membros.values()).map((m) => ({ id: m.id, ...m.perfil }));
}

function enviar(ws: WebSocket, dados: unknown) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(dados));
}

function paraTodos(sala: Sala, dados: unknown, exceto?: string) {
    const texto = JSON.stringify(dados);
    sala.membros.forEach((m) => {
        if (m.id !== exceto && m.ws.readyState === WebSocket.OPEN) m.ws.send(texto);
    });
}

function sairDaSala(sala: Sala, membroId: string) {
    if (!sala.membros.delete(membroId)) return;
    if (sala.membros.size === 0) sala.vaziaDesde = Date.now();
    else paraTodos(sala, { t: "membros", membros: listaMembros(sala) });
}

// Varredura: apaga salas vazias há mais de 3 h.
function varrer() {
    const agora = Date.now();
    salas.forEach((sala, codigo) => {
        if (sala.membros.size === 0 && sala.vaziaDesde && agora - sala.vaziaDesde > SALA_VAZIA_MS) salas.delete(codigo);
    });
}

export function criarServidorSalas(http: HttpServer, caminho = CAMINHO_WS): WebSocketServer {
    const wss = new WebSocketServer({ server: http, path: caminho, maxPayload: MAX_BYTES });

    wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
        let sala: Sala | null = null;
        let membro: Membro | null = null;

        const entrarNa = (s: Sala, perfil: Perfil) => {
            if (s.membros.size >= MAX_MEMBROS) return enviar(ws, { t: "erro", motivo: "Sala cheia." });
            if (sala && membro) sairDaSala(sala, membro.id);
            membro = { id: novoId(), perfil, ws, vivo: true, janela: [] };
            s.membros.set(membro.id, membro);
            s.vaziaDesde = null;
            sala = s;
            enviar(ws, { t: "sala", codigo: s.codigo, voce: membro.id, membros: listaMembros(s), estado: s.estado, mensagens: s.mensagens });
            paraTodos(s, { t: "membros", membros: listaMembros(s) }, membro.id);
        };

        ws.on("pong", () => {
            if (membro) membro.vivo = true;
        });

        ws.on("message", (bruto) => {
            let msg: any;
            try {
                msg = JSON.parse(String(bruto));
            } catch {
                return;
            }
            if (!msg || typeof msg.t !== "string") return;

            // limite de mensagens por membro (anti-flood)
            if (membro) {
                const agora = Date.now();
                membro.janela = membro.janela.filter((x) => agora - x < JANELA_MS);
                if (membro.janela.length >= LIMITE_MSGS && msg.t !== "ping") return;
                membro.janela.push(agora);
            }

            switch (msg.t) {
                case "ping":
                    return enviar(ws, { t: "pong", c: msg.c, s: Date.now() });

                case "criar": {
                    const perfil = limparPerfil(msg.perfil);
                    if (!perfil) return enviar(ws, { t: "erro", motivo: "Perfil inválido." });
                    if (salas.size >= MAX_SALAS) varrer();
                    if (salas.size >= MAX_SALAS) return enviar(ws, { t: "erro", motivo: "Muitas salas abertas agora. Tente de novo em instantes." });
                    const midia = limparMidia(msg.midia);
                    const tempo = Math.max(0, Number(msg.tempo) || 0);
                    const s: Sala = {
                        codigo: novoCodigo(),
                        membros: new Map(),
                        estado: { midia, tempo, tocando: !!msg.tocando && !!midia, em: Date.now(), por: null },
                        mensagens: [],
                        vaziaDesde: null,
                    };
                    salas.set(s.codigo, s);
                    return entrarNa(s, perfil);
                }

                case "entrar": {
                    const perfil = limparPerfil(msg.perfil);
                    if (!perfil) return enviar(ws, { t: "erro", motivo: "Perfil inválido." });
                    const s = salas.get(String(msg.codigo || "").trim().toUpperCase());
                    if (!s) return enviar(ws, { t: "erro", motivo: "Sala não encontrada. Confira o código." });
                    return entrarNa(s, perfil);
                }

                case "estado": {
                    if (!sala || !membro) return;
                    const midia = msg.midia === undefined ? sala.estado.midia : limparMidia(msg.midia);
                    const tempo = Number(msg.tempo);
                    sala.estado = {
                        midia,
                        tempo: isFinite(tempo) && tempo >= 0 ? tempo : 0,
                        tocando: !!msg.tocando,
                        em: Date.now(),
                        por: membro.id,
                    };
                    return paraTodos(sala, { t: "estado", estado: sala.estado }, membro.id);
                }

                case "chat": {
                    if (!sala || !membro) return;
                    const texto = String(msg.texto || "").trim().slice(0, MAX_TEXTO);
                    if (!texto) return;
                    const m: Mensagem = { id: novoId(), de: { id: membro.id, ...membro.perfil }, texto, em: Date.now() };
                    sala.mensagens.push(m);
                    if (sala.mensagens.length > HISTORICO_CHAT) sala.mensagens.shift();
                    return paraTodos(sala, { t: "chat", msg: m });
                }

                case "reacao": {
                    if (!sala || !membro) return;
                    const emoji = String(msg.emoji || "");
                    if (REACOES.indexOf(emoji) === -1) return;
                    return paraTodos(sala, { t: "reacao", de: { id: membro.id, ...membro.perfil }, emoji });
                }

                case "sair":
                    if (sala && membro) sairDaSala(sala, membro.id);
                    sala = null;
                    membro = null;
                    return;
            }
        });

        ws.on("close", () => {
            if (sala && membro) sairDaSala(sala, membro.id);
        });
        ws.on("error", () => {});
    });

    // Batimento: derruba quem sumiu sem fechar (TV desligada, Wi-Fi caiu) e
    // mantém a conexão viva através do proxy do Railway.
    const batimento = setInterval(() => {
        salas.forEach((sala) => {
            sala.membros.forEach((m) => {
                if (!m.vivo) {
                    m.ws.terminate();
                    sairDaSala(sala, m.id);
                    return;
                }
                m.vivo = false;
                try {
                    m.ws.ping();
                } catch {
                    // ignora
                }
            });
        });
        varrer();
    }, 25000);
    wss.on("close", () => clearInterval(batimento));

    return wss;
}

// Pra testes.
export function _salasAbertas(): number {
    return salas.size;
}
