import { notificacaoDto } from "../../application/Dtos/pushSubscriptionDto";
import webpush from "./webpush.config";

export class WebPushProvider {

    async Enviar(subscription: webpush.PushSubscription, payload:notificacaoDto) : Promise<webpush.SendResult> {

        const response = await webpush.sendNotification(
            subscription,
            JSON.stringify(payload)
        );

        return response;
    }

}