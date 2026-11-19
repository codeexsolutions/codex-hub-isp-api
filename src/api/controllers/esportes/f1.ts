import { bandeira, buscarJson, emCache, ESPN, estadoEspn } from "./comum";

// Fórmula 1 pro app Synk TV:
//   - Jolpica (api.jolpi.ca — sucessora aberta da Ergast): calendário da
//     temporada com o horário de cada sessão, campeonato de pilotos e de
//     equipes, resultado da última corrida;
//   - ESPN (scoreboard de racing/f1): qual sessão do fim de semana está AO
//     VIVO agora.
// Tudo traduzido (nomes dos GPs, sessões) e com cor de equipe e bandeira.

const JOLPICA = "https://api.jolpi.ca/ergast/f1/current";

export type SessaoF1 = { tipo: string; nome: string; inicio: string; aoVivo?: boolean };
export type GpF1 = {
    rodada: number;
    nome: string;
    circuito: string;
    cidade: string;
    pais: string;
    bandeira?: string;
    corrida: string; // ISO da largada
    sessoes: SessaoF1[];
    estado: "concluido" | "proximo" | "futuro";
};
export type PilotoF1 = { pos: number; nome: string; sobrenome: string; codigo: string; numero?: string; pontos: number; vitorias: number; equipe: string; equipeId: string; cor: string; bandeira?: string };
export type EquipeF1 = { pos: number; nome: string; id: string; pontos: number; vitorias: number; cor: string };
export type PainelF1 = {
    temporada: string;
    proximo: GpF1 | null;
    aoVivo: { gp: string; sessao: string } | null;
    calendario: GpF1[];
    pilotos: PilotoF1[];
    equipes: EquipeF1[];
    ultima: { nome: string; rodada: number; data: string; podio: { pos: number; nome: string; equipe: string; cor: string; tempo: string }[] } | null;
};

// Cores oficiais aproximadas das equipes (constructorId da Jolpica).
const COR_EQUIPE: Record<string, string> = {
    mercedes: "#27F4D2",
    ferrari: "#E8002D",
    red_bull: "#3671C6",
    mclaren: "#FF8000",
    aston_martin: "#229971",
    alpine: "#0093CC",
    williams: "#64C4FF",
    rb: "#6692FF",
    haas: "#B6BABD",
    sauber: "#52E252",
    audi: "#F50537",
    cadillac: "#B59A5B",
};
export const corDaEquipe = (id: string) => COR_EQUIPE[id] || "#8B93A1";

// "Las Vegas Grand Prix" → "GP de Las Vegas"
const NOME_GP: Record<string, string> = {
    Australian: "da Austrália", Chinese: "da China", Japanese: "do Japão", Bahrain: "do Bahrein", "Saudi Arabian": "da Arábia Saudita",
    Miami: "de Miami", "Emilia Romagna": "da Emília-Romanha", Monaco: "de Mônaco", Spanish: "da Espanha", "Barcelona-Catalunya": "da Espanha",
    Madrid: "de Madri", Canadian: "do Canadá", Austrian: "da Áustria", British: "da Inglaterra", Belgian: "da Bélgica", Hungarian: "da Hungria",
    Dutch: "da Holanda", Italian: "da Itália", Azerbaijan: "do Azerbaijão", Singapore: "de Singapura", "United States": "dos Estados Unidos",
    "Mexico City": "da Cidade do México", Brazilian: "de São Paulo", "São Paulo": "de São Paulo", "Las Vegas": "de Las Vegas", Qatar: "do Catar", "Abu Dhabi": "de Abu Dhabi",
};
export function nomeDoGp(raceName: string): string {
    const base = String(raceName || "").replace(/\s*Grand Prix\s*$/i, "").trim();
    return NOME_GP[base] ? `GP ${NOME_GP[base]}` : `GP ${base}`;
}

