import { buscarJson, emCache, ESPN, ESPN_CLASSIFICACAO, Estado, estadoEspn } from "./comum";

// NBA e NFL pro app Synk TV (ESPN — mesmo formato nas duas):
//   - jogos: placar, quarto/tempo, logo e cor dos times, campanha;
//   - classificação por conferência (Leste/Oeste, AFC/NFC), na ordem de
//     playoff.
// Sem jogo hoje, procura nos próximos dias (a tela nunca fica vazia).

export type LigaEua = "nba" | "nfl";
const CAMINHO: Record<LigaEua, string> = { nba: "basketball/nba", nfl: "football/nfl" };
const CONFERENCIA_PT: Record<string, string> = {
    "Eastern Conference": "Conferência Leste",
    "Western Conference": "Conferência Oeste",
    "American Football Conference": "AFC",
    "National Football Conference": "NFC",
};

export type TimeEua = { id?: string; sigla: string; nome: string; curto: string; logo?: string; cor?: string; placar?: number; campanha?: string; vencedor?: boolean };
export type JogoEua = { id: string; inicio: string; estado: Estado; relogio?: string; casa: TimeEua; fora: TimeEua; local?: string; transmissao: string[] };
export type LinhaEua = { seed: number; sigla: string; nome: string; logo?: string; v: number; d: number; pct: string; gb: string; sequencia?: string };
export type PainelEua = { liga: LigaEua; dia?: string; jogos: JogoEua[]; conferencias: { nome: string; times: LinhaEua[] }[] };

function time(c: any): TimeEua {
    const t = c.team || {};
    return {
        id: t.id ? String(t.id) : undefined,
        sigla: t.abbreviation || "",
        nome: t.displayName || t.name || "",
        curto: t.shortDisplayName || t.name || "",
        logo: t.logo || (t.logos && t.logos[0] && t.logos[0].href) || undefined,
        cor: t.color ? "#" + t.color : undefined,
        placar: c.score !== undefined && c.score !== "" ? Number(c.score) : undefined,
        campanha: c.records && c.records[0] && c.records[0].summary,
        vencedor: !!c.winner,
    };
}

export function jogosEua(scoreboard: any): JogoEua[] {
    const eventos = scoreboard && Array.isArray(scoreboard.events) ? scoreboard.events : [];
    const peso = { aovivo: 0, agendado: 1, encerrado: 2 } as const;
    return eventos
        .map((e: any): JogoEua | null => {
            const c = e.competitions && e.competitions[0];
            if (!c) return null;
            const casa = (c.competitors || []).find((x: any) => x.homeAway === "home");
            const fora = (c.competitors || []).find((x: any) => x.homeAway === "away");
            if (!casa || !fora) return null;
            const st = (e.status && e.status.type) || {};
            const estado = estadoEspn(st);
            return {
                id: String(e.id),
                inicio: e.date,
                estado,
                // ao vivo: "Q3 4:12" / "Halftime"; encerrado: "Final" / "Final/OT"
                relogio: estado === "agendado" ? undefined : traduzirRelogio(st.shortDetail || st.detail || ""),
                casa: time(casa),
                fora: time(fora),
                local: c.venue && c.venue.fullName,
                transmissao: Array.from(new Set(((c.broadcasts || []) as any[]).flatMap((b) => b.names || []))) as string[],
            };
        })
        .filter(Boolean)
        .sort((a: JogoEua, b: JogoEua) => peso[a.estado] - peso[b.estado] || a.inicio.localeCompare(b.inicio)) as JogoEua[];
}

export function traduzirRelogio(s: string): string {
    return s
        .replace(/^Final\/OT$/i, "Fim · prorrogação")
        .replace(/^Final$/i, "Fim de jogo")
        .replace(/Halftime/i, "Intervalo")
        .replace(/End of (\d)(st|nd|rd|th) Quarter/i, "Fim do $1º quarto")
        .replace(/^(\d)(st|nd|rd|th)\b/i, "$1º");
}

export function classificacaoEua(dado: any): PainelEua["conferencias"] {
    const grupos = dado && Array.isArray(dado.children) ? dado.children : [];
    return grupos
        .filter((g: any) => g.standings && Array.isArray(g.standings.entries))
        .map((g: any) => {
            const times: LinhaEua[] = g.standings.entries.map((x: any) => {
                const st: Record<string, any> = {};
                for (const s of x.stats || []) st[s.name] = s;
                const num = (k: string) => Number(st[k] && st[k].value) || 0;
                const txt = (k: string) => (st[k] && st[k].displayValue) || "";
                return {
                    seed: num("playoffSeed"),
                    sigla: x.team?.abbreviation || "",
                    nome: x.team?.shortDisplayName || x.team?.displayName || "",
                    logo: x.team?.logos && x.team.logos[0] && x.team.logos[0].href,
                    v: num("wins"),
                    d: num("losses"),
                    pct: txt("winPercent"),
                    gb: txt("gamesBehind"),
                    sequencia: txt("streak") || undefined,
                };
            });
            times.sort((a, b) => (a.seed || 99) - (b.seed || 99) || b.v - a.v);
            return { nome: CONFERENCIA_PT[g.name] || g.name, times };
        });
}

const diaEspn = (t: number) => new Date(t).toISOString().slice(0, 10).replace(/-/g, "");

async function jogosComReserva(liga: LigaEua): Promise<{ jogos: JogoEua[]; dia?: string } | null> {
    const hoje = await buscarJson(`${ESPN}/${CAMINHO[liga]}/scoreboard`);
    if (!hoje) return null;
    const jogos = jogosEua(hoje);
    if (jogos.length || liga === "nfl") return { jogos, dia: hoje.day && hoje.day.date };
    // NBA sem jogo hoje (folga, All-Star…): os próximos 3 dias
    for (let i = 1; i <= 3; i++) {
        const dia = diaEspn(Date.now() + i * 86400000);
        const d = await buscarJson(`${ESPN}/${CAMINHO[liga]}/scoreboard?dates=${dia}`);
        const j = jogosEua(d);
        if (j.length) return { jogos: j, dia: `${dia.slice(0, 4)}-${dia.slice(4, 6)}-${dia.slice(6)}` };
    }
    return { jogos: [] };
}

async function gerar(liga: LigaEua): Promise<PainelEua | null> {
    const [jogos, classif] = await Promise.all([
        jogosComReserva(liga),
        emCache(`classif:${liga}`, () => 30 * 60 * 1000, () => buscarJson(`${ESPN_CLASSIFICACAO}/${CAMINHO[liga]}/standings`).then((d) => (d ? classificacaoEua(d) : null))),
    ]);
    if (!jogos) return null;
    return { liga, dia: jogos.dia, jogos: jogos.jogos, conferencias: classif || [] };
}

// 30 s com jogo ao vivo; 2 min no resto.
export const painelEua = (liga: LigaEua) =>
    emCache<PainelEua>(`eua:${liga}`, (p) => (p.jogos.some((j) => j.estado === "aovivo") ? 30 : 120) * 1000, () => gerar(liga));
