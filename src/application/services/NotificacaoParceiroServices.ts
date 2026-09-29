import { inject, injectable } from "tsyringe";
import INotificacaoParceiroServices from "../interfaces/INotificacaoParceiroServices";
import INotificacaoParceiroRepository from "../../core/interfaces/INotificacaoParceiroRepository";
import PushSubscriptionParceiro from "../../core/domains/PushSubscriptionParceiro";
import { pushSubscriptionParceiroDto } from "../Dtos/pushSubscriptionParceiroDto";
import { notificacaoParceiroModel } from "../../core/models/notificacaoParceiroModel";
import { WebPushProvider } from "../../infrastructure/notification/provider";

@injectable()
export default class NotificacaoParceiroServices implements INotificacaoParceiroServices {

    private readonly _repository:INotificacaoParceiroRepository;

    constructor(@inject("INotificacaoParceiroRepository")repository:INotificacaoParceiroRepository){
        this._repository = repository;
    }

    async Inscrever(subscription: pushSubscriptionParceiroDto): Promise<string> {
        const sub = new PushSubscriptionParceiro();
        sub.ParceiroId = subscription.parceiroId;
        sub.Device = subscription.device;
        sub.Endpoint = subscription.endpoint;
        sub.Auth = subscription.keys.auth;
        sub.P256dh = subscription.keys.p256dh;

        return await this._repository.SalvarSubscricao(sub);
    }

    async Desinscrever(endpoint: string, parceiroId: number): Promise<void> {
        await this._repository.RemoverSubscricao(endpoint, parceiroId);
    }

    async Avisar(parceiroId: number, tipo: string, titulo: string, corpo: string): Promise<void> {

        await this._repository.SalvarNotificacao(parceiroId, tipo, titulo, corpo);

        const subscriptions = await this._repository.BuscarSubscricoes(parceiroId);
        if (subscriptions.length === 0) return;

        const webPush = new WebPushProvider();
        for (const sub of subscriptions) {
            try {
                await webPush.Enviar(
                    { endpoint: sub.Endpoint, keys: { auth: sub.Auth, p256dh: sub.P256dh } },
                    { title: titulo, body: corpo, icon: "" }
                );
            } catch (error: any) {
                if (error.statusCode === 404 || error.statusCode === 410) {
                    await this._repository.RemoverSubscricao(sub.Endpoint, parceiroId);
                }
                console.error(error);
            }
        }
    }

    async Listar(parceiroId: number): Promise<notificacaoParceiroModel[]> {
        return await this._repository.Listar(parceiroId);
    }

    async ContarNaoLidas(parceiroId: number): Promise<number> {
        return await this._repository.ContarNaoLidas(parceiroId);
    }

    async MarcarLida(id: number, parceiroId: number): Promise<void> {
        await this._repository.MarcarLida(id, parceiroId);
    }
}