const PAIS_ISO: Record<string, string> = {
    Australia: "au", China: "cn", Japan: "jp", Bahrain: "bh", "Saudi Arabia": "sa", USA: "us", "United States": "us", Italy: "it", Monaco: "mc",
    Spain: "es", Canada: "ca", Austria: "at", UK: "gb", "United Kingdom": "gb", Belgium: "be", Hungary: "hu", Netherlands: "nl", Azerbaijan: "az",
    Singapore: "sg", Mexico: "mx", Brazil: "br", Qatar: "qa", UAE: "ae", "United Arab Emirates": "ae",
};
const PAIS_PT: Record<string, string> = {
    Australia: "Austrália", China: "China", Japan: "Japão", Bahrain: "Bahrein", "Saudi Arabia": "Arábia Saudita", USA: "Estados Unidos", Italy: "Itália",
    Monaco: "Mônaco", Spain: "Espanha", Canada: "Canadá", Austria: "Áustria", UK: "Reino Unido", Belgium: "Bélgica", Hungary: "Hungria",
    Netherlands: "Holanda", Azerbaijan: "Azerbaijão", Singapore: "Singapura", Mexico: "México", Brazil: "Brasil", Qatar: "Catar", UAE: "Emirados Árabes",
};
const NACIONALIDADE_ISO: Record<string, string> = {
    British: "gb", Dutch: "nl", Monegasque: "mc", Spanish: "es", Mexican: "mx", Australian: "au", French: "fr", German: "de", Canadian: "ca",
    Thai: "th", Japanese: "jp", Chinese: "cn", Danish: "dk", Finnish: "fi", Brazilian: "br", "New Zealander": "nz", Argentine: "ar",
    Argentinian: "ar", American: "us", Italian: "it", Swiss: "ch", Belgian: "be", Polish: "pl", Russian: "ru",
};

// Ordem e nome das sessões do fim de semana (campos da Jolpica).
const SESSOES: [string, string][] = [
    ["FirstPractice", "Treino livre 1"],
    ["SecondPractice", "Treino livre 2"],
    ["ThirdPractice", "Treino livre 3"],
    ["SprintQualifying", "Classificação sprint"],
    ["SprintShootout", "Classificação sprint"],
    ["Sprint", "Corrida sprint"],
    ["Qualifying", "Classificação"],
];
const iso = (data?: string, hora?: string) => (data ? `${data}T${hora || "00:00:00Z"}` : "");

// Calendário cru da Jolpica → GPs traduzidos, com estado em relação a `agora`.
export function calendarioF1(races: any[], agora = Date.now()): GpF1[] {
    const DURACAO_CORRIDA_MS = 2.5 * 3600 * 1000;
    let achouProximo = false;
    return (races || []).map((r) => {
        const corrida = iso(r.date, r.time);
        const sessoes: SessaoF1[] = SESSOES.filter(([k]) => r[k]).map(([k, nome]) => ({ tipo: k, nome, inicio: iso(r[k].date, r[k].time) }));
        sessoes.push({ tipo: "Race", nome: "Corrida", inicio: corrida });
        sessoes.sort((a, b) => a.inicio.localeCompare(b.inicio));
        const fim = new Date(corrida).getTime() + DURACAO_CORRIDA_MS;
        let estado: GpF1["estado"] = "futuro";
        if (fim < agora) estado = "concluido";
        else if (!achouProximo) {
            estado = "proximo";
            achouProximo = true;
        }
        const pais = r.Circuit?.Location?.country || "";
        return {
            rodada: Number(r.round),
            nome: nomeDoGp(r.raceName),
            circuito: r.Circuit?.circuitName || "",
            cidade: r.Circuit?.Location?.locality || "",
            pais: PAIS_PT[pais] || pais,
            bandeira: bandeira(PAIS_ISO[pais]),
            corrida,
            sessoes,
            estado,
        };
    });
}

