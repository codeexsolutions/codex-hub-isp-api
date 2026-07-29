import PushSubscription from "../domains/PushSubscription";

export default interface IPushNotificationRepository{
    Salvar(subscription:PushSubscription):Promise<string>;
    BuscarPorCpf(cpf: string, codigoProvedor:string) : Promise<PushSubscription[]>;
    BuscarTodos(codigoProvedor:string) : Promise<PushSubscription[]>;
    Remover(endpoint: string, codigoProvedor:string): Promise<void>

}