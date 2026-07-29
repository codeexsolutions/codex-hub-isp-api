import { inject, injectable } from "tsyringe";
import IPushNotificationServices from "../interfaces/IPushNotificationServices";
import { notificacaoDto, pushSubscriptionDto } from "../Dtos/pushSubscriptionDto";
import IPushNotificationRepository from "../../core/interfaces/IPushNotificationRepository";
import PushSubscription  from "../../core/domains/PushSubscription";
import { WebPushProvider } from "../../infrastructure/notification/provider";

@injectable()
export default class PushNotificationServices implements IPushNotificationServices {

    private readonly _pushRepository:IPushNotificationRepository;
    constructor(@inject("IPushNotificationRepository")repository:IPushNotificationRepository){
        this._pushRepository = repository;
    }

    async Salvar(subscription: pushSubscriptionDto): Promise<string> {
        const sub = new PushSubscription();
        sub.Cpf = subscription.cpf;
        sub.CodigoProvedor = subscription.codigoProvedor;
        sub.Device = subscription.device;
        sub.Endpoint = subscription.endpoint;
        sub.Auth = subscription.keys.auth;
        sub.P256dh = subscription.keys.p256dh;

        return await this._pushRepository.Salvar(sub);
    }

    ObterChavePublica() : string {
        return String(process.env.VAPID_PUBLIC_KEY)
    }

    async BuscarPorCpf(cpf:string, codigoProvedor:string):Promise<pushSubscriptionDto[]> {
        
        const result = await this._pushRepository.BuscarPorCpf(cpf, codigoProvedor)

        return result.map((sub:PushSubscription) => {
            return {
                 cpf: sub.Cpf,
                 codigoProvedor: sub.CodigoProvedor,
                 device: sub.Device,
                 endpoint: sub.Endpoint,
                 expirationTime: null,
                 keys: {
                    auth: sub.Auth,
                    p256dh: sub.P256dh
                 }
            }
        })
    }

    async BuscarTodos(codigoProvedor: string): Promise<pushSubscriptionDto[]> {
         const result = await this._pushRepository.BuscarTodos(codigoProvedor)

        return result.map((sub:PushSubscription) => {
            return {
                 cpf: sub.Cpf,
                 codigoProvedor: sub.CodigoProvedor,
                 device: sub.Device,
                 endpoint: sub.Endpoint,
                 expirationTime: null,
                 keys: {
                    auth: sub.Auth,
                    p256dh: sub.P256dh
                 }
            }
        })
    }
    async Remover(endpoint: string, codigoProvedor:string): Promise<void> {
        await this._pushRepository.Remover(endpoint, codigoProvedor)
    }

    async Notificar(subscription: pushSubscriptionDto, payload:notificacaoDto) : Promise<void> {
        try{
            const push = await new WebPushProvider().Enviar({
                endpoint: subscription.endpoint,
                keys: {
                    auth: subscription.keys.auth,
                    p256dh: subscription.keys.p256dh
                },
            }, payload);

             console.log("Enviado com sucesso", push);

        }catch(error:any){
            if (error.statusCode === 404 || error.statusCode === 410) {

            await this.Remover(subscription.endpoint, subscription.codigoProvedor);
        }

        }


    }
    
}