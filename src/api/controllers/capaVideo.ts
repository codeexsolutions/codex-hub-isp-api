import { spawn } from "child_process";
import { existsSync } from "fs";

// "Capa inventada" de filme sem capa: tira um quadro do próprio vídeo com o
// ffmpeg, aqui no servidor. O app da TV não consegue fazer isso sozinho
// quando o servidor IPTV não manda o cabeçalho CORS (o navegador bloqueia a
// leitura do quadro) — e assim a TV baixa só um JPEG pequeno, não pedaços
// do filme.
//
// Cuidados:
//   - no máximo 2 ffmpeg ao mesmo tempo (fila), com tempo limite;
//   - cache em memória (os mais recentes) + Cache-Control longo na resposta;
//   - só http(s) e nunca endereço interno (localhost, rede privada).

// Qual ffmpeg usar: FFMPEG_PATH (se definido) → binário do pacote
// ffmpeg-static (se o download dele rodou na instalação) → "ffmpeg" do
// sistema (ex.: instalado via pacote apt no Railway).
let caminhoFfmpeg = process.env.FFMPEG_PATH || "";
if (!caminhoFfmpeg) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const doPacote: string | null = require("ffmpeg-static");
        caminhoFfmpeg = doPacote && existsSync(doPacote) ? doPacote : "ffmpeg";
    } catch {
        caminhoFfmpeg = "ffmpeg";
    }
}

const MAX_SIMULTANEOS = 2;
const MAX_CACHE = 400;
const LIMITE_DURACAO_MS = 12000;
const LIMITE_QUADRO_MS = 25000;

const cache = new Map<string, Buffer>();
// Falhas (servidor fora, formato estranho) valem só por um tempo.
const falhas = new Map<string, number>();
const VALIDADE_FALHA_MS = 10 * 60 * 1000;
const emAndamento = new Map<string, Promise<Buffer | null>>();
let ativos = 0;
const fila: Array<() => void> = [];

function guardar(chave: string, valor: Buffer | null) {
    if (!valor) {
        falhas.set(chave, Date.now());
        if (falhas.size > MAX_CACHE * 2) falhas.clear();
        return;
    }
    cache.set(chave, valor);
    if (cache.size > MAX_CACHE) {
        const maisAntiga = cache.keys().next().value;
        if (maisAntiga !== undefined) cache.delete(maisAntiga);
    }
}

async function naVez<T>(tarefa: () => Promise<T>): Promise<T> {
    if (ativos >= MAX_SIMULTANEOS) await new Promise<void>((ok) => fila.push(ok));
    ativos++;
    try {
        return await tarefa();
    } finally {
        ativos--;
        const proximo = fila.shift();
        if (proximo) proximo();
    }
}

export function urlPermitida(url: string): boolean {
    let u: URL;
    try {
        u = new URL(url);
    } catch {
        return false;
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || h === "::1" || h === "[::1]") return false;
    const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(h);
    if (m) {
        const [a, b] = [Number(m[1]), Number(m[2])];
        if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 100 && b >= 64 && b <= 127)) return false;
    }
    return true;
}

function rodar(args: string[], limiteMs: number): Promise<{ saida: Buffer; erro: string }> {
    return new Promise((resolve) => {
        const proc = spawn(caminhoFfmpeg, args, { stdio: ["ignore", "pipe", "pipe"] });
        const partes: Buffer[] = [];
        let erro = "";
        const timer = setTimeout(() => proc.kill("SIGKILL"), limiteMs);
        proc.stdout.on("data", (d: Buffer) => partes.push(d));
        proc.stderr.on("data", (d: Buffer) => {
            if (erro.length < 20000) erro += d.toString();
        });
        const fim = () => {
            clearTimeout(timer);
            resolve({ saida: Buffer.concat(partes), erro });
        };
        proc.on("close", fim);
        proc.on("error", fim);
    });
}

async function duracaoSegundos(url: string): Promise<number> {
    // Sem arquivo de saída o ffmpeg só lê o cabeçalho e imprime "Duration:".
    const { erro } = await rodar(["-hide_banner", "-nostdin", "-rw_timeout", "10000000", "-i", url], LIMITE_DURACAO_MS);
    const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(erro);
    return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
}

async function quadroEm(url: string, segundos: number): Promise<Buffer | null> {
    const { saida } = await rodar(
        [
            "-hide_banner", "-nostdin", "-loglevel", "error",
            "-rw_timeout", "15000000",
            "-ss", String(Math.max(0, Math.floor(segundos))),
            "-i", url,
            "-frames:v", "1",
            "-vf", "scale=480:-2",
            "-q:v", "6",
            "-f", "image2", "-c:v", "mjpeg",
            "pipe:1",
        ],
        LIMITE_QUADRO_MS
    );
    return saida.length > 1000 ? saida : null;
}

// fracao: 0.5 = meio do filme; 0.2 = depois da abertura.
export function capaDoVideo(url: string, fracao: number): Promise<Buffer | null> {
    const chave = `${fracao}|${url}`;
    const pronta = cache.get(chave);
    if (pronta) return Promise.resolve(pronta);
    const falhou = falhas.get(chave);
    if (falhou && Date.now() - falhou < VALIDADE_FALHA_MS) return Promise.resolve(null);
    const andamento = emAndamento.get(chave);
    if (andamento) return andamento;

    const p = naVez(async () => {
        const total = await duracaoSegundos(url);
        const pontos = total > 0 ? [fracao, fracao + 0.08, fracao - 0.08].map((f) => total * Math.min(0.95, Math.max(0.02, f))) : [60, 180];
        for (const t of pontos) {
            const jpg = await quadroEm(url, t);
            // Quadro muito pequeno costuma ser tela preta (fade/cena escura): tenta o próximo ponto.
            if (jpg && jpg.length > 6000) return jpg;
        }
        return null;
    })
        .catch(() => null)
        .then((r) => {
            emAndamento.delete(chave);
            guardar(chave, r);
            return r;
        });
    emAndamento.set(chave, p);
    return p;
}

// Diagnóstico (sem dados sensíveis): qual ffmpeg está sendo usado, se ele
// roda, e qual commit está no ar — pra saber por que a capa falha em produção.
export async function diagnosticoFfmpeg(): Promise<Record<string, unknown>> {
    const { saida, erro } = await rodar(["-hide_banner", "-version"], 8000);
    const texto = (saida.toString() || erro).split(/\r?\n/)[0] || "";
    return {
        ffmpeg: caminhoFfmpeg,
        existe: caminhoFfmpeg === "ffmpeg" ? null : existsSync(caminhoFfmpeg),
        versao: texto.slice(0, 120) || null,
        commit: (process.env.RAILWAY_GIT_COMMIT_SHA || "").slice(0, 7) || null,
    };
}
