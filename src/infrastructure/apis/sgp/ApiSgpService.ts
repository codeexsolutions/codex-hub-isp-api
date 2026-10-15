import { injectable } from "tsyringe";
import IApiSgpService from "./interfaces/IApiSgpService";
import Provedor from "../../../core/domains/Provedor";

// STUB — aguardando o contrato real da API do SGP. Confirmamos que o SGP
// (TSMX) tem API pública documentada via Postman (sgp.net.br redireciona pra
// https://documenter.getpostman.com/view/6682240/2sB34hHg2V), mas essa página
// é renderizada via JS e não foi possível extrair auth/endpoints automaticamente.
// Todo método aqui lança erro claro até alguém exportar a collection real
// (abrir o link no navegador, Postman > Export, ou copiar as rotas que
// importam: cliente, fatura, chamado) — mesmo processo que já funcionou pro
// IXC e pro MK-Auth neste projeto.
const ERRO_SEM_CONTRATO = "Integração com o SGP ainda não está implementada — falta o contrato real da API (ver IApiSgpService.ts).";

@injectable()
export default class ApiSgpService implements IApiSgpService {

    async Token(provedor: Provedor, cpf?: string): Promise<any> {
        throw new Error(ERRO_SEM_CONTRATO);
    }

    async TokenPorContrato(provedor: Provedor, cpf: string, idContrato: string): Promise<any> {
        throw new Error(ERRO_SEM_CONTRATO);
    }

    async ObterDadosCliente(codigoProvedor: string, cpfCnpj: string, contratoId?: number): Promise<any> {
        throw new Error(ERRO_SEM_CONTRATO);
    }

    async ObterFaturas(codigoProvedor: string, identificador: string): Promise<any> {
        throw new Error(ERRO_SEM_CONTRATO);
    }

    async ObterContrato(codigoProvedor: string, identificador: string): Promise<any> {
        throw new Error(ERRO_SEM_CONTRATO);
    }

    async ObterChamados(codigoProvedor: string, identificador: string): Promise<any> {
        throw new Error(ERRO_SEM_CONTRATO);
    }

    async AbrirChamado(codigoProvedor: string, identificador: string, dados: { assunto: string; descricao: string; categoria?: string }): Promise<number> {
        throw new Error(ERRO_SEM_CONTRATO);
    }

    async EnviarRespostaChamado(codigoProvedor: string, idChamado: number, mensagem: string): Promise<any> {
        throw new Error(ERRO_SEM_CONTRATO);
    }

    async RespostasDoChamado(codigoProvedor: string, idChamado: number): Promise<any> {
        throw new Error(ERRO_SEM_CONTRATO);
    }
}
