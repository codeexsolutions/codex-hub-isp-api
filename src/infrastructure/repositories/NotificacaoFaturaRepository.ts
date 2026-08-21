import { inject, injectable } from "tsyringe";
import INotificacaoFaturaRepository, { assinanteComPush } from "../../core/interfaces/INotificacaoFaturaRepository";
import IDBContext from "../interfaces/IDbContext";

@injectable()
export default class NotificacaoFaturaRepository implements INotificacaoFaturaRepository {

    private _db:IDBContext;

    constructor(@inject("IDBContext") db:IDBContext){
        this._db = db;
    }

    async ListarAssinantesComPush(): Promise<assinanteComPush[]> {

        const result = await this._db.Execulte<any>(
            "SELECT DISTINCT cpf, codigo_provedor FROM push_subscription",
            []
        );

        return result.map((r:any) : assinanteComPush => ({
            cpf: r.cpf,
            codigoProvedor: r.codigo_provedor
        }));
    }

    async JaNotificado(cpf: string, codigoProvedor: string, faturaId: string, tipo: string): Promise<boolean> {

        const result = await this._db.Execulte<any>(
            "SELECT id FROM notificacao_fatura_cliente WHERE cpf = $1 AND codigo_provedor = $2 AND fatura_id = $3 AND tipo = $4",
            [cpf, codigoProvedor, faturaId, tipo]
        );

        return result.length > 0;
    }

    async RegistrarNotificacao(cpf: string, codigoProvedor: string, faturaId: string, tipo: string): Promise<void> {

        await this._db.Execulte<void>(
            `INSERT INTO notificacao_fatura_cliente (cpf, codigo_provedor, fatura_id, tipo)
             VALUES ($1,$2,$3,$4) ON CONFLICT (cpf, codigo_provedor, fatura_id, tipo) DO NOTHING`,
            [cpf, codigoProvedor, faturaId, tipo]
        );
    }
}