export function pilotosF1(standings: any[]): PilotoF1[] {
    return (standings || []).map((s) => {
        const eq = (s.Constructors && s.Constructors[s.Constructors.length - 1]) || {};
        return {
            pos: Number(s.position || s.positionText) || 0,
            nome: `${s.Driver?.givenName || ""} ${s.Driver?.familyName || ""}`.trim(),
            sobrenome: s.Driver?.familyName || "",
            codigo: s.Driver?.code || (s.Driver?.familyName || "").slice(0, 3).toUpperCase(),
            numero: s.Driver?.permanentNumber,
            pontos: Number(s.points) || 0,
            vitorias: Number(s.wins) || 0,
            equipe: eq.name || "",
            equipeId: eq.constructorId || "",
            cor: corDaEquipe(eq.constructorId || ""),
            bandeira: bandeira(NACIONALIDADE_ISO[s.Driver?.nationality || ""]),
        };
    });
}

export function equipesF1(standings: any[]): EquipeF1[] {
    return (standings || []).map((s) => ({
        pos: Number(s.position || s.positionText) || 0,
        nome: s.Constructor?.name || "",
        id: s.Constructor?.constructorId || "",
        pontos: Number(s.points) || 0,
        vitorias: Number(s.wins) || 0,
        cor: corDaEquipe(s.Constructor?.constructorId || ""),
    }));
}

export function ultimaCorridaF1(race: any): PainelF1["ultima"] {
    if (!race || !Array.isArray(race.Results)) return null;
    return {
        nome: nomeDoGp(race.raceName),
        rodada: Number(race.round),
        data: iso(race.date, race.time),
        podio: race.Results.slice(0, 3).map((x: any) => ({
            pos: Number(x.position),
            nome: `${x.Driver?.givenName || ""} ${x.Driver?.familyName || ""}`.trim(),
            equipe: x.Constructor?.name || "",
            cor: corDaEquipe(x.Constructor?.constructorId || ""),
            tempo: (x.Time && x.Time.time) || x.status || "",
        })),
    };
}

// Sessão do fim de semana acontecendo agora (ESPN).
export function aoVivoF1(espn: any): PainelF1["aoVivo"] {
    const ev = espn && Array.isArray(espn.events) ? espn.events[0] : null;
    if (!ev) return null;
    const comp = (ev.competitions || []).find((c: any) => estadoEspn(c.status && c.status.type) === "aovivo");
    if (!comp) return null;
    const abrev = String((comp.type && comp.type.abbreviation) || "");
    const nomes: Record<string, string> = { FP1: "Treino livre 1", FP2: "Treino livre 2", FP3: "Treino livre 3", Qual: "Classificação", Race: "Corrida", Sprint: "Corrida sprint", SQ: "Classificação sprint" };
    return { gp: nomeDoGp(String(ev.name || "").replace(/^Heineken\s+|^Formula 1\s+/i, "").replace(/\s*\d{4}\s*$/, "")), sessao: nomes[abrev] || abrev };
}

async function gerar(): Promise<PainelF1 | null> {
    const [cal, pil, equ, ult, espn] = await Promise.all([
        buscarJson(`${JOLPICA}.json`),
        buscarJson(`${JOLPICA}/driverStandings.json`),
        buscarJson(`${JOLPICA}/constructorStandings.json`),
        buscarJson(`${JOLPICA}/last/results.json`),
        buscarJson(`${ESPN}/racing/f1/scoreboard`),
    ]);
    const races = cal?.MRData?.RaceTable?.Races;
    if (!Array.isArray(races)) return null; // sem calendário não tem tela — fica a anterior
    const calendario = calendarioF1(races);
    const lp = pil?.MRData?.StandingsTable?.StandingsLists?.[0];
    const le = equ?.MRData?.StandingsTable?.StandingsLists?.[0];
    return {
        temporada: String(cal.MRData.RaceTable.season || ""),
        proximo: calendario.find((g) => g.estado === "proximo") || null,
        aoVivo: aoVivoF1(espn),
        calendario,
        pilotos: pilotosF1(lp?.DriverStandings || []),
        equipes: equipesF1(le?.ConstructorStandings || []),
        ultima: ultimaCorridaF1(ult?.MRData?.RaceTable?.Races?.[0]),
    };
}

// 10 min normalmente; 1 min com sessão ao vivo.
export const painelF1 = () => emCache<PainelF1>("f1", (p) => (p.aoVivo ? 60 : 600) * 1000, gerar);
