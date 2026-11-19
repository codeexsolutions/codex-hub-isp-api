import { readFileSync } from "fs";
import { join } from "path";
import { container } from "tsyringe";
import IDBContext from "../../../infrastructure/interfaces/IDbContext";
import { impressaoDeBuffer, impressaoParaBuffer } from "./impressao";
import type { EpisodioAnalisado, Marcador } from "./deteccao";

// Banco dos marcadores (tabela marcadores_midia — ver
// infrastructure/database/sql/2026_11_marcadores_midia.sql).

export type TipoMidia = "episodio" | "filme";

// Mesmo SQL da migração, rodado uma vez no primeiro uso (IF NOT EXISTS) —
// funciona mesmo que ninguém tenha aplicado a migração no banco.
const DDL_PADRAO = `
CREATE TABLE IF NOT EXISTS marcadores_midia (
    servidor VARCHAR(255) NOT NULL,
    tipo VARCHAR(8) NOT NULL CHECK (tipo IN ('episodio','filme')),
    midia_id VARCHAR(40) NOT NULL,
    serie_id INTEGER, temporada INTEGER, numero INTEGER, duracao REAL,
    fp_inicio BYTEA, fp_fim BYTEA, fim_inicio REAL, creditos_imagem REAL,
    abertura_inicio REAL, abertura_fim REAL, creditos_inicio REAL,
    fonte_creditos VARCHAR(8) CHECK (fonte_creditos IN ('audio','imagem')),
    erro VARCHAR(40),
    analisado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (servidor, tipo, midia_id)
);
CREATE INDEX IF NOT EXISTS idx_marcadores_temporada ON marcadores_midia (servidor, serie_id, temporada);`;

function ddl(): string {
    try {
        return readFileSync(join(__dirname, "../../../infrastructure/database/sql/2026_11_marcadores_midia.sql"), "utf-8");
    } catch {
        return DDL_PADRAO; // build (dist/) não copia os .sql
    }
}

const db = () => container.resolve<IDBContext>("IDBContext");
let pronta: Promise<void> | null = null;

function garantirTabela(): Promise<void> {
    if (!pronta) {
        pronta = db().Execulte(ddl(), []).then(() => undefined);
        pronta.catch(() => { pronta = null; });
    }
    return pronta;
}

// Erro de análise vale por 3 dias; depois tenta de novo (servidor fora do
// ar, episódio que estava quebrado e foi trocado no painel…).
const NOVA_TENTATIVA_DIAS = 3;

export type MarcadorSalvo = Marcador & { id: string };

// O que já se sabe desses ids — sem as impressões (leve, é o que o app lê).
export async function buscarMarcadores(servidor: string, tipo: TipoMidia, ids: string[]): Promise<{ prontos: MarcadorSalvo[]; resolvidos: Set<string> }> {
    await garantirTabela();
    const linhas = await db().Execulte<any>(
        `SELECT midia_id, abertura_inicio, abertura_fim, creditos_inicio, fonte_creditos, erro,
                (erro IS NOT NULL AND analisado_em < now() - interval '${NOVA_TENTATIVA_DIAS} days') AS tentar_de_novo
           FROM marcadores_midia WHERE servidor = $1 AND tipo = $2 AND midia_id = ANY($3)`,
        [servidor, tipo, ids]
    );
    const prontos: MarcadorSalvo[] = [];
    const resolvidos = new Set<string>();
    for (const l of linhas) {
        if (!l.tentar_de_novo) resolvidos.add(l.midia_id);
        if (l.erro) continue;
        prontos.push({
            id: l.midia_id,
            aberturaInicio: l.abertura_inicio,
            aberturaFim: l.abertura_fim,
            creditosInicio: l.creditos_inicio,
            fonteCreditos: l.fonte_creditos,
        });
    }
    return { prontos, resolvidos };
}

