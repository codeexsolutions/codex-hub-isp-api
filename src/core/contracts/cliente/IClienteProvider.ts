import { SessaoErp } from "../SessaoErp";

// Igual IFaturaProvider: retorno ainda não normalizado entre ERPs (fica
// "any"/null de propósito) — o que este contrato resolve é a aplicação
// nunca mais precisar checar qual gerenciador é pra buscar os dados do
// cliente logado.
export default interface IClienteProvider {
    obterDados(sessao: SessaoErp): Promise<any | null>;
}
