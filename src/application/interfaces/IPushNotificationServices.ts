import { notificacaoDto, pushSubscriptionDto } from "../Dtos/pushSubscriptionDto";

export default interface IPushNotificationServices {
    Salvar(subscription:pushSubscriptionDto):Promise<string>;    
    ObterChavePublica() : string;
    BuscarPorCpf(cpf:string, codigoProvedor:string):Promise<pushSubscriptionDto[]>;
    BuscarTodos(codigoProvedor:string):Promise<pushSubscriptionDto[]>;
    Remover(endpoint: string, codigoProvedor:string): Promise<void> 
    Notificar(subscription: pushSubscriptionDto, payload:notificacaoDto) : Promise<void> ;
}