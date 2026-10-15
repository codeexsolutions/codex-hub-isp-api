import { inject, injectable } from "tsyringe";
import IRevendedorRepository from "../../core/interfaces/IRevendedorRepository";
import IDBContext from "../interfaces/IDbContext";
import { revendedorModel } from "../../core/models/revendedorModel";
import { licencaTvModel } from "../../core/models/licencaTvModel";

@injectable()
export default class RevendedorRepository implements IRevendedorRepository {

    private readonly _db:IDBContext;

    constructor(@inject("IDBContext") db:IDBContext){
        this._db = db;
    }

    async ObterPorUsuarioSenha(usuario: string, senha: string): Promise<revendedorModel | null> {
        const select = `SELECT id, nome, usuario, status, criado_em FROM revendedores
            WHERE usuario = $1 AND senha = $2 AND status = 'ATIVO';`;
        const result = await this._db.Execulte<revendedorModel>(select, [usuario, senha]);
        return result[0] ?? null;
    }

    async ObterPorId(id: number): Promise<revendedorModel | null> {
        const select = `SELECT id, nome, usuario, status, criado_em FROM revendedores WHERE id = $1;`;
        const result = await this._db.Execulte<revendedorModel>(select, [id]);
        return result[0] ?? null;
    }

    async ListarLicencasTv(revendedorId: number): Promise<licencaTvModel[]> {
        const select = `SELECT * FROM licencas_tv WHERE revendedor_id_fk = $1 ORDER BY criado_em DESC;`;
        return await this._db.Execulte<licencaTvModel>(select, [revendedorId]);
    }

    async CriarLicencaTv(revendedorId: number, chave: string, nome: string, telefone: string, valor: number): Promise<licencaTvModel> {
        const insert = `INSERT INTO licencas_tv (chave, nome, telefone, valor, status, vencimento, revendedor_id_fk)
            VALUES ($1,$2,$3,$4,'pendente',NULL,$5) RETURNING *;`;
        const result = await this._db.Execulte<licencaTvModel>(insert, [chave, nome, telefone, valor, revendedorId]);
        return result[0];
    }

    async ObterLicencaTvPorId(id: number, revendedorId: number): Promise<licencaTvModel | null> {
        const select = `SELECT * FROM licencas_tv WHERE id = $1 AND revendedor_id_fk = $2;`;
        const result = await this._db.Execulte<licencaTvModel>(select, [id, revendedorId]);
        return result[0] ?? null;
    }

    async AprovarLicencaTv(id: number, revendedorId: number): Promise<licencaTvModel> {
        const update = `UPDATE licencas_tv SET status = 'ativa', vencimento = (CURRENT_DATE + INTERVAL '1 year')::date, ativado_em = now()
            WHERE id = $1 AND revendedor_id_fk = $2 RETURNING *;`;
        const result = await this._db.Execulte<licencaTvModel>(update, [id, revendedorId]);
        return result[0];
    }

    async CancelarLicencaTv(id: number, revendedorId: number): Promise<licencaTvModel> {
        const update = `UPDATE licencas_tv SET status = 'cancelada' WHERE id = $1 AND revendedor_id_fk = $2 RETURNING *;`;
        const result = await this._db.Execulte<licencaTvModel>(update, [id, revendedorId]);
        return result[0];
    }

    async DefinirLinkPagamentoListaLicencaTv(id: number, revendedorId: number, link: string | null): Promise<licencaTvModel> {
        const update = `UPDATE licencas_tv SET link_pagamento_lista = $1 WHERE id = $2 AND revendedor_id_fk = $3 RETURNING *;`;
        const result = await this._db.Execulte<licencaTvModel>(update, [link, id, revendedorId]);
        return result[0];
    }
}
