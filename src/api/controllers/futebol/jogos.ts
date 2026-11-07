// Jogos de futebol do dia (ao vivo, a seguir, encerrados) pro app Synk TV:
// escudos, cores dos clubes, placar e minuto. Fonte: API pública da ESPN
// (scoreboard por campeonato) — juntada, normalizada e guardada 1 min aqui
// (todo mundo pede pra cá; a ESPN recebe 1 chamada por minuto por liga).

type Liga = { id: string; nome: string; pais: "BR" | "SA" | "EU" };

// Ordem = prioridade na tela (Brasil primeiro).
export const LIGAS: Liga[] = [
    { id: "bra.1", nome: "Brasileirão Série A", pais: "BR" },
    { id: "bra.2", nome: "Brasileirão Série B", pais: "BR" },
    { id: "bra.copa_do_brazil", nome: "Copa do Brasil", pais: "BR" },
    { id: "conmebol.libertadores", nome: "Libertadores", pais: "SA" },
    { id: "conmebol.sudamericana", nome: "Sul-Americana", pais: "SA" },
    { id: "uefa.champions", nome: "Champions League", pais: "EU" },
    { id: "uefa.europa", nome: "Europa League", pais: "EU" },
    { id: "eng.1", nome: "Premier League", pais: "EU" },
    { id: "esp.1", nome: "La Liga", pais: "EU" },
    { id: "ita.1", nome: "Serie A (Itália)", pais: "EU" },
    { id: "ger.1", nome: "Bundesliga", pais: "EU" },
    { id: "fra.1", nome: "Ligue 1", pais: "EU" },
    { id: "por.1", nome: "Liga Portugal", pais: "EU" },
    { id: "arg.1", nome: "Liga Argentina", pais: "SA" },
];

export type Time = { nome: string; curto: string; sigla: string; escudo?: string; cor?: string; corAlt?: string; placar?: number };
export type Jogo = {
    id: string;
    liga: { id: string; nome: string; logo?: string };
    inicio: string; // ISO
    estado: "agendado" | "aovivo" | "encerrado";
    relogio?: string; // "67'" / "Intervalo"
    mandante: Time;
    visitante: Time;
    estadio?: string;
    transmissao: string[]; // o que a ESPN informar (costuma ser dos EUA)
};

const cache = new Map<string, { em: number; jogos: Jogo[] }>();
const VALIDADE_MS = 60 * 1000;

function time(c: any): Time {
    const t = c.team || {};
    return {
        nome: t.displayName || t.name || "",
        curto: t.shortDisplayName || t.name || "",
        sigla: t.abbreviation || "",
        escudo: t.logo || (t.logos && t.logos[0] && t.logos[0].href) || undefined,
        cor: t.color ? "#" + t.color : undefined,
        corAlt: t.alternateColor ? "#" + t.alternateColor : undefined,
        placar: c.score !== undefined && c.score !== "" ? Number(c.score) : undefined,
    };
}

async function daLiga(liga: Liga, dia?: string): Promise<Jogo[]> {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${liga.id}/scoreboard${dia ? `?dates=${dia}` : ""}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) }).catch(() => null);
    if (!r || !r.ok) return [];
    const d: any = await r.json().catch(() => null);
    if (!d || !Array.isArray(d.events)) return [];
    const logo = d.leagues && d.leagues[0] && d.leagues[0].logos && d.leagues[0].logos[0] ? d.leagues[0].logos[0].href : undefined;
    return d.events
        .map((e: any): Jogo | null => {
            const c = e.competitions && e.competitions[0];
            if (!c) return null;
            const casa = (c.competitors || []).find((x: any) => x.homeAway === "home");
            const fora = (c.competitors || []).find((x: any) => x.homeAway === "away");
            if (!casa || !fora) return null;
            const st = (e.status && e.status.type) || {};
            const estado = st.state === "in" ? "aovivo" : st.state === "post" ? "encerrado" : "agendado";
            const relogio = estado === "aovivo" ? (st.shortDetail && /half/i.test(st.shortDetail) ? "Intervalo" : e.status.displayClock || st.shortDetail) : undefined;
            return {
                id: String(e.id),
                liga: { id: liga.id, nome: liga.nome, logo },
                inicio: e.date,
                estado,
                relogio,
                mandante: time(casa),
                visitante: time(fora),
                estadio: c.venue && c.venue.fullName,
                transmissao: Array.from(new Set(((c.broadcasts || []) as any[]).flatMap((b) => b.names || []))) as string[],
            };
        })
        .filter(Boolean) as Jogo[];
}

// dia: "YYYYMMDD" (opcional — sem ele, o "dia atual" de cada campeonato)
export async function jogosDoDia(dia?: string): Promise<Jogo[]> {
    const chave = dia || "hoje";
    const c = cache.get(chave);
    if (c && Date.now() - c.em < VALIDADE_MS) return c.jogos;
    const listas = await Promise.all(LIGAS.map((l) => daLiga(l, dia).catch(() => [] as Jogo[])));
    const ordemLiga = new Map(LIGAS.map((l, i) => [l.id, i]));
    const pesoEstado = { aovivo: 0, agendado: 1, encerrado: 2 } as const;
    const agora = Date.now();
    const jogos = ([] as Jogo[])
        .concat(...listas)
        // sem dia pedido: só o que importa agora (ao vivo, últimas 12h, próximas 36h)
        .filter((j) => dia || j.estado === "aovivo" || Math.abs(new Date(j.inicio).getTime() - agora) < (new Date(j.inicio).getTime() > agora ? 36 : 12) * 3600 * 1000)
        .sort(
            (a, b) =>
                pesoEstado[a.estado] - pesoEstado[b.estado] ||
                (ordemLiga.get(a.liga.id) ?? 99) - (ordemLiga.get(b.liga.id) ?? 99) ||
                a.inicio.localeCompare(b.inicio)
        );
    cache.set(chave, { em: Date.now(), jogos });
    if (cache.size > 30) {
        const velha = cache.keys().next().value;
        if (velha !== undefined) cache.delete(velha);
    }
    return jogos;
}
