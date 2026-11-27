import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, Server } from "http";
import { AddressInfo } from "net";
import { WebSocket, WebSocketServer } from "ws";
import { criarServidorSalas, CAMINHO_WS } from "./servidorSalas";

let http: Server;
let wss: WebSocketServer;
let url: string;

beforeAll(async () => {
    http = createServer();
    wss = criarServidorSalas(http);
    await new Promise<void>((r) => http.listen(0, r));
    url = `ws://127.0.0.1:${(http.address() as AddressInfo).port}${CAMINHO_WS}`;
});
afterAll(async () => {
    wss.close();
    await new Promise<void>((r) => http.close(() => r()));
});

// Cliente de teste: guarda tudo que chega e deixa esperar por um tipo.
function cliente() {
    const ws = new WebSocket(url);
    const caixa: any[] = [];
    const esperando: Array<{ t: string; r: (m: any) => void }> = [];
    ws.on("message", (b) => {
        const m = JSON.parse(String(b));
        const i = esperando.findIndex((e) => e.t === m.t);
        if (i >= 0) esperando.splice(i, 1)[0].r(m);
        else caixa.push(m);
    });
    const aberto = new Promise<void>((r) => ws.on("open", () => r()));
    return {
        ws,
        aberto,
        mandar: (m: unknown) => ws.send(JSON.stringify(m)),
        esperar: (t: string, ms = 2000) =>
            new Promise<any>((resolve, reject) => {
                const i = caixa.findIndex((m) => m.t === t);
                if (i >= 0) return resolve(caixa.splice(i, 1)[0]);
                const limite = setTimeout(() => reject(new Error("não chegou: " + t)), ms);
                esperando.push({ t, r: (m) => { clearTimeout(limite); resolve(m); } });
            }),
        nada: (t: string, ms = 300) => new Promise<boolean>((r) => setTimeout(() => r(!caixa.some((m) => m.t === t)), ms)),
    };
}

const FILME = { tipo: "filme", nome: "Duna", streamId: 123, extensao: "mp4" };

describe("salas (assistir junto)", () => {
    it("cria sala, outro perfil entra pelo código e os dois se veem", async () => {
        const g = cliente();
        await g.aberto;
        g.mandar({ t: "criar", perfil: { nome: "Guilherme", cor: "#2563EB" }, midia: FILME, tempo: 30, tocando: true });
        const sala = await g.esperar("sala");
        expect(sala.codigo).toMatch(/^[A-Z2-9]{6}$/);
        expect(sala.estado.midia).toEqual(FILME);
        expect(sala.estado.tempo).toBe(30);

        const n = cliente();
        await n.aberto;
        n.mandar({ t: "entrar", codigo: sala.codigo.toLowerCase(), perfil: { nome: "Natalia", cor: "#E5484D" } });
        const salaN = await n.esperar("sala");
        expect(salaN.membros.map((m: any) => m.nome)).toEqual(["Guilherme", "Natalia"]);
        expect(salaN.estado.midia).toEqual(FILME);
        const membros = await g.esperar("membros");
        expect(membros.membros).toHaveLength(2);
        g.ws.close();
        n.ws.close();
    });

    it("play/pausa/pular de um chega pros outros (não volta pra quem mandou)", async () => {
        const a = cliente();
        await a.aberto;
        a.mandar({ t: "criar", perfil: { nome: "João Pedro", cor: "#12A594" }, midia: FILME });
        const { codigo } = await a.esperar("sala");
        const b = cliente();
        await b.aberto;
        b.mandar({ t: "entrar", codigo, perfil: { nome: "Suzaly", cor: "#F5A623" } });
        await b.esperar("sala");
        await a.esperar("membros");

        b.mandar({ t: "estado", midia: FILME, tempo: 600, tocando: false });
        const e = await a.esperar("estado");
        expect(e.estado).toMatchObject({ tempo: 600, tocando: false });
        expect(typeof e.estado.em).toBe("number");
        expect(await b.nada("estado")).toBe(true);
        a.ws.close();
        b.ws.close();
    });

    it("chat e reação chegam pra todos; reação fora da lista é ignorada", async () => {
        const a = cliente();
        await a.aberto;
        a.mandar({ t: "criar", perfil: { nome: "Ana", cor: "#2563EB" } });
        const { codigo } = await a.esperar("sala");
        const b = cliente();
        await b.aberto;
        b.mandar({ t: "entrar", codigo, perfil: { nome: "Bia", cor: "#2563EB" } });
        await b.esperar("sala");

        b.mandar({ t: "chat", texto: "  pausa aí  " });
        expect((await a.esperar("chat")).msg).toMatchObject({ texto: "pausa aí", de: { nome: "Bia" } });
        expect((await b.esperar("chat")).msg.texto).toBe("pausa aí");

        b.mandar({ t: "reacao", emoji: "<script>" });
        expect(await a.nada("reacao")).toBe(true);
        b.mandar({ t: "reacao", emoji: "😂" });
        expect((await a.esperar("reacao")).emoji).toBe("😂");
        a.ws.close();
        b.ws.close();
    });

    it("nunca guarda URL/usuário/senha na mídia", async () => {
        const a = cliente();
        await a.aberto;
        a.mandar({
            t: "criar",
            perfil: { nome: "X", cor: "#2563EB" },
            midia: { ...FILME, uri: "http://srv:80/movie/USER/PASS/123.mp4", usuario: "USER", outro: "http://srv/movie/USER/PASS/1.mp4" },
        });
        const sala = await a.esperar("sala");
        expect(sala.estado.midia).toEqual(FILME);
        a.ws.close();
    });

    it("código errado → erro; quem sai some da lista", async () => {
        const a = cliente();
        await a.aberto;
        a.mandar({ t: "entrar", codigo: "ZZZZZZ", perfil: { nome: "A", cor: "#2563EB" } });
        expect((await a.esperar("erro")).motivo).toMatch(/não encontrada/);

        a.mandar({ t: "criar", perfil: { nome: "A", cor: "#2563EB" } });
        const { codigo } = await a.esperar("sala");
        const b = cliente();
        await b.aberto;
        b.mandar({ t: "entrar", codigo, perfil: { nome: "B", cor: "#2563EB" } });
        await b.esperar("sala");
        await a.esperar("membros");
        b.ws.close();
        const m = await a.esperar("membros");
        expect(m.membros.map((x: any) => x.nome)).toEqual(["A"]);
        a.ws.close();
    });

    it("ping devolve o relógio do servidor", async () => {
        const a = cliente();
        await a.aberto;
        a.mandar({ t: "ping", c: 42 });
        const p = await a.esperar("pong");
        expect(p.c).toBe(42);
        expect(Math.abs(p.s - Date.now())).toBeLessThan(1000);
        a.ws.close();
    });
});
