import PushSubscriptionPainel from "../domains/PushSubscriptionPainel";
import { notificacaoPainelModel } from "../models/notificacaoPainelModel";

export default interface INotificacaoPainelRepository {
    SalvarSubscricao(subscription:PushSubscriptionPainel):Promise<string>;
    BuscarSubscricoes(codigoProvedor:string) : Promise<PushSubscriptionPainel[]>;
    RemoverSubscricao(endpoint:string, codigoProvedor:string): Promise<void>;

    SalvarNotificacao(codigoProvedor:string, tipo:string, titulo:string, corpo:string) : Promise<void>;
    Listar(codigoProvedor:string) : Promise<notificacaoPainelModel[]>;
    ContarNaoLidas(codigoProvedor:string) : Promise<number>;
    MarcarLida(id:number, codigoProvedor:string) : Promise<void>;
}
