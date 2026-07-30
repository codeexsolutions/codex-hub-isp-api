import { inject, injectable } from "tsyringe";
import IPushNotificationServices from "../interfaces/IPushNotificationServices";
import { notificacaoDto, pushSubscriptionDto } from "../Dtos/pushSubscriptionDto";
import IPushNotificationRepository from "../../core/interfaces/IPushNotificationRepository";
import PushSubscription  from "../../core/domains/PushSubscription";
import { WebPushProvider } from "../../infrastructure/notification/provider";
import IProvedorRepository from "../../core/interfaces/IProvedorRepository";

@injectable()
export default class PushNotificationServices implements IPushNotificationServices {

    private readonly _pushRepository:IPushNotificationRepository;
    private readonly _provedorRepository:IProvedorRepository;
    constructor(@inject("IPushNotificationRepository")repository:IPushNotificationRepository, @inject("IProvedorRepository")provedorRepository:IProvedorRepository){
        this._pushRepository = repository;
        this._provedorRepository = provedorRepository;
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

    async Notificar(codigoProvedor:string, payload:notificacaoDto) : Promise<void> {
        
        
        const subscriptions = await this.BuscarTodos(codigoProvedor);
        const webPush = new WebPushProvider()        
            
        const result = await this._provedorRepository.ObterTema(codigoProvedor);
        if(result){
            
            payload.title = result.nome ?? "Hub ISP";
            payload.icon = result.icone512 ?? "";
            payload.badge = result.icone192 ?? result.icone512 ?? "";
            payload.image = result.banner ?? undefined;
        }            

        for (const sub of subscriptions) {
            try {
                await webPush.Enviar({
                    endpoint: sub.endpoint,
                    keys: {
                        auth: sub.keys.auth,
                        p256dh: sub.keys.p256dh
                    }
                }, payload);

            } catch (error: any) {

                if (error.statusCode === 404 || error.statusCode === 410) {
                    await this.Remover(sub.endpoint, codigoProvedor);
                }

                console.error(error);
            }
        }

    }
    
}