// Episódios da temporada já extraídos, com as impressões (pra recalcular).
export async function episodiosExtraidos(servidor: string, serieId: number, temporada: number): Promise<EpisodioAnalisado[]> {
    await garantirTabela();
    const linhas = await db().Execulte<any>(
        `SELECT midia_id, numero, duracao, fp_inicio, fp_fim, fim_inicio, creditos_imagem
           FROM marcadores_midia
          WHERE servidor = $1 AND tipo = 'episodio' AND serie_id = $2 AND temporada = $3 AND erro IS NULL`,
        [servidor, serieId, temporada]
    );
    return linhas.map((l) => ({
        id: l.midia_id,
        numero: l.numero ?? 0,
        duracao: l.duracao ?? 0,
        fpInicio: impressaoDeBuffer(l.fp_inicio),
        fpFim: impressaoDeBuffer(l.fp_fim),
        fimInicio: l.fim_inicio ?? 0,
        creditosImagem: l.creditos_imagem,
    }));
}

export type Extracao = {
    servidor: string;
    tipo: TipoMidia;
    id: string;
    serieId?: number;
    temporada?: number;
    numero?: number;
    duracao: number;
    fpInicio: Uint32Array | null;
    fpFim: Uint32Array | null;
    fimInicio: number;
    creditosImagem: number | null;
    // filme: o marcador já sai pronto (não depende de vizinho)
    marcador?: Marcador;
};

export async function salvarExtracao(e: Extracao): Promise<void> {
    await garantirTabela();
    const m = e.marcador;
    await db().Execulte(
        `INSERT INTO marcadores_midia (servidor, tipo, midia_id, serie_id, temporada, numero, duracao, fp_inicio, fp_fim, fim_inicio, creditos_imagem,
                                       abertura_inicio, abertura_fim, creditos_inicio, fonte_creditos, erro, analisado_em)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NULL,now())
         ON CONFLICT (servidor, tipo, midia_id) DO UPDATE SET
            serie_id = EXCLUDED.serie_id, temporada = EXCLUDED.temporada, numero = EXCLUDED.numero, duracao = EXCLUDED.duracao,
            fp_inicio = EXCLUDED.fp_inicio, fp_fim = EXCLUDED.fp_fim, fim_inicio = EXCLUDED.fim_inicio, creditos_imagem = EXCLUDED.creditos_imagem,
            abertura_inicio = EXCLUDED.abertura_inicio, abertura_fim = EXCLUDED.abertura_fim, creditos_inicio = EXCLUDED.creditos_inicio,
            fonte_creditos = EXCLUDED.fonte_creditos, erro = NULL, analisado_em = now()`,
        [
            e.servidor, e.tipo, e.id, e.serieId ?? null, e.temporada ?? null, e.numero ?? null, e.duracao || null,
            e.fpInicio ? impressaoParaBuffer(e.fpInicio) : null,
            e.fpFim ? impressaoParaBuffer(e.fpFim) : null,
            e.fimInicio || null, e.creditosImagem,
            m ? m.aberturaInicio : null, m ? m.aberturaFim : null, m ? m.creditosInicio : null, m ? m.fonteCreditos : null,
        ]
    );
}

export async function salvarErro(servidor: string, tipo: TipoMidia, id: string, erro: string, meta: { serieId?: number; temporada?: number; numero?: number } = {}): Promise<void> {
    await garantirTabela();
    await db().Execulte(
        `INSERT INTO marcadores_midia (servidor, tipo, midia_id, serie_id, temporada, numero, erro, analisado_em)
         VALUES ($1,$2,$3,$4,$5,$6,$7,now())
         ON CONFLICT (servidor, tipo, midia_id) DO UPDATE SET erro = EXCLUDED.erro, analisado_em = now()`,
        [servidor, tipo, id, meta.serieId ?? null, meta.temporada ?? null, meta.numero ?? null, erro.slice(0, 40)]
    );
}

export async function salvarMarcador(servidor: string, tipo: TipoMidia, id: string, m: Marcador): Promise<void> {
    await db().Execulte(
        `UPDATE marcadores_midia SET abertura_inicio = $4, abertura_fim = $5, creditos_inicio = $6, fonte_creditos = $7
          WHERE servidor = $1 AND tipo = $2 AND midia_id = $3`,
        [servidor, tipo, id, m.aberturaInicio, m.aberturaFim, m.creditosInicio, m.fonteCreditos]
    );
}
