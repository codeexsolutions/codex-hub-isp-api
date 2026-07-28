import webpush from "./webpush.config";

export class WebPushProvider {

    async Enviar(subscription: webpush.PushSubscription, payload:any) : Promise<void> {

        await webpush.sendNotification(
            subscription,
            JSON.stringify({
                title: payload.titulo,
                body: payload.mensagem
            })
        );

        return;
    }

}