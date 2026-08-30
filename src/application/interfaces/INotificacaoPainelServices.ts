import { pushSubscriptionPainelDto } from "../Dtos/pushSubscriptionPainelDto";
import { notificacaoPainelModel } from "../../core/models/notificacaoPainelModel";

export default interface INotificacaoPainelServices {
    ObterChavePublica() : string;
    Inscrever(subscription:pushSubscriptionPainelDto) : Promise<string>;
    Desinscrever(endpoint:string, codigoProvedor:string) : Promise<void>;

    // "Aviso" — persiste e envia push pra todos os dispositivos inscritos do
    // provedor. Primeiro uso: novo chamado aberto por um cliente (ver
    // Chamado.controller.ts — o ReceitaNet não notifica isso sozinho).
    Avisar(codigoProvedor:string, tipo:string, titulo:string, corpo:string) : Promise<void>;

    Listar(codigoProvedor:string) : Promise<notificacaoPainelModel[]>;
    ContarNaoLidas(codigoProvedor:string) : Promise<number>;
    MarcarLida(id:number, codigoProvedor:string) : Promise<void>;
}
