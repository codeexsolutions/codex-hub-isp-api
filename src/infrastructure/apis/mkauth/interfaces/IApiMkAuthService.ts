import Provedor from "../../../../core/domains/Provedor";

// Contrato da API do MK-Auth — espelha IApiIxcSoftService/IApiReceitanetServices,
// mas ainda sem implementação real (ver ApiMkAuthService.ts). MK-Auth não tem uma
// API HTTP padronizada entre instalações (varia por versão/plugin habilitado no
// painel do provedor), então os métodos abaixo só podem ser implementados de
// verdade depois de confirmar com o cliente: URL do painel MK-Auth dele, se o
// módulo de API está habilitado, e a forma de autenticação usada.
export default interface IApiMkAuthService {
    // Domínio Token: já recebe o Provedor completo (TokenService busca no
    // repositório antes de chegar aqui, igual acontece hoje pro IXC).
    Token(provedor: Provedor, cpf?: string): Promise<any>;
    TokenPorContrato(provedor: Provedor, cpf: string, idContrato: string): Promise<any>;

    // Demais domínios (Cliente/Fatura/Chamado): só têm codigoProvedor +
    // identificadores da sessão (SessaoErp), igual IApiIxcSoftService — cada
    // implementação resolve o Provedor internamente se precisar.
    ObterDadosCliente(codigoProvedor: string, cpfCnpj: string, contratoId?: number): Promise<any>;
    ObterFaturas(codigoProvedor: string, identificador: string): Promise<any>;
    ObterContrato(codigoProvedor: string, identificador: string): Promise<any>;
    ObterChamados(codigoProvedor: string, identificador: string): Promise<any>;
    AbrirChamado(codigoProvedor: string, identificador: string, dados: { assunto: string; descricao: string; categoria?: string }): Promise<number>;
    EnviarRespostaChamado(codigoProvedor: string, idChamado: number, mensagem: string): Promise<any>;
    RespostasDoChamado(codigoProvedor: string, idChamado: number): Promise<any>;
}
