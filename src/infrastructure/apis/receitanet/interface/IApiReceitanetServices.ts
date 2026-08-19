import Chamado from "../../../../core/domains/Chamado";
import { responseChamados } from "../responseModels/responseChamados";
import { responseClienteResumo } from "../responseModels/responseClienteResumo";
import { multiplos } from "../responseModels/responseMultiContratos";
import { responseToken } from "../responseModels/responseToken";

export default interface IApiReceitanetServices {
    ObterToken(codigoProvedor:string, cpf?:string) : Promise<responseToken | multiplos>;
    ObterTokenPorContrato(codigoProvedor:string, cpf:string, idContrato:string): Promise<responseToken>;
    ObterResumoCliente(token: string): Promise<responseClienteResumo>;
    ObterFaturas(token: string) : Promise<any>;
    ObterContrato(token: string) : Promise<any>;
    NotificarPagamento(token: string) : Promise<{ success:boolean; date:string }>;
    ObterChamados(token:string) : Promise<responseChamados>;
    AbrirChamado(token:string, descricao:string) : Promise<boolean>;
    EnviarRespostaChamado(token:string, idChamado:number, mensagem:string) : Promise<any>;
    RespostasDoChamado(token: string, idChamado: number) : Promise<any>;
}