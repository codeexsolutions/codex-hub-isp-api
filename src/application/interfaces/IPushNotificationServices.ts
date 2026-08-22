import { notificacaoDto, pushSubscriptionDto } from "../Dtos/pushSubscriptionDto";
import { notificacaoClienteModel } from "../../core/models/notificacaoClienteModel";
import { notificacaoTemplateModel } from "../../core/models/notificacaoTemplateModel";

export default interface IPushNotificationServices {
    Salvar(subscription:pushSubscriptionDto):Promise<string>;
    ObterChavePublica() : string;
    BuscarPorCpf(cpf:string, codigoProvedor:string):Promise<pushSubscriptionDto[]>;
    BuscarTodos(codigoProvedor:string):Promise<pushSubscriptionDto[]>;
    Remover(endpoint: string, codigoProvedor:string): Promise<void>
    Notificar(codigoProvedor:string, payload:notificacaoDto)  : Promise<void> ;
    NotificarCliente(cpf:string, codigoProvedor:string, payload:notificacaoDto) : Promise<void>;
    NotificarClientes(cpfs:string[], codigoProvedor:string, payload:notificacaoDto) : Promise<void>;

    // CENTRAL DE NOTIFICAÇÕES DO CLIENTE (sino do app)
    ListarNotificacoesCliente(cpf:string, codigoProvedor:string) : Promise<notificacaoClienteModel[]>;
    ContarNotificacoesNaoLidas(cpf:string, codigoProvedor:string) : Promise<number>;
    MarcarNotificacaoLida(id:number, cpf:string, codigoProvedor:string) : Promise<void>;
    ExcluirNotificacaoCliente(id:number, cpf:string, codigoProvedor:string) : Promise<void>;

    // MODELOS DE NOTIFICAÇÃO (reutilizáveis pelo provedor)
    ListarTemplatesNotificacao(codigoProvedor:number) : Promise<notificacaoTemplateModel[]>;
    CriarTemplateNotificacao(codigoProvedor:number, nome:string, titulo:string, corpo:string) : Promise<notificacaoTemplateModel>;
    ExcluirTemplateNotificacao(id:number, codigoProvedor:number) : Promise<void>;
}