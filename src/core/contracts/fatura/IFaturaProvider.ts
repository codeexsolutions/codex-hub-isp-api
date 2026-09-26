import { SessaoErp } from "../SessaoErp";

// Contrato único de faturas. O formato de retorno ainda não é normalizado
// entre ERPs (fica "any" de propósito por agora — normalizar o DTO é uma
// mudança maior, separada desta) — o que este contrato já resolve é a
// aplicação nunca mais precisar checar qual gerenciador é.
export default interface IFaturaProvider {
    listar(sessao: SessaoErp): Promise<any>;
}
