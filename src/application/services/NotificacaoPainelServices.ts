import { inject, injectable } from "tsyringe";
import INotificacaoPainelServices from "../interfaces/INotificacaoPainelServices";
import INotificacaoPainelRepository from "../../core/interfaces/INotificacaoPainelRepository";
import PushSubscriptionPainel from "../../core/domains/PushSubscriptionPainel";
import { pushSubscriptionPainelDto } from "../Dtos/pushSubscriptionPainelDto";
import { notificacaoPainelModel } from "../../core/models/notificacaoPainelModel";
import { WebPushProvider } from "../../infrastructure/notification/provider";

@injectable()
export default class NotificacaoPainelServices implements INotificacaoPainelServices {

    private readonly _repository:INotificacaoPainelRepository;

    constructor(@inject("INotificacaoPainelRepository")repository:INotificacaoPainelRepository){
        this._repository = repository;
    }

    ObterChavePublica(): string {
        return String(process.env.VAPID_PUBLIC_KEY);
    }

    async Inscrever(subscription: pushSubscriptionPainelDto): Promise<string> {
        const sub = new PushSubscriptionPainel();
        sub.CodigoProvedor = subscription.codigoProvedor;
        sub.Device = subscription.device;
        sub.Endpoint = subscription.endpoint;
        sub.Auth = subscription.keys.auth;
        sub.P256dh = subscription.keys.p256dh;

        return await this._repository.SalvarSubscricao(sub);
    }

    async Desinscrever(endpoint: string, codigoProvedor: string): Promise<void> {
        await this._repository.RemoverSubscricao(endpoint, codigoProvedor);
    }

    async Avisar(codigoProvedor: string, tipo: string, titulo: string, corpo: string): Promise<void> {

        await this._repository.SalvarNotificacao(codigoProvedor, tipo, titulo, corpo);

        const subscriptions = await this._repository.BuscarSubscricoes(codigoProvedor);
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
                    await this._repository.RemoverSubscricao(sub.Endpoint, codigoProvedor);
                }
                console.error(error);
            }
        }
    }

    async Listar(codigoProvedor: string): Promise<notificacaoPainelModel[]> {
        return await this._repository.Listar(codigoProvedor);
    }

    async ContarNaoLidas(codigoProvedor: string): Promise<number> {
        return await this._repository.ContarNaoLidas(codigoProvedor);
    }

    async MarcarLida(id: number, codigoProvedor: string): Promise<void> {
        await this._repository.MarcarLida(id, codigoProvedor);
    }
}
