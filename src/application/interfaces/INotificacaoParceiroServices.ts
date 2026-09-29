import { pushSubscriptionParceiroDto } from "../Dtos/pushSubscriptionParceiroDto";
import { notificacaoParceiroModel } from "../../core/models/notificacaoParceiroModel";

export default interface INotificacaoParceiroServices {
    Inscrever(data: pushSubscriptionParceiroDto): Promise<string>;
    Desinscrever(endpoint: string, parceiroId: number): Promise<void>;
    Avisar(parceiroId: number, tipo: string, titulo: string, corpo: string): Promise<void>;
    Listar(parceiroId: number): Promise<notificacaoParceiroModel[]>;
    ContarNaoLidas(parceiroId: number): Promise<number>;
    MarcarLida(id: number, parceiroId: number): Promise<void>;
}
