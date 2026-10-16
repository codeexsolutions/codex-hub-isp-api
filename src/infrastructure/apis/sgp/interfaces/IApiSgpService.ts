import Provedor from "../../../../core/domains/Provedor";

// Contrato da API do SGP — espelha IApiMkAuthService/IApiIxcSoftService.
// Implementação real em ApiSgpService.ts, baseada na collection oficial do
// Postman do SGP (auth via App+Token, endpoints /api/ura/*, /api/central/*).
export default interface IApiSgpService {
    Token(provedor: Provedor, cpf?: string): Promise<any>;
    TokenPorContrato(provedor: Provedor, cpf: string, idContrato: string): Promise<any>;

    ObterDadosCliente(codigoProvedor: string, cpfCnpj: string, contratoId?: number): Promise<any>;
    ObterFaturas(codigoProvedor: string, identificador: string): Promise<any>;
    ObterContrato(codigoProvedor: string, identificador: string): Promise<any>;
    ObterChamados(codigoProvedor: string, identificador: string): Promise<any>;
    AbrirChamado(codigoProvedor: string, identificador: string, dados: { assunto: string; descricao: string; categoria?: string }): Promise<number>;
    EnviarRespostaChamado(codigoProvedor: string, idChamado: number, mensagem: string): Promise<any>;
    RespostasDoChamado(codigoProvedor: string, idChamado: number): Promise<any>;
}
