import { multiplos } from "../../infrastructure/apis/receitanet/responseModels/responseMultiContratos";
import { boletos } from "../Dtos/boletosDto";
import { clienteDto } from "../Dtos/clienteDto"
import { chamadoDto } from "../Dtos/chamadoDto";

export default interface IIxcSoftServices {
    ObterToken(codigoProvedor:string) : Promise<string>;
    //ObterDadosCliente(cpf:string, token:string) : Promise<clienteDto>;
    ObterFaturas(cpf:string, codigoProvedor:string) : Promise<boletos>
    ObterContratos(cpf:string, codigoProvedor: string ) : Promise<string | multiplos>
    ObterDadosCliente(cpf:string, codigoProvedor: string, idContrato:number): Promise<clienteDto | multiplos | null>
    // Ordem de serviço (su_oss_chamado / su_oss_chamado_mensagem)
    ObterChamados(cpf:string, codigoProvedor:string) : Promise<chamadoDto[]>
    AbrirNovoChamado(cpf:string, codigoProvedor:string, idAssunto:number, mensagem:string) : Promise<number>
    ObterMensagensChamado(idChamado:number, codigoProvedor:string) : Promise<any[]>
    EnviarMensagemChamado(idChamado:number, codigoProvedor:string, mensagem:string) : Promise<void>
    ObterContratoPdf(idContrato:number, codigoProvedor:string) : Promise<Buffer>
}