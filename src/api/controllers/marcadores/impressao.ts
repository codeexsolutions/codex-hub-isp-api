// "Impressão digital" do áudio — o mesmo princípio que a Netflix e o plugin
// Intro Skipper do Jellyfin usam pra achar a abertura de uma série: a
// abertura tem a MESMA música em todo episódio, então dois episódios
// vizinhos têm um trecho de som igual (em posições que podem variar, por
// causa da cena antes da abertura). Achar esse trecho = achar a abertura.
// O mesmo vale pros créditos, comparando o fim dos episódios.
//
// Algoritmo (hash de Haitsma & Kalker, "Philips robust hash"):
//   - áudio mono a 8 kHz, quadros de 0,512 s andando de 0,064 s em 0,064 s
//     (passo curto: o mesmo som em dois episódios quase nunca começa no
//     mesmo "grid" de quadros, e desalinhar meio passo já embaralha bits);
//   - energia de 33 faixas de frequência entre 300 e 2000 Hz (escala log);
//   - cada quadro vira 32 bits: bit m = a diferença de energia entre as
//     faixas m e m+1 subiu ou desceu em relação ao quadro anterior.
// Isso aguenta bem volume diferente, compressão e ruído leve: o mesmo som
// dá quase os mesmos bits; sons diferentes dão ~16 bits de 32 diferentes.
//
// Tudo aqui é puro (sem rede, sem ffmpeg) — dá pra testar com áudio
// sintético (ver __tests__/impressao.test.ts).

export const TAXA_AMOSTRAGEM = 8000;
const TAMANHO_QUADRO = 4096; // 0,512 s
const PASSO_QUADRO = 512; // 0,064 s
export const SEGUNDOS_POR_QUADRO = PASSO_QUADRO / TAXA_AMOSTRAGEM;

const FAIXAS = 33;
const FREQ_MIN = 300;
const FREQ_MAX = 2000;
// Abaixo disso (≈ -50 dBFS) o quadro é silêncio: o hash seria ruído puro.
const LIMIAR_SILENCIO = 0.003;
// Hash 0 = "quadro sem som útil" (nunca casa com nada).
export const SILENCIO = 0;

/* ------------------------------ FFT ------------------------------ */

const janelaHann = new Float64Array(TAMANHO_QUADRO);
for (let i = 0; i < TAMANHO_QUADRO; i++) janelaHann[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (TAMANHO_QUADRO - 1));

const bitsFft = Math.log2(TAMANHO_QUADRO);
const reverso = new Uint32Array(TAMANHO_QUADRO);
for (let i = 0; i < TAMANHO_QUADRO; i++) {
    let r = 0;
    for (let b = 0; b < bitsFft; b++) r |= ((i >> b) & 1) << (bitsFft - 1 - b);
    reverso[i] = r;
}
const cosTab = new Float64Array(TAMANHO_QUADRO / 2);
const senTab = new Float64Array(TAMANHO_QUADRO / 2);
for (let i = 0; i < TAMANHO_QUADRO / 2; i++) {
    cosTab[i] = Math.cos((-2 * Math.PI * i) / TAMANHO_QUADRO);
    senTab[i] = Math.sin((-2 * Math.PI * i) / TAMANHO_QUADRO);
}

// FFT radix-2 iterativa, no lugar.
function fft(re: Float64Array, im: Float64Array): void {
    const n = TAMANHO_QUADRO;
    for (let i = 0; i < n; i++) {
        const j = reverso[i];
        if (j > i) {
            const tr = re[i]; re[i] = re[j]; re[j] = tr;
            const ti = im[i]; im[i] = im[j]; im[j] = ti;
        }
    }
    for (let tam = 2; tam <= n; tam <<= 1) {
        const metade = tam >> 1;
        const passoTab = n / tam;
        for (let ini = 0; ini < n; ini += tam) {
            for (let k = 0; k < metade; k++) {
                const c = cosTab[k * passoTab];
                const s = senTab[k * passoTab];
                const a = ini + k;
                const b = a + metade;
                const xr = re[b] * c - im[b] * s;
                const xi = re[b] * s + im[b] * c;
                re[b] = re[a] - xr;
                im[b] = im[a] - xi;
                re[a] += xr;
                im[a] += xi;
            }
        }
    }
}

