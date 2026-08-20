import { inject, injectable } from "tsyringe";
import IDBContext from "../interfaces/IDbContext";
import IParceiroRepository from "../../core/interfaces/IParceiroRepository";
import { parceiroModel } from "../../core/models/parceiroModel";
import { compraModel } from "../../core/models/compraModel";
import { configPontosModel } from "../../core/models/configPontosModel";
import { beneficioModel } from "../../core/models/beneficioModel";

@injectable()
export default class ParceiroRepository implements IParceiroRepository {

    private readonly _db:IDBContext;
    constructor(@inject("IDBContext") db:IDBContext){
        this._db = db;
    }

    async ObterPorUsuarioSenha(usuario:string, senha:string) : Promise<parceiroModel|null> {
        const select = `SELECT id, nome_parceiro AS nome, usuario, ativo, created_at AS criado_em
            FROM parceiros WHERE usuario = $1 AND senha = $2 AND ativo = true;`;
        const result = await this._db.Execulte<parceiroModel>(select, [usuario, senha]);
        return result[0] ?? null;
    }

    async ObterResumoFinanceiro(parceiroId:number) : Promise<{ status:string; qtd:number; total:number; synk:number; provedor:number }[]> {
        const select = `
            SELECT c.status,
                   COUNT(*) AS qtd,
                   COALESCE(SUM(c.valor), 0) AS total,
                   COALESCE(SUM(c.valor_synk), 0) AS synk,
                   COALESCE(SUM(c.valor_provedor), 0) AS provedor
            FROM beneficio_compras c
            JOIN marketing_beneficios b ON b.id = c.beneficio_id
            WHERE b.parceiro_id_fk = $1
            GROUP BY c.status;
        `;
        const result = await this._db.Execulte<any>(select, [parceiroId]);
        return result.map((r:any) => ({
            status: r.status,
            qtd: Number.parseInt(r.qtd),
            total: Number.parseFloat(r.total),
            synk: Number.parseFloat(r.synk),
            provedor: Number.parseFloat(r.provedor),
        }));
    }

    async ObterComprasParceiro(parceiroId:number) : Promise<compraModel[]> {
        const select = `
            SELECT c.*, b.titulo AS beneficio_titulo, p.nome_fantasia AS provedor_nome, p.empresa AS provedor_empresa
            FROM beneficio_compras c
            JOIN marketing_beneficios b ON b.id = c.beneficio_id
            JOIN provedores p ON p.codigo_provedor = c.codigo_provedor_fk
            WHERE b.parceiro_id_fk = $1
            ORDER BY c.criado_em DESC;
        `;
        return await this._db.Execulte<any>(select, [parceiroId]);
    }

    async ObterCompraPorCupom(cupom:string, parceiroId:number) : Promise<compraModel|null> {
        const select = `
            SELECT c.*, b.titulo AS beneficio_titulo, b.parceiro_id_fk
            FROM beneficio_compras c
            JOIN marketing_beneficios b ON b.id = c.beneficio_id
            WHERE c.cupom_codigo = $1 AND b.parceiro_id_fk = $2;
        `;
        const result = await this._db.Execulte<any>(select, [cupom, parceiroId]);
        return result[0] ?? null;
    }

    async ValidarCupom(cupom:string) : Promise<compraModel> {
        const update = `UPDATE beneficio_compras SET status = 'utilizado', validado_em = now()
            WHERE cupom_codigo = $1 AND status = 'pendente' RETURNING *;`;
        const result = await this._db.Execulte<compraModel>(update, [cupom]);
        return result[0];
    }

    async CancelarCupom(cupom:string) : Promise<compraModel> {
        const update = `UPDATE beneficio_compras SET status = 'cancelado'
            WHERE cupom_codigo = $1 AND status = 'pendente' RETURNING *;`;
        const result = await this._db.Execulte<compraModel>(update, [cupom]);
        return result[0];
    }

    async ObterConfigPontos() : Promise<configPontosModel> {
        const select = `SELECT pontos_por_real FROM config_pontos WHERE id = 1;`;
        const result = await this._db.Execulte<configPontosModel>(select, []);
        return result[0];
    }

