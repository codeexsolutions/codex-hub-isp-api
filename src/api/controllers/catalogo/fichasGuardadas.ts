import { container } from "tsyringe";
import IDBContext from "../../../infrastructure/interfaces/IDbContext";

// Fichas do TMDB guardadas no banco (tabela tmdb_fichas — ver
// infrastructure/database/sql/2026_11_tmdb_fichas.sql): sinopse da série e
// dos episódios ficam DEFINITIVAS — o TMDB é consultado uma vez por série,
// não a cada deploy. Banco fora do ar nunca quebra a rota: só não guarda.

const DDL = `CREATE TABLE IF NOT EXISTS tmdb_fichas (
    chave VARCHAR(400) PRIMARY KEY,
    valor JSONB NOT NULL,
    salvo_em TIMESTAMPTZ NOT NULL DEFAULT now()
);`;

// Sobe quando a regra de escolha da série mudar (as fichas antigas deixam
// de valer sem precisar apagar nada).
export const VERSAO_FICHAS = "v1";

const db = () => container.resolve<IDBContext>("IDBContext");
let pronta: Promise<void> | null = null;
function garantirTabela(): Promise<void> {
    if (!pronta) {
        pronta = db().Execulte(DDL, []).then(() => undefined);
        pronta.catch(() => { pronta = null; });
    }
    return pronta;
}

export async function lerFicha<T>(chave: string): Promise<T | undefined> {
    try {
        await garantirTabela();
        const linhas = await db().Execulte<{ valor: T }>(`SELECT valor FROM tmdb_fichas WHERE chave = $1`, [chave.slice(0, 400)]);
        return linhas.length ? linhas[0].valor : undefined;
    } catch {
        return undefined;
    }
}

export async function salvarFicha(chave: string, valor: unknown): Promise<void> {
    try {
        await garantirTabela();
        await db().Execulte(
            `INSERT INTO tmdb_fichas (chave, valor, salvo_em) VALUES ($1, $2::jsonb, now())
             ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, salvo_em = now()`,
            [chave.slice(0, 400), JSON.stringify(valor)]
        );
    } catch {
        // sem banco: segue só com o cache em memória
    }
}

// Mesma busca, mesma chave: "Suits" e "suits " caem na mesma ficha.
export function chaveFicha(tipo: "serie" | "episodios" | "capas", titulo: string, ano?: number, extra: Array<string | number | boolean | undefined> = []): string {
    const t = (titulo || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
    return [tipo, VERSAO_FICHAS, t, ano || "", ...extra.map((x) => (x === undefined ? "" : String(x)))].join("|");
}
