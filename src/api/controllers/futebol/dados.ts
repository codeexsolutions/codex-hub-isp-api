import sharp from "sharp";
import { capaGuardada, guardarCapa } from "../capasGuardadas";

// Dados de futebol pro app Synk TV, juntando DUAS fontes abertas:
//   - ESPN (site.api.espn.com): tabela, elenco, escalação com formação,
//     gols/cartões/substituições e estatísticas do jogo;
//   - TheSportsDB (chave de teste pública): foto RECORTADA (PNG
//     transparente) dos jogadores, arte de fundo do time, camisa, estádio.
// Não depende 100% de ninguém: tudo passa por um cache com RESERVA — se a
// fonte cair ou responder vazio, devolve a última versão boa que tiver.

const ESPN = "https://site.api.espn.com/apis";
const TSDB = "https://www.thesportsdb.com/api/v1/json/123";

/* --------------------------- cache com reserva --------------------------- */

const guardados = new Map<string, { em: number; valor: unknown }>();
const MAX = 800;

async function comReserva<T>(chave: string, validadeMs: number, buscar: () => Promise<T | null>): Promise<T | null> {
    const g = guardados.get(chave);
    if (g && Date.now() - g.em < validadeMs) return g.valor as T;
    const novo = await buscar().catch(() => null);
    if (novo !== null && novo !== undefined) {
        guardados.delete(chave);
        guardados.set(chave, { em: Date.now(), valor: novo });
        if (guardados.size > MAX) {
            const velha = guardados.keys().next().value;
            if (velha !== undefined) guardados.delete(velha);
        }
        return novo;
    }
    return g ? (g.valor as T) : null; // fonte fora: a última versão boa
}

async function json(url: string): Promise<any | null> {
    const r = await fetch(url, { signal: AbortSignal.timeout(9000) }).catch(() => null);
    if (!r || !r.ok) return null;
    return r.json().catch(() => null);
}

