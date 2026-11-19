import { describe, it, expect } from "vitest";
import { impressaoDoAudio, trechoEmComum, SEGUNDOS_POR_QUADRO, TAXA_AMOSTRAGEM, impressaoParaBuffer, impressaoDeBuffer } from "../impressao";
import { marcadoresDaTemporada, creditosPelaImagem, lerLogBlackframe, creditosValidos, EpisodioAnalisado } from "../deteccao";

// Gerador pseudoaleatório com semente (teste sempre igual).
function aleatorio(semente: number) {
    let s = semente >>> 0;
    return () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

const SR = TAXA_AMOSTRAGEM;

// "Música": acordes de 3 notas trocando a cada 0,3 s — o mesmo pra mesma semente.
function musica(segundos: number, semente: number): Float64Array {
    const r = aleatorio(semente);
    const n = Math.round(segundos * SR);
    const out = new Float64Array(n);
    const notaLen = Math.round(0.3 * SR);
    let freqs = [0, 0, 0];
    for (let i = 0; i < n; i++) {
        if (i % notaLen === 0) freqs = [300 + r() * 1600, 300 + r() * 1600, 300 + r() * 1600];
        const t = i / SR;
        out[i] = 0.25 * (Math.sin(2 * Math.PI * freqs[0] * t) + Math.sin(2 * Math.PI * freqs[1] * t) + 0.6 * Math.sin(2 * Math.PI * freqs[2] * t));
    }
    return out;
}

// "Cena": ruído com volume que oscila (parecido com fala/efeitos).
function cena(segundos: number, semente: number): Float64Array {
    const r = aleatorio(semente);
    const n = Math.round(segundos * SR);
    const out = new Float64Array(n);
    let filtro = 0;
    let vol = 0.3;
    for (let i = 0; i < n; i++) {
        if (i % 800 === 0) vol = 0.05 + r() * 0.4;
        filtro = 0.7 * filtro + 0.3 * (r() * 2 - 1);
        out[i] = vol * filtro;
    }
    return out;
}

function juntar(partes: Float64Array[], ganho = 1, ruido = 0, semente = 99): Int16Array {
    const total = partes.reduce((s, p) => s + p.length, 0);
    const r = aleatorio(semente);
    const pcm = new Int16Array(total);
    let k = 0;
    for (const p of partes) for (let i = 0; i < p.length; i++) {
        const x = p[i] * ganho + ruido * (r() * 2 - 1);
        pcm[k++] = Math.max(-32768, Math.min(32767, Math.round(x * 20000)));
    }
    return pcm;
}

const q = (s: number) => Math.round(s / SEGUNDOS_POR_QUADRO);
const seg = (quadros: number) => quadros * SEGUNDOS_POR_QUADRO;

describe("impressão digital do áudio", () => {
    const abertura = musica(40, 7);
    // Episódio A: cena 30 s → abertura 40 s → cena 60 s
    const a = impressaoDoAudio(juntar([cena(30, 1), abertura, cena(60, 2)]));
    // Episódio B: cena 75 s → a MESMA abertura, mais baixa e com ruído → cena 20 s
    const b = impressaoDoAudio(juntar([cena(75, 3), abertura, cena(20, 4)], 0.7, 0.01, 5));

    it("acha a abertura igual mesmo em posições diferentes", () => {
        const t = trechoEmComum(a, b, q(15), q(180));
        expect(t).not.toBeNull();
        expect(seg(t!.inicioA)).toBeGreaterThan(28.5);
        expect(seg(t!.inicioA)).toBeLessThan(31.5);
        expect(seg(t!.fimA)).toBeGreaterThan(68.5);
        expect(seg(t!.fimA)).toBeLessThan(71.5);
        expect(seg(t!.inicioB)).toBeGreaterThan(73.5);
        expect(seg(t!.inicioB)).toBeLessThan(76.5);
    });

    it("episódios sem trecho em comum não inventam abertura", () => {
        const c = impressaoDoAudio(juntar([cena(60, 11), musica(30, 12), cena(40, 13)]));
        expect(trechoEmComum(a, c, q(15), q(180))).toBeNull();
    });

    it("silêncio não conta como trecho igual", () => {
        const mudo = new Int16Array(SR * 60);
        const fp = impressaoDoAudio(mudo);
        expect(trechoEmComum(fp, fp, q(15), q(180))).toBeNull();
    });

    it("vai e volta do banco sem perder nada", () => {
        expect(Array.from(impressaoDeBuffer(impressaoParaBuffer(a))!)).toEqual(Array.from(a));
    });
});

describe("marcadores da temporada", () => {
    it("abertura de cada episódio pelo vizinho e créditos pela música do fim", async () => {
        const abertura = musica(45, 21);
        const encerramento = musica(50, 22);
        const ep = (n: number, antes: number): EpisodioAnalisado => ({
            id: String(100 + n),
            numero: n,
            duracao: 1400,
            fpInicio: impressaoDoAudio(juntar([cena(antes, 30 + n), abertura, cena(60, 40 + n)])),
            // fim lido a partir de 1300 s: 40 s de cena e então os créditos
            fpFim: impressaoDoAudio(juntar([cena(40, 50 + n), encerramento, cena(10, 60 + n)])),
            fimInicio: 1300,
            creditosImagem: null,
        });
        const m = await marcadoresDaTemporada([ep(2, 50), ep(1, 20), ep(3, 5)]);
        const e1 = m.get("101")!;
        const e3 = m.get("103")!;
        expect(e1.aberturaInicio!).toBeGreaterThan(18.5);
        expect(e1.aberturaInicio!).toBeLessThan(21.5);
        expect(e1.aberturaFim!).toBeGreaterThan(63.5);
        expect(e1.aberturaFim!).toBeLessThan(66.5);
        expect(e3.aberturaInicio!).toBeLessThan(6.5);
        expect(e1.creditosInicio!).toBeGreaterThan(1338.5);
        expect(e1.creditosInicio!).toBeLessThan(1341.5);
        expect(e1.fonteCreditos).toBe("audio");
    });

    it("sem música repetida no fim, usa os créditos achados pela imagem", async () => {
        const base = { duracao: 1400, fpInicio: null, fpFim: null, fimInicio: 1100 };
        const m = await marcadoresDaTemporada([{ ...base, id: "1", numero: 1, creditosImagem: 1320 }]);
        expect(m.get("1")).toEqual({ aberturaInicio: null, aberturaFim: null, creditosInicio: 1320, fonteCreditos: "imagem" });
    });
});

describe("créditos pela imagem", () => {
    it("lê o log do blackframe somando o ponto de início", () => {
        const log = "[Parsed_blackframe_1 @ 0x1] frame:0 pblack:12 pts:0 t:0.000000 type:I last_keyframe:0\n" +
            "[Parsed_blackframe_1 @ 0x1] frame:1 pblack:95 pts:2002 t:2.002000 type:I last_keyframe:1\n";
        expect(lerLogBlackframe(log, 1000)).toEqual([{ t: 1000, preto: 12 }, { t: 1002.002, preto: 95 }]);
    });

    it("acha onde a tela fica escura com letreiro até o fim", () => {
        const amostras = [];
        for (let t = 5400; t < 6000; t += 2) amostras.push({ t, preto: t < 5760 ? 30 + (t % 7) : t === 5800 ? 40 : 93 });
        expect(creditosPelaImagem(amostras, 6000)).toBe(5760);
    });

    it("cena escura curta no meio não vira crédito", () => {
        const amostras = [];
        for (let t = 5400; t < 6000; t += 2) amostras.push({ t, preto: t >= 5500 && t < 5540 ? 95 : 20 });
        expect(creditosPelaImagem(amostras, 6000)).toBeNull();
    });

    it("créditos só valem no último terço e longe do fim", () => {
        expect(creditosValidos(500, 1400)).toBe(false);
        expect(creditosValidos(1395, 1400)).toBe(false);
        expect(creditosValidos(1300, 1400)).toBe(true);
    });
});