    async RegistrarPontosGanhos(codigoProvedor:number, cpfCnpj:string, nome:string, pontos:number, idCompra:number) : Promise<void> {
        const insert = `INSERT INTO pontos_extrato
            (codigo_provedor_fk, cliente_cpf_cnpj, cliente_nome, tipo, pontos, origem_compra_id)
            VALUES ($1,$2,$3,'ganho',$4,$5);`;
        await this._db.Execulte<any>(insert, [codigoProvedor, cpfCnpj, nome, pontos, idCompra]);
    }

    // OFERTAS

    async CriarOferta(oferta:beneficioModel) : Promise<beneficioModel> {
        const insert = `INSERT INTO marketing_beneficios
            (categoria, parceiro, titulo, subtitulo, descricao, link_imagem, link_acao, ativo, valor, valor_original, validade_fim, regras, parceiro_id_fk)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`;
        const id = await this._db.Execulte<any>(insert, [
            oferta.categoria, oferta.parceiro, oferta.titulo, oferta.subtitulo, oferta.descricao,
            oferta.link_imagem, oferta.link_acao, oferta.ativo, oferta.valor ?? null,
            oferta.valor_original ?? null, oferta.validade_fim ?? null, oferta.regras ?? null,
            oferta.parceiro_id_fk,
        ]);
        return this.ObterOfertaPorId(id[0].id, oferta.parceiro_id_fk as number);
    }

    async ObterMinhasOfertas(parceiroId:number) : Promise<beneficioModel[]> {
        const select = `SELECT * FROM marketing_beneficios WHERE parceiro_id_fk = $1 ORDER BY id DESC;`;
        return await this._db.Execulte<beneficioModel>(select, [parceiroId]);
    }

    async ObterOfertaPorId(id:number, parceiroId:number) : Promise<beneficioModel> {
        const select = `SELECT * FROM marketing_beneficios WHERE parceiro_id_fk = $1 AND id = $2;`;
        const result = await this._db.Execulte<beneficioModel>(select, [parceiroId, id]);
        return result[0];
    }

    async EditarOferta(oferta:beneficioModel) : Promise<beneficioModel> {
        const update = `UPDATE marketing_beneficios SET
                categoria = $1, parceiro = $2, titulo = $3, subtitulo = $4, descricao = $5,
                link_imagem = $6, link_acao = $7, ativo = $8, valor = $9, valor_original = $10,
                validade_fim = $11, regras = $12
            WHERE parceiro_id_fk = $13 AND id = $14 RETURNING id;`;
        const result = await this._db.Execulte<any>(update, [
            oferta.categoria, oferta.parceiro, oferta.titulo, oferta.subtitulo, oferta.descricao,
            oferta.link_imagem, oferta.link_acao, oferta.ativo, oferta.valor ?? null,
            oferta.valor_original ?? null, oferta.validade_fim ?? null, oferta.regras ?? null,
            oferta.parceiro_id_fk, oferta.id,
        ]);
        return this.ObterOfertaPorId(result[0].id, oferta.parceiro_id_fk as number);
    }

    async ExcluirOferta(id:string, parceiroId:number) : Promise<{ removido:boolean }> {
        const usoCount = `SELECT
            (SELECT count(*) FROM beneficio_cliques WHERE beneficio_id = $1) +
            (SELECT count(*) FROM beneficio_compras WHERE beneficio_id = $1) AS total`;
        const uso = await this._db.Execulte<{ total:string }>(usoCount, [id]);
        const temHistorico = Number.parseInt(uso[0]?.total ?? "0") > 0;

        if (temHistorico) {
            // preserva histórico (relatórios/comissão) — só desativa a oferta.
            const desativar = `UPDATE marketing_beneficios SET ativo = false WHERE id = $1 AND parceiro_id_fk = $2`;
            await this._db.Execulte<any>(desativar, [id, parceiroId]);
            return { removido: false };
        }

        const exclui = `DELETE FROM marketing_beneficios WHERE id = $1 AND parceiro_id_fk = $2`;
        await this._db.Execulte<any>(exclui, [id, parceiroId]);
        return { removido: true };
    }
}
