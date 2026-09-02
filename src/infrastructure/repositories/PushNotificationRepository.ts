import { inject, injectable } from "tsyringe";
import IPushNotificationRepository from "../../core/interfaces/IPushNotificationRepository";
import IDBContext from "../interfaces/IDbContext";
import PushSubscription from "../../core/domains/PushSubscription";
import { assinanteNotificacaoModel } from "../../core/models/assinanteNotificacaoModel";

@injectable()
export default class PushNotificationRepository implements IPushNotificationRepository {

    private _db:IDBContext;

    constructor(@inject("IDBContext") db:IDBContext){
        this._db = db;
    }

    async Salvar(subscription: PushSubscription): Promise<string> {
        
        try{
            const result = await this._db.Execulte<string>(`INSERT INTO push_subscription (cpf, codigo_provedor, endpoint, auth, p256dh, device_name) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
                [subscription.Cpf, subscription.CodigoProvedor, subscription.Endpoint, subscription.Auth, subscription.P256dh, subscription.Device]
            )

            if(result.length > 0)
                return result[0];
            
            return "Não foi possivel salvar";

        }catch(error:any){
            throw new Error("Erro ao salvar subscription -> " + error.message)
        }


    }

    async BuscarPorCpf(cpf: string, codigoProvedor:string) : Promise<PushSubscription[]> {
        
        const result = await this._db.Execulte<any>("SELECT * FROM push_subscription WHERE cpf = $1 AND codigo_provedor = $2", [cpf, codigoProvedor])
        if(result.length < 1)
            return [];

        return result.map((sub: any) : PushSubscription => {
            const subscription = new PushSubscription()
            subscription.Cpf = sub.cpf,
            subscription.CodigoProvedor = sub.codigo_provedor,
            subscription.Device = sub.device_name,
            subscription.Endpoint = sub.endpoint,
            subscription.Auth = sub.auth,
            subscription.P256dh = sub.p256dh
            return subscription;
        })
    }

     async BuscarTodos(codigoProvedor:string) : Promise<PushSubscription[]> {
        
        const result = await this._db.Execulte<any>("SELECT * FROM push_subscription WHERE codigo_provedor = $1", [codigoProvedor])
        if(result.length < 1)
            return [];

        return result.map((sub: any) : PushSubscription => {
            const subscription = new PushSubscription()
            subscription.Cpf = sub.cpf,
            subscription.CodigoProvedor = sub.codigo_provedor,
            subscription.Device = sub.device_name,
            subscription.Endpoint = sub.endpoint,
            subscription.Auth = sub.auth,
            subscription.P256dh = sub.p256dh
            return subscription;
        })
    }
    
    async Remover(endpoint: string, codigoProvedor:string): Promise<void> {
        await this._db.Execulte<void>("DELETE FROM push_subscription WHERE endpoint = $1 AND codigo_provedor = $2", [endpoint, codigoProvedor]);

    }

    async ListarAssinantesComNome(codigoProvedor: string): Promise<assinanteNotificacaoModel[]> {
        const select = `
            SELECT ps.cpf,
                   MAX(ca.cliente_nome) AS nome,
                   COUNT(*)::int AS dispositivos,
                   MAX(ca.ultimo_login) AS ultimo_login,
                   BOOL_OR(ps.ativo) AS notificacao_ativa
            FROM push_subscription ps
            LEFT JOIN cliente_atividade ca
                ON ca.codigo_provedor_fk::text = ps.codigo_provedor
                AND regexp_replace(ca.cliente_cpf_cnpj, '\\D', '', 'g') = regexp_replace(ps.cpf, '\\D', '', 'g')
            WHERE ps.codigo_provedor = $1
            GROUP BY ps.cpf
            ORDER BY nome NULLS LAST, ps.cpf;
        `;
        const result = await this._db.Execulte<any>(select, [codigoProvedor]);
        return result.map((r:any) : assinanteNotificacaoModel => ({
            cpf: r.cpf,
            nome: r.nome,
            dispositivos: r.dispositivos,
            ultimoLogin: r.ultimo_login,
            notificacaoAtiva: r.notificacao_ativa,
        }));
    }

    async BuscarAssinantePorCpf(cpf: string, codigoProvedor: string): Promise<assinanteNotificacaoModel|null> {
        const select = `
            SELECT ps.cpf,
                   MAX(ca.cliente_nome) AS nome,
                   COUNT(*)::int AS dispositivos,
                   MAX(ca.ultimo_login) AS ultimo_login,
                   BOOL_OR(ps.ativo) AS notificacao_ativa
            FROM push_subscription ps
            LEFT JOIN cliente_atividade ca
                ON ca.codigo_provedor_fk::text = ps.codigo_provedor
                AND regexp_replace(ca.cliente_cpf_cnpj, '\\D', '', 'g') = regexp_replace(ps.cpf, '\\D', '', 'g')
            WHERE ps.codigo_provedor = $2 AND regexp_replace(ps.cpf, '\\D', '', 'g') = regexp_replace($1, '\\D', '', 'g')
            GROUP BY ps.cpf;
        `;
        const result = await this._db.Execulte<any>(select, [cpf, codigoProvedor]);
        if (!result[0]) return null;
        const r = result[0];
        return { cpf: r.cpf, nome: r.nome, dispositivos: r.dispositivos, ultimoLogin: r.ultimo_login, notificacaoAtiva: r.notificacao_ativa };
    }

}