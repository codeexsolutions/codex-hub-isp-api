import PushSubscription from "../domains/PushSubscription";
import { assinanteNotificacaoModel } from "../models/assinanteNotificacaoModel";

export default interface IPushNotificationRepository{
    Salvar(subscription:PushSubscription):Promise<string>;
    BuscarPorCpf(cpf: string, codigoProvedor:string) : Promise<PushSubscription[]>;
    BuscarTodos(codigoProvedor:string) : Promise<PushSubscription[]>;
    Remover(endpoint: string, codigoProvedor:string): Promise<void>

    // Lista pra tela "Assinantes" do painel — 1 linha por CPF (não por
    // dispositivo/inscrição), com o nome já resolvido via cliente_atividade
    // (a única fonte de nome que o Synk guarda; e-mail/telefone não existem
    // aqui, só no gerenciador do provedor).
    ListarAssinantesComNome(codigoProvedor:string) : Promise<assinanteNotificacaoModel[]>;
    BuscarAssinantePorCpf(cpf:string, codigoProvedor:string) : Promise<assinanteNotificacaoModel|null>;
}