// Limites das faixas, em índices do espectro.
const limitesFaixas = new Uint32Array(FAIXAS + 1);
for (let b = 0; b <= FAIXAS; b++) {
    const f = FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, b / FAIXAS);
    limitesFaixas[b] = Math.round((f * TAMANHO_QUADRO) / TAXA_AMOSTRAGEM);
}

/* --------------------------- Impressão --------------------------- */

// PCM 16 bits mono a 8 kHz (saída do ffmpeg "-ac 1 -ar 8000 -f s16le") →
// um hash de 32 bits por quadro.
export function impressaoDoAudio(pcm: Int16Array): Uint32Array {
    if (pcm.length < TAMANHO_QUADRO) return new Uint32Array(0);
    const total = 1 + Math.floor((pcm.length - TAMANHO_QUADRO) / PASSO_QUADRO);
    const saida = new Uint32Array(total);
    const re = new Float64Array(TAMANHO_QUADRO);
    const im = new Float64Array(TAMANHO_QUADRO);
    let energia = new Float64Array(FAIXAS);
    let anterior: Float64Array | null = null;

    for (let q = 0; q < total; q++) {
        const ini = q * PASSO_QUADRO;
        let somaQuad = 0;
        for (let i = 0; i < TAMANHO_QUADRO; i++) {
            const x = pcm[ini + i] / 32768;
            somaQuad += x * x;
            re[i] = x * janelaHann[i];
            im[i] = 0;
        }
        fft(re, im);
        energia = new Float64Array(FAIXAS);
        for (let b = 0; b < FAIXAS; b++) {
            let e = 0;
            for (let k = limitesFaixas[b]; k < limitesFaixas[b + 1]; k++) e += re[k] * re[k] + im[k] * im[k];
            energia[b] = e;
        }
        const rms = Math.sqrt(somaQuad / TAMANHO_QUADRO);
        if (!anterior || rms < LIMIAR_SILENCIO) {
            saida[q] = SILENCIO;
        } else {
            let h = 0;
            for (let m = 0; m < 32; m++) {
                const d = energia[m] - energia[m + 1] - (anterior[m] - anterior[m + 1]);
                if (d > 0) h |= 1 << m;
            }
            // 0 é reservado pro silêncio
            saida[q] = h === 0 ? 1 : h >>> 0;
        }
        anterior = energia;
    }
    return saida;
}

export function pcmDeBuffer(buf: Buffer): Int16Array {
    const n = Math.floor(buf.length / 2);
    const pcm = new Int16Array(n);
    for (let i = 0; i < n; i++) pcm[i] = buf.readInt16LE(i * 2);
    return pcm;
}

// Guardar no banco (BYTEA) e ler de volta.
export function impressaoParaBuffer(fp: Uint32Array): Buffer {
    const buf = Buffer.alloc(fp.length * 4);
    for (let i = 0; i < fp.length; i++) buf.writeUInt32LE(fp[i], i * 4);
    return buf;
}

export function impressaoDeBuffer(buf: Buffer | null | undefined): Uint32Array | null {
    if (!buf || buf.length < 4) return null;
    const n = Math.floor(buf.length / 4);
    const fp = new Uint32Array(n);
    for (let i = 0; i < n; i++) fp[i] = buf.readUInt32LE(i * 4);
    return fp;
}

/* --------------------------- Comparação --------------------------- */

// Bits diferentes entre dois hashes (tabela de 16 bits: rápido no laço).
const BITS16 = new Uint8Array(65536);
for (let i = 1; i < 65536; i++) BITS16[i] = BITS16[i >> 1] + (i & 1);
const bitsDiferentes = (x: number, y: number) => {
    const z = (x ^ y) >>> 0;
    return BITS16[z & 0xffff] + BITS16[z >>> 16];
};

// Quadro "parecido": até 8 de 32 bits diferentes. Ao acaso isso acontece em
// ~0,4% dos quadros; no mesmo som, na maioria deles.
const BITS_PARECIDO = 8;
// Média de bits diferentes numa janela de ~2 s pra contar como "mesmo som"
// (sons sem relação ficam em ~16).
const JANELA_SUAVE = 32;
const LIMIAR_BITS = 11;
// Buraco curto dentro do trecho (pausa, efeito sonoro por cima) não quebra.
const EMENDA_QUADROS = 24;
const MAX_CANDIDATOS = 6;

