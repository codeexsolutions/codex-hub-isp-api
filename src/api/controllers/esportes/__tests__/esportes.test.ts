import { describe, it, expect } from "vitest";
import { calendarioF1, nomeDoGp, pilotosF1, ultimaCorridaF1, aoVivoF1 } from "../f1";
import { eventoUfc, agendaUfc, categoriaUfc } from "../ufc";
import { jogosEua, classificacaoEua, traduzirRelogio } from "../ligasEua";

const gp = (round: number, raceName: string, date: string, extra: any = {}) => ({
    round: String(round), raceName, date, time: "14:00:00Z",
    Circuit: { circuitName: "Circuito", Location: { locality: "Cidade", country: "Brazil" } },
    FirstPractice: { date, time: "10:00:00Z" }, Qualifying: { date, time: "12:00:00Z" }, ...extra,
});

describe("Fórmula 1", () => {
    it("traduz o nome do GP", () => {
        expect(nomeDoGp("Las Vegas Grand Prix")).toBe("GP de Las Vegas");
        expect(nomeDoGp("Brazilian Grand Prix")).toBe("GP de São Paulo");
        expect(nomeDoGp("Lunar Grand Prix")).toBe("GP Lunar"); // desconhecido: mantém
    });

    it("marca concluído / próximo / futuro e ordena as sessões", () => {
        const agora = new Date("2026-11-19T12:00:00Z").getTime();
        const cal = calendarioF1([
            gp(20, "Brazilian Grand Prix", "2026-11-08"),
            // fim de semana real: treino na sexta, classificação e sprint no sábado
            gp(21, "Las Vegas Grand Prix", "2026-11-22", { FirstPractice: { date: "2026-11-20", time: "10:00:00Z" }, Qualifying: { date: "2026-11-21", time: "12:00:00Z" }, Sprint: { date: "2026-11-21", time: "18:00:00Z" } }),
            gp(22, "Qatar Grand Prix", "2026-11-29"),
        ], agora);
        expect(cal.map((g) => g.estado)).toEqual(["concluido", "proximo", "futuro"]);
        expect(cal[1].sessoes.map((s) => s.nome)).toEqual(["Treino livre 1", "Classificação", "Corrida sprint", "Corrida"]);
        expect(cal[1].pais).toBe("Brasil");
        expect(cal[1].bandeira).toBe("https://flagcdn.com/w80/br.png");
    });

    it("piloto ganha cor da equipe e bandeira da nacionalidade", () => {
        const [p] = pilotosF1([{ position: "1", points: "390", wins: "9", Driver: { givenName: "Kimi", familyName: "Antonelli", code: "ANT", permanentNumber: "12", nationality: "Italian" }, Constructors: [{ name: "Mercedes", constructorId: "mercedes" }] }]);
        expect(p).toMatchObject({ pos: 1, codigo: "ANT", pontos: 390, cor: "#27F4D2", bandeira: "https://flagcdn.com/w80/it.png" });
    });

    it("pódio da última corrida e sessão ao vivo pela ESPN", () => {
        const u = ultimaCorridaF1({ raceName: "Brazilian Grand Prix", round: "20", date: "2026-11-08", time: "17:00:00Z", Results: [1, 2, 3, 4].map((i) => ({ position: String(i), Driver: { givenName: "P", familyName: String(i) }, Constructor: { name: "McLaren", constructorId: "mclaren" }, Time: { time: i === 1 ? "1:35:23" : `+${i}.0` } })) });
        expect(u!.podio).toHaveLength(3);
        expect(u!.podio[0]).toMatchObject({ pos: 1, cor: "#FF8000", tempo: "1:35:23" });
        expect(aoVivoF1({ events: [{ name: "Heineken Las Vegas Grand Prix", competitions: [{ type: { abbreviation: "FP1" }, status: { type: { state: "post" } } }, { type: { abbreviation: "Qual" }, status: { type: { state: "in" } } }] }] })).toEqual({ gp: "GP de Las Vegas", sessao: "Classificação" });
        expect(aoVivoF1({ events: [{ name: "x", competitions: [{ status: { type: { state: "pre" } } }] }] })).toBeNull();
    });
});

