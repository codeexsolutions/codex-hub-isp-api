import { inject, injectable } from "tsyringe";
import INotificacaoTemplateRepository from "../../core/interfaces/INotificacaoTemplateRepository";
import IDBContext from "../interfaces/IDbContext";
import { notificacaoTemplateModel } from "../../core/models/notificacaoTemplateModel";

@injectable()
export default class NotificacaoTemplateRepository implements INotificacaoTemplateRepository {

    private _db:IDBContext;

    constructor(@inject("IDBContext") db:IDBContext){
        this._db = db;
    }

    async Listar(codigoProvedor: number): Promise<notificacaoTemplateModel[]> {

        const select = `SELECT id, nome, titulo, corpo FROM provedor_notificacao_templates
            WHERE codigo_provedor_fk = $1 ORDER BY criado_em DESC;`;

        return await this._db.Execulte<notificacaoTemplateModel>(select, [codigoProvedor]);
    }

    async Criar(codigoProvedor: number, nome: string, titulo: string, corpo: string): Promise<notificacaoTemplateModel> {

        const insert = `INSERT INTO provedor_notificacao_templates (codigo_provedor_fk, nome, titulo, corpo)
            VALUES ($1,$2,$3,$4) RETURNING id, nome, titulo, corpo;`;

        const result = await this._db.Execulte<notificacaoTemplateModel>(insert, [codigoProvedor, nome, titulo, corpo]);
        return result[0];
    }

    async Excluir(id: number, codigoProvedor: number): Promise<void> {

        await this._db.Execulte<void>(
            `DELETE FROM provedor_notificacao_templates WHERE id = $1 AND codigo_provedor_fk = $2;`,
            [id, codigoProvedor]
        );
    }
}
