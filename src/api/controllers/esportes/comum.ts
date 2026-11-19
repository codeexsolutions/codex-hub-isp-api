// Base da área de Esportes do app Synk TV (F1, UFC, NBA, NFL): busca JSON de
// APIs públicas com tempo limite e guarda o resultado. Todo mundo pede pra
// cá; a fonte recebe 1 chamada por validade. Se a fonte cair, devolve a
// última versão boa (melhor um placar de 1 min atrás do que tela vazia).

export async function buscarJson(url: string, limiteMs = 9000): Promise<any | null> {
    try {
        const r = await fetch(url, { headers: { "User-Agent": "SynkTV/1.0", Accept: "application/json" }, signal: AbortSignal.timeout(limiteMs) });
        if (!r.ok) return null;
        return await r.json();
    } catch {
        return null;
    }
}

type Guardado = { em: number; valor: unknown };
const cache = new Map<string, Guardado>();
const andamento = new Map<string, Promise<unknown>>();

// `gerar` devolve null quando a fonte falhou: aí fica o valor anterior.
export async function emCache<T>(chave: string, validadeMs: (valor: T) => number, gerar: () => Promise<T | null>): Promise<T | null> {
    const atual = cache.get(chave) as { em: number; valor: T } | undefined;
    if (atual && Date.now() - atual.em < validadeMs(atual.valor)) return atual.valor;
    const ja = andamento.get(chave) as Promise<T | null> | undefined;
    if (ja) return ja;
    const p = gerar()
        .catch(() => null)
        .then((novo) => {
            andamento.delete(chave);
            if (novo !== null) {
                cache.set(chave, { em: Date.now(), valor: novo });
                return novo;
            }
            return atual ? atual.valor : null;
        });
    andamento.set(chave, p);
    return p;
}

export const ESPN = "https://site.api.espn.com/apis/site/v2/sports";
export const ESPN_CLASSIFICACAO = "https://site.api.espn.com/apis/v2/sports";

export type Estado = "agendado" | "aovivo" | "encerrado";
export const estadoEspn = (st: any): Estado => (st && st.state === "in" ? "aovivo" : st && st.state === "post" ? "encerrado" : "agendado");

// Bandeira por código ISO de 2 letras (flagcdn: PNG pequeno, CDN público).
export const bandeira = (iso2?: string) => (iso2 ? `https://flagcdn.com/w80/${iso2.toLowerCase()}.png` : undefined);