describe("UFC", () => {
    const luta = (id: string, cat: string, a: string, b: string, state = "pre", vencedorA = false) => ({
        id, type: { abbreviation: cat }, status: { type: { state, shortDetail: state === "post" ? "Final" : "" } }, format: { regulation: { periods: 3 } },
        competitors: [
            { id: id + "1", order: 1, winner: vencedorA, athlete: { displayName: a, shortName: a, flag: { alt: "Brazil", href: "f.png" } }, records: [{ summary: "10-1-0" }] },
            { id: id + "2", order: 2, winner: false, athlete: { displayName: b, shortName: b, flag: { alt: "USA" } }, records: [{ summary: "8-2-0" }] },
        ],
    });

    it("principal primeiro, categoria em português, foto pelo id e país traduzido", () => {
        const ev = eventoUfc({ id: "9", name: "UFC 999", date: "2026-11-21T15:00Z", competitions: [luta("a", "Flyweight", "P1", "P2"), luta("b", "Lightweight", "C1", "C2"), luta("c", "Heavyweight", "M1", "M2")] })!;
        expect(ev.lutas.map((l) => [l.destaque, l.categoria])).toEqual([["principal", "Peso-pesado"], ["coprincipal", "Peso-leve"], [undefined, "Peso-mosca"]]);
        expect(ev.lutas[0].lutadores[0]).toMatchObject({ nome: "M1", pais: "Brasil", cartel: "10-1-0", foto: "https://a.espncdn.com/i/headshots/mma/players/full/c1.png" });
        expect(ev.lutas[0].lutadores[1].pais).toBe("EUA");
        expect(ev.estado).toBe("agendado");
    });

    it("evento com lutas já decididas está ao vivo; todas decididas = encerrado", () => {
        const meio = eventoUfc({ id: "1", name: "x", competitions: [luta("a", "Flyweight", "A", "B", "post", true), luta("b", "Lightweight", "C", "D")] })!;
        expect(meio.estado).toBe("aovivo");
        expect(meio.lutas[1].lutadores[0].vencedor).toBe(true);
        const fim = eventoUfc({ id: "1", name: "x", competitions: [luta("a", "Flyweight", "A", "B", "post", true)] })!;
        expect(fim.estado).toBe("encerrado");
    });

    it("agenda só com eventos futuros e sem o da tela", () => {
        const agora = new Date("2026-11-19T00:00:00Z").getTime();
        const ag = agendaUfc([{ label: "Passado", startDate: "2026-11-01T00:00Z" }, { label: "Atual", startDate: "2026-11-21T00:00Z" }, { label: "Próximo", startDate: "2026-12-05T00:00Z" }], "Atual", agora);
        expect(ag.map((a) => a.nome)).toEqual(["Próximo"]);
        expect(categoriaUfc("Women's Strawweight")).toBe("Peso-palha feminino");
    });
});

describe("NBA / NFL", () => {
    const time = (sigla: string, home: boolean, score: string, winner = false) => ({ homeAway: home ? "home" : "away", score, winner, team: { abbreviation: sigla, displayName: sigla, color: "112233", logo: sigla + ".png" }, records: [{ summary: "10-5" }] });
    const evento = (id: string, state: string, date: string, shortDetail = "") => ({ id, date, status: { type: { state, shortDetail } }, competitions: [{ competitors: [time("LAL", true, "101", true), time("BOS", false, "99")] }] });

    it("ao vivo primeiro, depois agendado, depois encerrado; relógio traduzido", () => {
        const j = jogosEua({ events: [evento("1", "post", "2026-11-19T00:00Z", "Final"), evento("2", "pre", "2026-11-20T01:00Z"), evento("3", "in", "2026-11-19T23:00Z", "Halftime")] });
        expect(j.map((x) => x.id)).toEqual(["3", "2", "1"]);
        expect(j[0].relogio).toBe("Intervalo");
        expect(j[2].relogio).toBe("Fim de jogo");
        expect(j[2].casa).toMatchObject({ sigla: "LAL", placar: 101, cor: "#112233", campanha: "10-5", vencedor: true });
        expect(traduzirRelogio("End of 2nd Quarter")).toBe("Fim do 2º quarto");
    });

    it("classificação na ordem de playoff, conferência em português", () => {
        const st = (seed: number, w: number) => [{ name: "playoffSeed", value: seed }, { name: "wins", value: w }, { name: "losses", value: 3 }, { name: "winPercent", displayValue: ".800" }, { name: "gamesBehind", displayValue: "-" }];
        const c = classificacaoEua({ children: [{ name: "Eastern Conference", standings: { entries: [{ team: { abbreviation: "BOS" }, stats: st(2, 11) }, { team: { abbreviation: "PHI" }, stats: st(1, 13) }] } }] });
        expect(c[0].nome).toBe("Conferência Leste");
        expect(c[0].times.map((t) => t.sigla)).toEqual(["PHI", "BOS"]);
    });
});
