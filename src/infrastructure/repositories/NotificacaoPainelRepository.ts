import { inject, injectable } from "tsyringe";
import INotificacaoPainelRepository from "../../core/interfaces/INotificacaoPainelRepository";
import IDBContext from "../interfaces/IDbContext";
import PushSubscriptionPainel from "../../core/domains/PushSubscriptionPainel";
import { notificacaoPainelModel } from "../../core/models/notificacaoPainelModel";

@injectable()
export default class NotificacaoPainelRepository implements INotificacaoPainelRepository {

    private _db:IDBContext;

    constructor(@inject("IDBContext") db:IDBContext){
        this._db = db;
    }

    async SalvarSubscricao(subscription: PushSubscriptionPainel): Promise<string> {

        const result = await this._db.Execulte<any>(
            `INSERT INTO push_subscription_painel (codigo_provedor, endpoint, auth, p256dh, device_name)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (codigo_provedor, endpoint) DO UPDATE SET auth = EXCLUDED.auth, p256dh = EXCLUDED.p256dh, ativo = true
             RETURNING id`,
            [subscription.CodigoProvedor, subscription.Endpoint, subscription.Auth, subscription.P256dh, subscription.Device]
        );

        return result[0]?.id ?? "";
    }

    async BuscarSubscricoes(codigoProvedor: string): Promise<PushSubscriptionPainel[]> {

        const result = await this._db.Execulte<any>(
            `SELECT * FROM push_subscription_painel WHERE codigo_provedor = $1 AND ativo = true`,
            [codigoProvedor]
        );

        return result.map((sub: any) : PushSubscriptionPainel => {
            const subscription = new PushSubscriptionPainel();
            subscription.CodigoProvedor = sub.codigo_provedor;
            subscription.Device = sub.device_name;
            subscription.Endpoint = sub.endpoint;
            subscription.Auth = sub.auth;
            subscription.P256dh = sub.p256dh;
            return subscription;
        });
    }

    async RemoverSubscricao(endpoint: string, codigoProvedor: string): Promise<void> {
        await this._db.Execulte<void>(
            `DELETE FROM push_subscription_painel WHERE endpoint = $1 AND codigo_provedor = $2`,
            [endpoint, codigoProvedor]
        );
    }

    async SalvarNotificacao(codigoProvedor: string, tipo: string, titulo: string, corpo: string): Promise<void> {
        await this._db.Execulte<void>(
            `INSERT INTO notificacao_painel (codigo_provedor, tipo, titulo, corpo) VALUES ($1,$2,$3,$4)`,
            [codigoProvedor, tipo, titulo, corpo]
        );
    }

    async Listar(codigoProvedor: string): Promise<notificacaoPainelModel[]> {

        const result = await this._db.Execulte<any>(
            `SELECT id, tipo, titulo, corpo, lida, criado_em FROM notificacao_painel
             WHERE codigo_provedor = $1 ORDER BY criado_em DESC LIMIT 50`,
            [codigoProvedor]
        );

        return result.map((r:any) : notificacaoPainelModel => ({
            id: r.id,
            tipo: r.tipo,
            titulo: r.titulo,
            corpo: r.corpo,
            lida: r.lida,
            criadoEm: r.criado_em
        }));
    }

    async ContarNaoLidas(codigoProvedor: string): Promise<number> {

        const result = await this._db.Execulte<any>(
            `SELECT COUNT(*)::int AS total FROM notificacao_painel WHERE codigo_provedor = $1 AND lida = false`,
            [codigoProvedor]
        );

        return result[0]?.total ?? 0;
    }

    async MarcarLida(id: number, codigoProvedor: string): Promise<void> {
        await this._db.Execulte<void>(
            `UPDATE notificacao_painel SET lida = true WHERE id = $1 AND codigo_provedor = $2`,
            [id, codigoProvedor]
        );
    }
}
