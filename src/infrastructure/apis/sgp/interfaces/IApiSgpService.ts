import Provedor from "../../../../core/domains/Provedor";

// Contrato da API do SGP (TSMX) — espelha IApiMkAuthService/IApiIxcSoftService,
// mas ainda SEM implementação real (ver ApiSgpService.ts). O SGP tem API
// documentada publicamente via Postman (sgp.net.br redireciona pra
// https://documenter.getpostman.com/view/6682240/2sB34hHg2V), mas a doc é
// renderizada via JS e ainda não foi extraída/confirmada — os métodos abaixo
// só podem ser implementados de verdade depois de ter em mãos a collection
// real (auth, nomes de endpoint, formato de resposta).
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