const norm = (t: string) =>
    (t || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

const ligaValida = (l: string) => /^[a-z]{2,10}(\.[a-z0-9_]{1,30})?$/.test(l);

/* -------------------------------- tabela -------------------------------- */

export type LinhaTabela = {
    pos: number;
    time: { id: string; nome: string; curto: string; escudo?: string; cor?: string };
    pts: number; j: number; v: number; e: number; d: number; gp: number; gc: number; sg: number;
    nota?: string; // "Libertadores", "Rebaixamento"…
};

export function tabela(liga: string): Promise<LinhaTabela[] | null> {
    if (!ligaValida(liga)) return Promise.resolve(null);
    return comReserva(`tabela:${liga}`, 10 * 60 * 1000, async () => {
        const d = await json(`${ESPN}/v2/sports/soccer/${liga}/standings`);
        const grupos = (d && d.children) || [];
        const entradas = grupos.flatMap((g: any) => (g.standings && g.standings.entries) || []);
        if (!entradas.length) return null;
        const st = (e: any, n: string) => {
            const s = (e.stats || []).find((x: any) => x.name === n);
            return s ? Number(s.value) || 0 : 0;
        };
        return entradas
            .map((e: any, i: number): LinhaTabela => ({
                pos: st(e, "rank") || i + 1,
                time: {
                    id: String(e.team.id),
                    nome: e.team.displayName,
                    curto: e.team.shortDisplayName || e.team.displayName,
                    escudo: e.team.logos && e.team.logos[0] ? e.team.logos[0].href : undefined,
                    cor: e.team.color ? "#" + e.team.color : undefined,
                },
                pts: st(e, "points"), j: st(e, "gamesPlayed"), v: st(e, "wins"), e: st(e, "ties"), d: st(e, "losses"),
                gp: st(e, "pointsFor"), gc: st(e, "pointsAgainst"), sg: st(e, "pointDifferential"),
                nota: e.note && e.note.description ? e.note.description : undefined,
            }))
            .sort((a: LinhaTabela, b: LinhaTabela) => a.pos - b.pos);
    });
}

/* ------------------------------ TheSportsDB ------------------------------ */

type TimeTsdb = { id: string; fundo?: string; camisa?: string; estadio?: string; fundado?: string; descricao?: string; jogadores: any[] };

function timeTsdb(nome: string): Promise<TimeTsdb | null> {
    return comReserva(`tsdb:${norm(nome)}`, 24 * 3600 * 1000, async () => {
        const d = await json(`${TSDB}/searchteams.php?t=${encodeURIComponent(nome)}`);
        const ts: any[] = (d && d.teams) || [];
        const t = ts.find((x) => x.strSport === "Soccer" && norm(x.strTeam) === norm(nome)) || ts.find((x) => x.strSport === "Soccer");
        if (!t) return null;
        const j = await json(`${TSDB}/lookup_all_players.php?id=${t.idTeam}`);
        return {
            id: t.idTeam,
            fundo: t.strFanart1 || t.strFanart2 || t.strBanner || undefined,
            camisa: t.strEquipment || undefined,
            estadio: t.strStadium || undefined,
            fundado: t.intFormedYear || undefined,
            descricao: t.strDescriptionPT || undefined,
            jogadores: (j && j.player) || [],
        };
    });
}

/* --------------------------------- time --------------------------------- */

export type Jogador = { id: string; nome: string; numero?: string; posicao: string; grupo: "Goleiros" | "Defensores" | "Meio-campistas" | "Atacantes" | "Outros"; idade?: number; pais?: string; foto?: string; recorte?: boolean };

const GRUPO: Record<string, Jogador["grupo"]> = { G: "Goleiros", D: "Defensores", M: "Meio-campistas", F: "Atacantes" };
function grupoDe(p: any): Jogador["grupo"] {
    const n = String((p && (p.name || p.displayName)) || "").toLowerCase();
    if (/goal/.test(n)) return "Goleiros";
    if (/defen|back/.test(n)) return "Defensores";
    if (/mid/.test(n)) return "Meio-campistas";
    if (/forw|strik|wing|attack/.test(n)) return "Atacantes";
    const a = String((p && p.abbreviation) || "").charAt(0);
    return GRUPO[a] || "Outros";
}
const POSICAO_PT: Record<string, string> = { Goleiros: "Goleiro", Defensores: "Defensor", "Meio-campistas": "Meio-campo", Atacantes: "Atacante", Outros: "" };

export function timeDetalhe(liga: string, id: string) {
    if (!ligaValida(liga) || !/^\d+$/.test(id)) return Promise.resolve(null);
    return comReserva(`time:${liga}:${id}`, 6 * 3600 * 1000, async () => {
        const [info, elenco] = await Promise.all([json(`${ESPN}/site/v2/sports/soccer/${liga}/teams/${id}`), json(`${ESPN}/site/v2/sports/soccer/${liga}/teams/${id}/roster`)]);
        const t = info && info.team;
        if (!t) return null;
        const extra = await timeTsdb(t.displayName).catch(() => null);
        // foto: recorte PNG do TheSportsDB (pelo id da ESPN ou pelo nome), senão a da ESPN
        const porEspn = new Map<string, any>();
        const porNome = new Map<string, any>();
        (extra ? extra.jogadores : []).forEach((p: any) => {
            if (p.idESPN) porEspn.set(String(p.idESPN), p);
            porNome.set(norm(p.strPlayer), p);
        });
        const jogadores: Jogador[] = ((elenco && elenco.athletes) || []).map((a: any): Jogador => {
            const p = porEspn.get(String(a.id)) || porNome.get(norm(a.displayName));
            const grupo = grupoDe(a.position);
            const foto = (p && (p.strCutout || p.strRender || p.strThumb)) || (a.headshot && a.headshot.href) || undefined;
            return {
                id: String(a.id),
                nome: a.displayName,
                numero: a.jersey,
                posicao: POSICAO_PT[grupo],
                grupo,
                idade: a.age,
                pais: a.citizenship || (a.flag && a.flag.alt) || undefined,
                foto,
                recorte: !!(p && (p.strCutout || p.strRender)),
            };
        });
        const ordem = ["Goleiros", "Defensores", "Meio-campistas", "Atacantes", "Outros"];
        jogadores.sort((a, b) => ordem.indexOf(a.grupo) - ordem.indexOf(b.grupo) || (Number(a.numero) || 99) - (Number(b.numero) || 99));
        return {
            id: String(t.id),
            nome: t.displayName,
            curto: t.shortDisplayName || t.displayName,
            sigla: t.abbreviation,
            escudo: t.logos && t.logos[0] ? t.logos[0].href : undefined,
            cor: t.color ? "#" + t.color : undefined,
            corAlt: t.alternateColor ? "#" + t.alternateColor : undefined,
            fundo: extra && extra.fundo,
            camisa: extra && extra.camisa,
            estadio: (extra && extra.estadio) || (t.venue && t.venue.fullName) || undefined,
            fundado: extra && extra.fundado,
            descricao: extra && extra.descricao,
            jogadores,
        };
    });
}

/* --------------------------------- jogo --------------------------------- */

const TIPO_EVENTO: [RegExp, string][] = [
    [/own goal/i, "gol-contra"],
    [/penalty.*(scored|goal)/i, "gol-penalti"],
    [/goal/i, "gol"],
    [/red/i, "vermelho"],
    [/yellow/i, "amarelo"],
    [/substitution/i, "substituicao"],
];
const ESTATS: [string, string][] = [
    ["possessionPct", "Posse de bola (%)"],
    ["totalShots", "Finalizações"],
    ["shotsOnTarget", "No gol"],
    ["wonCorners", "Escanteios"],
    ["foulsCommitted", "Faltas"],
    ["yellowCards", "Cartões amarelos"],
    ["redCards", "Cartões vermelhos"],
    ["offsides", "Impedimentos"],
    ["saves", "Defesas"],
];

export function jogoDetalhe(liga: string, id: string) {
    if (!ligaValida(liga) || !/^\d+$/.test(id)) return Promise.resolve(null);
    return comReserva(`jogo:${liga}:${id}`, 45 * 1000, async () => {
        const d = await json(`${ESPN}/site/v2/sports/soccer/${liga}/summary?event=${id}`);
        if (!d || !d.header) return null;
        const comp = d.header.competitions && d.header.competitions[0];
        const times = (comp && comp.competitors) || [];
        const tmap = new Map<string, any>(times.map((c: any) => [String(c.team.id), c]));
        const eventos = ((d.keyEvents || []) as any[])
            .map((k) => {
                const tipo = (TIPO_EVENTO.find(([re]) => re.test((k.type && k.type.text) || "")) || [null, ""])[1];
                if (!tipo) return null;
                const ps = (k.participants || []).map((p: any) => p.athlete && p.athlete.displayName).filter(Boolean);
                return { minuto: (k.clock && k.clock.displayValue) || "", tipo, jogador: ps[0] || "", extra: ps[1] || "", time: k.team ? String(k.team.id) : "" };
            })
            .filter(Boolean);
        const escalacoes = ((d.rosters || []) as any[]).map((r) => {
            const ps = (r.roster || []).map((p: any) => ({
                nome: (p.athlete && (p.athlete.shortName || p.athlete.displayName)) || "",
                numero: p.jersey,
                posicao: (p.position && p.position.abbreviation) || "",
                titular: !!p.starter,
                lugar: Number(p.formationPlace) || 0,
                foto: p.athlete && p.athlete.headshot ? p.athlete.headshot.href : undefined,
            }));
            return {
                time: String(r.team.id),
                formacao: r.formation || "",
                titulares: ps.filter((p: any) => p.titular).sort((a: any, b: any) => a.lugar - b.lugar),
                reservas: ps.filter((p: any) => !p.titular),
            };
        });
        const bs = (d.boxscore && d.boxscore.teams) || [];
        const valor = (i: number, n: string) => {
            const s = bs[i] && (bs[i].statistics || []).find((x: any) => x.name === n);
            return s ? s.displayValue : undefined;
        };
        const iMand = bs.findIndex((b: any) => tmap.get(String(b.team.id)) && tmap.get(String(b.team.id)).homeAway === "home");
        const im = iMand < 0 ? 0 : iMand;
        const iv = im === 0 ? 1 : 0;
        const estatisticas = ESTATS.map(([n, rotulo]) => ({ rotulo, mandante: valor(im, n), visitante: valor(iv, n) })).filter((x) => x.mandante !== undefined || x.visitante !== undefined);
        return {
            id,
            estadio: d.gameInfo && d.gameInfo.venue ? d.gameInfo.venue.fullName : undefined,
            publico: d.gameInfo && d.gameInfo.attendance ? d.gameInfo.attendance : undefined,
            eventos,
            escalacoes,
            estatisticas,
        };
    });
}

/* ------------------------------ capa do jogo ------------------------------ */

async function imagem(url?: string): Promise<Buffer | null> {
    if (!url || !/^https:\/\//.test(url)) return null;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) }).catch(() => null);
    if (!r || !r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
}
const corSegura = (c?: string, padrao = "#334155") => (c && /^#[0-9a-f]{6}$/i.test(c) && c.toLowerCase() !== "#ffffff" && c.toLowerCase() !== "#000000" ? c : padrao);

// Arte 1280×720: diagonal com as cores dos dois clubes, brilhos e os dois
// escudos grandes (o texto — nomes, placar, hora — o app desenha por cima).
// Guardada de vez no Supabase (a arte do jogo não muda).
export async function capaDoJogo(a: { escudo?: string; cor?: string }, b: { escudo?: string; cor?: string }, chave: string): Promise<{ redirect?: string; jpg?: Buffer } | null> {
    const guardada = await capaGuardada(chave, "capa-jogo");
    if (guardada) return { redirect: guardada };
    const ca = corSegura(a.cor, "#1D4ED8");
    const cb = corSegura(b.cor, "#B91C1C");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
      <defs>
        <linearGradient id="ga" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ca}"/><stop offset="1" stop-color="#05070B"/></linearGradient>
        <linearGradient id="gb" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${cb}"/><stop offset="1" stop-color="#05070B"/></linearGradient>
        <radialGradient id="la" cx="0.27" cy="0.5" r="0.35"><stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
        <radialGradient id="lb" cx="0.73" cy="0.5" r="0.35"><stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="1280" height="720" fill="#05070B"/>
      <polygon points="0,0 760,0 520,720 0,720" fill="url(#ga)"/>
      <polygon points="760,0 1280,0 1280,720 520,720" fill="url(#gb)"/>
      <polygon points="748,0 772,0 532,720 508,720" fill="#ffffff" fill-opacity="0.85"/>
      <rect width="1280" height="720" fill="url(#la)"/>
      <rect width="1280" height="720" fill="url(#lb)"/>
      <g stroke="#ffffff" stroke-opacity="0.05" stroke-width="2">
        ${Array.from({ length: 14 }, (_, i) => `<line x1="${i * 110 - 200}" y1="0" x2="${i * 110 - 440}" y2="720"/>`).join("")}
      </g>
    </svg>`;
    const fundo = sharp(Buffer.from(svg)).png();
    const camadas: sharp.OverlayOptions[] = [];
    const [ea, eb] = await Promise.all([imagem(a.escudo), imagem(b.escudo)]);
    for (const [buf, x] of [[ea, 200], [eb, 760]] as [Buffer | null, number][]) {
        if (!buf) continue;
        const escudo = await sharp(buf).resize(320, 320, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer().catch(() => null);
        if (!escudo) continue;
        const sombra = await sharp(escudo).ensureAlpha().linear(0, 0).blur(18).png().toBuffer().catch(() => null);
        if (sombra) camadas.push({ input: sombra, left: x + 6, top: 210 + 14, blend: "over" });
        camadas.push({ input: escudo, left: x, top: 200 });
    }
    const jpg = await fundo
        .composite(camadas)
        .jpeg({ quality: 86 })
        .toBuffer()
        .catch(() => null);
    if (!jpg) return null;
    guardarCapa(chave, "capa-jogo", jpg);
    return { jpg };
}

/* ----------------------------- fundos da aba ----------------------------- */

// Times queridos (Brasil primeiro) — as ARTES deles (fotos de jogadores,
// torcida, estádio) viram o fundo animado da aba Futebol do app.
const TIMES_FUNDO = [
    "Flamengo", "Palmeiras", "Corinthians", "Sao Paulo", "Fluminense", "Gremio", "Internacional", "Atletico Mineiro",
    "Santos", "Vasco da Gama", "Botafogo", "Cruzeiro", "Bahia", "Real Madrid", "Barcelona", "Manchester City", "Liverpool", "Boca Juniors",
];

export function fundosDaAba(): Promise<string[] | null> {
    return comReserva("fundos-aba", 24 * 3600 * 1000, async () => {
        const urls: string[] = [];
        for (const nome of TIMES_FUNDO) {
            // a chave grátis limita a frequência: um respiro entre os pedidos
            await new Promise((ok) => setTimeout(ok, 700));
            const d = await json(`${TSDB}/searchteams.php?t=${encodeURIComponent(nome)}`);
            const t = ((d && d.teams) || []).find((x: any) => x.strSport === "Soccer");
            if (!t) continue;
            [t.strFanart1, t.strFanart2, t.strFanart3, t.strFanart4].filter(Boolean).forEach((u: string) => urls.push(u));
        }
        return urls.length ? urls : null;
    });
}
