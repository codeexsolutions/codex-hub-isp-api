import { inject, injectable } from "tsyringe";
import INotificacaoClienteRepository from "../../core/interfaces/INotificacaoClienteRepository";
import IDBContext from "../interfaces/IDbContext";
import { notificacaoClienteModel } from "../../core/models/notificacaoClienteModel";

@injectable()
export default class NotificacaoClienteRepository implements INotificacaoClienteRepository {

    private _db:IDBContext;

    constructor(@inject("IDBContext") db:IDBContext){
        this._db = db;
    }

    async Salvar(cpf: string, codigoProvedor: string, titulo: string, corpo: string): Promise<void> {

        await this._db.Execulte<void>(
            `INSERT INTO notificacao_cliente (cpf, codigo_provedor, titulo, corpo) VALUES ($1,$2,$3,$4)`,
            [cpf, codigoProvedor, titulo, corpo]
        );
    }

    async Listar(cpf: string, codigoProvedor: string): Promise<notificacaoClienteModel[]> {

        const result = await this._db.Execulte<any>(
            `SELECT id, titulo, corpo, lida, criado_em FROM notificacao_cliente
             WHERE cpf = $1 AND codigo_provedor = $2 ORDER BY criado_em DESC`,
            [cpf, codigoProvedor]
        );

        return result.map((r:any) : notificacaoClienteModel => ({
            id: r.id,
            titulo: r.titulo,
            corpo: r.corpo,
            lida: r.lida,
            criadoEm: r.criado_em
        }));
    }

    async ContarNaoLidas(cpf: string, codigoProvedor: string): Promise<number> {

        const result = await this._db.Execulte<any>(
            `SELECT COUNT(*)::int AS total FROM notificacao_cliente WHERE cpf = $1 AND codigo_provedor = $2 AND lida = false`,
            [cpf, codigoProvedor]
        );

        return result[0]?.total ?? 0;
    }

    async MarcarLida(id: number, cpf: string, codigoProvedor: string): Promise<void> {

        await this._db.Execulte<void>(
            `UPDATE notificacao_cliente SET lida = true WHERE id = $1 AND cpf = $2 AND codigo_provedor = $3`,
            [id, cpf, codigoProvedor]
        );
    }

    async Excluir(id: number, cpf: string, codigoProvedor: string): Promise<void> {

        await this._db.Execulte<void>(
            `DELETE FROM notificacao_cliente WHERE id = $1 AND cpf = $2 AND codigo_provedor = $3`,
            [id, cpf, codigoProvedor]
        );
    }
}