// Trecho igual entre A e B, em quadros: A[inicioA, fimA) ≈ B[inicioB, fimB).
export type TrechoComum = { inicioA: number; fimA: number; inicioB: number; fimB: number };

// Testa TODOS os deslocamentos entre A e B (força bruta, de 2 em 2
// quadros): o deslocamento certo tem muito mais quadros parecidos que o
// acaso. Só os mais promissores passam pela análise fina. Uns 100 ms por
// par de janelas de 7 min.
export function trechoEmComum(a: Uint32Array, b: Uint32Array, minQuadros: number, maxQuadros: number): TrechoComum | null {
    if (a.length < minQuadros || b.length < minQuadros) return null;
    const minBons = Math.max(15, Math.round(minQuadros * 0.12));
    const pontuados: { d: number; bons: number }[] = [];
    for (let d = -(a.length - minQuadros); d <= b.length - minQuadros; d++) {
        const ini = Math.max(0, -d);
        const fim = Math.min(a.length, b.length - d);
        let bons = 0;
        for (let i = ini; i < fim; i += 2) {
            const x = a[i];
            const y = b[i + d];
            if (x !== SILENCIO && y !== SILENCIO && bitsDiferentes(x, y) <= BITS_PARECIDO) bons++;
        }
        if (bons >= minBons) pontuados.push({ d, bons });
    }
    pontuados.sort((x, y) => y.bons - x.bons);
    const escolhidos: number[] = [];
    for (const p of pontuados) {
        if (escolhidos.length >= MAX_CANDIDATOS) break;
        if (escolhidos.some((d) => Math.abs(d - p.d) <= 3)) continue;
        escolhidos.push(p.d);
    }

    let melhor: TrechoComum | null = null;
    for (const d0 of escolhidos) {
        for (const d of [d0 - 1, d0, d0 + 1]) {
            const t = maiorTrechoNoDeslocamento(a, b, d, minQuadros, maxQuadros);
            if (t && (!melhor || t.fimA - t.inicioA > melhor.fimA - melhor.inicioA)) melhor = t;
        }
    }
    return melhor;
}

function maiorTrechoNoDeslocamento(a: Uint32Array, b: Uint32Array, d: number, minQuadros: number, maxQuadros: number): TrechoComum | null {
    const ini = Math.max(0, -d);
    const fim = Math.min(a.length, b.length - d);
    const n = fim - ini;
    if (n < minQuadros) return null;

    // distância por quadro (silêncio conta como totalmente diferente)
    const acumulado = new Float64Array(n + 1);
    for (let k = 0; k < n; k++) {
        const x = a[ini + k];
        const y = b[ini + k + d];
        const dist = x === SILENCIO || y === SILENCIO ? 32 : bitsDiferentes(x, y);
        acumulado[k + 1] = acumulado[k] + dist;
    }
    const meia = JANELA_SUAVE >> 1;
    const igual = new Uint8Array(n);
    for (let k = 0; k < n; k++) {
        const p = Math.max(0, k - meia);
        const q = Math.min(n, k + meia);
        igual[k] = (acumulado[q] - acumulado[p]) / (q - p) <= LIMIAR_BITS ? 1 : 0;
    }

    // maior sequência de "igual", emendando buracos curtos
    let melhorIni = -1;
    let melhorFim = -1;
    let k = 0;
    while (k < n) {
        if (!igual[k]) { k++; continue; }
        const comeco = k;
        let ultimo = k;
        let buraco = 0;
        for (k = k + 1; k < n; k++) {
            if (igual[k]) { ultimo = k; buraco = 0; }
            else if (++buraco > EMENDA_QUADROS) break;
        }
        if (ultimo + 1 - comeco > melhorFim - melhorIni) { melhorIni = comeco; melhorFim = ultimo + 1; }
    }
    const tamanho = melhorFim - melhorIni;
    // Longo demais = não é abertura (episódio duplicado no painel, ou a
    // janela inteira igual) — não arrisca pular conteúdo.
    if (melhorIni < 0 || tamanho < minQuadros || tamanho > maxQuadros) return null;
    return { inicioA: ini + melhorIni, fimA: ini + melhorFim, inicioB: ini + melhorIni + d, fimB: ini + melhorFim + d };
}
