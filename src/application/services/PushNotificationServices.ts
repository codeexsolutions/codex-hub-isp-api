import { inject, injectable } from "tsyringe";
import IPushNotificationServices from "../interfaces/IPushNotificationServices";
import { notificacaoDto, pushSubscriptionDto } from "../Dtos/pushSubscriptionDto";
import IPushNotificationRepository from "../../core/interfaces/IPushNotificationRepository";
import PushSubscription  from "../../core/domains/PushSubscription";
import { WebPushProvider } from "../../infrastructure/notification/provider";
import IProvedorRepository from "../../core/interfaces/IProvedorRepository";
import INotificacaoClienteRepository from "../../core/interfaces/INotificacaoClienteRepository";
import { notificacaoClienteModel } from "../../core/models/notificacaoClienteModel";

@injectable()
export default class PushNotificationServices implements IPushNotificationServices {

    private readonly _pushRepository:IPushNotificationRepository;
    private readonly _provedorRepository:IProvedorRepository;
    private readonly _notificacaoClienteRepository:INotificacaoClienteRepository;
    constructor(
        @inject("IPushNotificationRepository")repository:IPushNotificationRepository,
        @inject("IProvedorRepository")provedorRepository:IProvedorRepository,
        @inject("INotificacaoClienteRepository")notificacaoClienteRepository:INotificacaoClienteRepository
    ){
        this._pushRepository = repository;
        this._provedorRepository = provedorRepository;
        this._notificacaoClienteRepository = notificacaoClienteRepository;
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
        await this.EnviarParaSubscricoes(subscriptions, codigoProvedor, payload);
    }

    async NotificarCliente(cpf:string, codigoProvedor:string, payload:notificacaoDto) : Promise<void> {
        const subscriptions = await this.BuscarPorCpf(cpf, codigoProvedor);
        await this.EnviarParaSubscricoes(subscriptions, codigoProvedor, payload);
    }

    async NotificarClientes(cpfs:string[], codigoProvedor:string, payload:notificacaoDto) : Promise<void> {
        const listas = await Promise.all(cpfs.map((cpf) => this.BuscarPorCpf(cpf, codigoProvedor)));
        const subscriptions = listas.flat();
        await this.EnviarParaSubscricoes(subscriptions, codigoProvedor, payload);
    }

    async ListarNotificacoesCliente(cpf: string, codigoProvedor: string): Promise<notificacaoClienteModel[]> {
        return await this._notificacaoClienteRepository.Listar(cpf, codigoProvedor);
    }

    async ContarNotificacoesNaoLidas(cpf: string, codigoProvedor: string): Promise<number> {
        return await this._notificacaoClienteRepository.ContarNaoLidas(cpf, codigoProvedor);
    }

    async MarcarNotificacaoLida(id: number, cpf: string, codigoProvedor: string): Promise<void> {
        await this._notificacaoClienteRepository.MarcarLida(id, cpf, codigoProvedor);
    }

    async ExcluirNotificacaoCliente(id: number, cpf: string, codigoProvedor: string): Promise<void> {
        await this._notificacaoClienteRepository.Excluir(id, cpf, codigoProvedor);
    }

    private async EnviarParaSubscricoes(subscriptions:pushSubscriptionDto[], codigoProvedor:string, payload:notificacaoDto) : Promise<void> {

        const webPush = new WebPushProvider()

        const result = await this._provedorRepository.ObterTema(codigoProvedor);
        if(result){

            payload.title = payload.title ?? result.nome;
            payload.icon = result.icone512 ?? undefined;
            payload.badge = result.icone192 ?? result.icone512 ?? undefined;
            payload.image = result.icone512 ?? undefined;
            payload.data = result.icone192 ?? undefined;
        }

        const cpfsUnicos = [...new Set(subscriptions.map((sub) => sub.cpf))];
        for (const cpf of cpfsUnicos) {
            try {
                await this._notificacaoClienteRepository.Salvar(cpf, codigoProvedor, payload.title, payload.body);
            } catch (error) {
                console.error("Erro ao salvar notificação do cliente:", error);
            }
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