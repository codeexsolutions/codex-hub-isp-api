import { buscarJson, emCache, ESPN, Estado, estadoEspn } from "./comum";

// UFC pro app Synk TV (ESPN, mma/ufc):
//   - o evento da semana com TODAS as lutas, da principal pra baixo:
//     categoria de peso (em português), lutadores com foto, bandeira e
//     cartel, quem venceu (depois da luta);
//   - a agenda dos próximos eventos.

export type LutadorUfc = { id: string; nome: string; curto: string; pais?: string; bandeira?: string; cartel?: string; foto?: string; vencedor: boolean };
export type LutaUfc = { id: string; categoria: string; destaque?: "principal" | "coprincipal"; rounds?: number; estado: Estado; detalhe?: string; lutadores: LutadorUfc[] };
export type EventoUfc = { id: string; nome: string; data: string; estado: Estado; local?: string; cidade?: string; transmissao: string[]; lutas: LutaUfc[] };
export type PainelUfc = { evento: EventoUfc | null; agenda: { nome: string; data: string }[] };

const CATEGORIA: Record<string, string> = {
    Flyweight: "Peso-mosca",
    Bantamweight: "Peso-galo",
    Featherweight: "Peso-pena",
    Lightweight: "Peso-leve",
    Welterweight: "Peso-meio-médio",
    Middleweight: "Peso-médio",
    "Light Heavyweight": "Peso-meio-pesado",
    Heavyweight: "Peso-pesado",
    "Women's Strawweight": "Peso-palha feminino",
    "Women's Flyweight": "Peso-mosca feminino",
    "Women's Bantamweight": "Peso-galo feminino",
    "Women's Featherweight": "Peso-pena feminino",
    Catchweight: "Peso casado",
};
export const categoriaUfc = (en: string) => CATEGORIA[String(en || "").trim()] || String(en || "").trim();

const PAIS: Record<string, string> = {
    Brazil: "Brasil", USA: "EUA", "United States": "EUA", Russia: "Rússia", Czechia: "Tchéquia", "Czech Republic": "Tchéquia",
    "New Zealand": "Nova Zelândia", Australia: "Austrália", England: "Inglaterra", "United Kingdom": "Reino Unido", Ireland: "Irlanda",
    Mexico: "México", Argentina: "Argentina", Chile: "Chile", Peru: "Peru", Colombia: "Colômbia", Venezuela: "Venezuela", Ecuador: "Equador",
    Canada: "Canadá", France: "França", Germany: "Alemanha", Poland: "Polônia", Georgia: "Geórgia", Dagestan: "Daguestão",
    Kazakhstan: "Cazaquistão", Kyrgyzstan: "Quirguistão", Uzbekistan: "Uzbequistão", Tajikistan: "Tadjiquistão", Ukraine: "Ucrânia",
    China: "China", Japan: "Japão", "South Korea": "Coreia do Sul", Nigeria: "Nigéria", Cameroon: "Camarões", "South Africa": "África do Sul",
    Netherlands: "Holanda", Sweden: "Suécia", Norway: "Noruega", Spain: "Espanha", Portugal: "Portugal", Italy: "Itália", Armenia: "Armênia",
    Azerbaijan: "Azerbaijão", Turkey: "Turquia", Moldova: "Moldávia", Romania: "Romênia", Lithuania: "Lituânia", Scotland: "Escócia", Wales: "País de Gales",
    Jamaica: "Jamaica", Cuba: "Cuba", Philippines: "Filipinas", Thailand: "Tailândia", Mongolia: "Mongólia", Iran: "Irã", "Saudi Arabia": "Arábia Saudita",
    "United Arab Emirates": "Emirados Árabes", Qatar: "Catar", Switzerland: "Suíça", Austria: "Áustria", Belgium: "Bélgica", Denmark: "Dinamarca", Finland: "Finlândia",
};
export const paisPt = (en?: string) => (en ? PAIS[en] || en : undefined);

// Foto do lutador no CDN da ESPN (o id do competidor é o id do atleta).
export const fotoLutador = (id: string) => `https://a.espncdn.com/i/headshots/mma/players/full/${id}.png`;

function lutador(c: any): LutadorUfc {
    const a = c.athlete || {};
    const id = String(c.id || "");
    return {
        id,
        nome: a.displayName || a.fullName || "",
        curto: a.shortName || a.displayName || "",
        pais: paisPt(a.flag && a.flag.alt),
        bandeira: a.flag && a.flag.href,
        cartel: c.records && c.records[0] && c.records[0].summary,
        foto: id ? fotoLutador(id) : undefined,
        vencedor: !!c.winner,
    };
}

// A ESPN lista as lutas da primeira preliminar até a principal: inverte.
export function eventoUfc(ev: any): EventoUfc | null {
    if (!ev || !Array.isArray(ev.competitions)) return null;
    const comps = ev.competitions.slice().reverse();
    const lutas: LutaUfc[] = comps.map((c: any, i: number) => {
        const st = (c.status && c.status.type) || {};
        const estado = estadoEspn(st);
        const ordem = (c.competitors || []).slice().sort((x: any, y: any) => (x.order || 0) - (y.order || 0));
        return {
            id: String(c.id || i),
            categoria: categoriaUfc(c.type && c.type.abbreviation),
            destaque: i === 0 ? "principal" : i === 1 ? "coprincipal" : undefined,
            rounds: c.format && c.format.regulation && c.format.regulation.periods,
            estado,
            detalhe: estado === "encerrado" ? st.shortDetail || st.detail : undefined,
            lutadores: ordem.map(lutador),
        };
    });
    const c0 = ev.competitions[0] || {};
    const local = c0.venue || {};
    const transmissao = Array.from(
        new Set(ev.competitions.flatMap((c: any) => (c.broadcasts || []).flatMap((b: any) => b.names || [])))
    ) as string[];
    const estados = lutas.map((l) => l.estado);
    const estado: Estado = estados.includes("aovivo") ? "aovivo" : estados.length && estados.every((e) => e === "encerrado") ? "encerrado" : estados.some((e) => e === "encerrado") ? "aovivo" : "agendado";
    return {
        id: String(ev.id || ""),
        nome: ev.name || "",
        data: ev.date || c0.date || "",
        estado,
        local: local.fullName,
        cidade: local.address ? [local.address.city, paisPt(local.address.country)].filter(Boolean).join(", ") : undefined,
        transmissao,
        lutas,
    };
}

// Próximos eventos do calendário (o da tela sai fora, pelo nome).
export function agendaUfc(calendario: any[], nomeAtual: string, agora = Date.now()): PainelUfc["agenda"] {
    return (calendario || [])
        .filter((c) => c && c.startDate && c.label && c.label !== nomeAtual && new Date(c.startDate).getTime() > agora)
        .slice(0, 8)
        .map((c) => ({ nome: c.label, data: c.startDate }));
}

async function gerar(): Promise<PainelUfc | null> {
    const d = await buscarJson(`${ESPN}/mma/ufc/scoreboard`);
    if (!d || !Array.isArray(d.events)) return null;
    const evento = eventoUfc(d.events[0]);
    const cal = (d.leagues && d.leagues[0] && d.leagues[0].calendar) || [];
    const agenda = agendaUfc(cal, evento ? evento.nome : "");
    return { evento, agenda };
}

// 1 min com luta acontecendo; 10 min no resto.
export const painelUfc = () => emCache<PainelUfc>("ufc", (p) => (p.evento && p.evento.estado === "aovivo" ? 60 : 600) * 1000, gerar);
