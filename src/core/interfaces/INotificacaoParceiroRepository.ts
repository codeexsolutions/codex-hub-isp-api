import PushSubscriptionParceiro from "../domains/PushSubscriptionParceiro";
import { notificacaoParceiroModel } from "../models/notificacaoParceiroModel";

export default interface INotificacaoParceiroRepository {
    SalvarSubscricao(subscription:PushSubscriptionParceiro):Promise<string>;
    BuscarSubscricoes(parceiroId:number) : Promise<PushSubscriptionParceiro[]>;
    RemoverSubscricao(endpoint:string, parceiroId:number): Promise<void>;

    SalvarNotificacao(parceiroId:number, tipo:string, titulo:string, corpo:string) : Promise<void>;
    Listar(parceiroId:number) : Promise<notificacaoParceiroModel[]>;
    ContarNaoLidas(parceiroId:number) : Promise<number>;
    MarcarLida(id:number, parceiroId:number) : Promise<void>;
}
