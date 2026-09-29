import { inject, injectable } from "tsyringe";
import INotificacaoParceiroRepository from "../../core/interfaces/INotificacaoParceiroRepository";
import IDBContext from "../interfaces/IDbContext";
import PushSubscriptionParceiro from "../../core/domains/PushSubscriptionParceiro";
import { notificacaoParceiroModel } from "../../core/models/notificacaoParceiroModel";

@injectable()
export default class NotificacaoParceiroRepository implements INotificacaoParceiroRepository {

    private _db:IDBContext;

    constructor(@inject("IDBContext") db:IDBContext){
        this._db = db;
    }

    async SalvarSubscricao(subscription: PushSubscriptionParceiro): Promise<string> {

        const result = await this._db.Execulte<any>(
            `INSERT INTO push_subscription_parceiro (parceiro_id, endpoint, auth, p256dh, device_name)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (parceiro_id, endpoint) DO UPDATE SET auth = EXCLUDED.auth, p256dh = EXCLUDED.p256dh, ativo = true
             RETURNING id`,
            [subscription.ParceiroId, subscription.Endpoint, subscription.Auth, subscription.P256dh, subscription.Device]
        );

        return result[0]?.id ?? "";
    }

    async BuscarSubscricoes(parceiroId: number): Promise<PushSubscriptionParceiro[]> {

        const result = await this._db.Execulte<any>(
            `SELECT * FROM push_subscription_parceiro WHERE parceiro_id = $1 AND ativo = true`,
            [parceiroId]
        );

        return result.map((sub: any) : PushSubscriptionParceiro => {
            const subscription = new PushSubscriptionParceiro();
            subscription.ParceiroId = sub.parceiro_id;
            subscription.Device = sub.device_name;
            subscription.Endpoint = sub.endpoint;
            subscription.Auth = sub.auth;
            subscription.P256dh = sub.p256dh;
            return subscription;
        });
    }

    async RemoverSubscricao(endpoint: string, parceiroId: number): Promise<void> {
        await this._db.Execulte<void>(
            `DELETE FROM push_subscription_parceiro WHERE endpoint = $1 AND parceiro_id = $2`,
            [endpoint, parceiroId]
        );
    }

    async SalvarNotificacao(parceiroId: number, tipo: string, titulo: string, corpo: string): Promise<void> {
        await this._db.Execulte<void>(
            `INSERT INTO notificacao_parceiro (parceiro_id, tipo, titulo, corpo) VALUES ($1,$2,$3,$4)`,
            [parceiroId, tipo, titulo, corpo]
        );
    }

    async Listar(parceiroId: number): Promise<notificacaoParceiroModel[]> {

        const result = await this._db.Execulte<any>(
            `SELECT id, tipo, titulo, corpo, lida, criado_em FROM notificacao_parceiro
             WHERE parceiro_id = $1 ORDER BY criado_em DESC LIMIT 50`,
            [parceiroId]
        );

        return result.map((r:any) : notificacaoParceiroModel => ({
            id: r.id,
            tipo: r.tipo,
            titulo: r.titulo,
            corpo: r.corpo,
            lida: r.lida,
            criadoEm: r.criado_em
        }));
    }

    async ContarNaoLidas(parceiroId: number): Promise<number> {

        const result = await this._db.Execulte<any>(
            `SELECT COUNT(*)::int AS total FROM notificacao_parceiro WHERE parceiro_id = $1 AND lida = false`,
            [parceiroId]
        );

        return result[0]?.total ?? 0;
    }

    async MarcarLida(id: number, parceiroId: number): Promise<void> {
        await this._db.Execulte<void>(
            `UPDATE notificacao_parceiro SET lida = true WHERE id = $1 AND parceiro_id = $2`,
            [id, parceiroId]
        );
    }
}
