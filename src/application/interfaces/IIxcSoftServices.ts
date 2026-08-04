import { multiplos } from "../../infrastructure/apis/receitanet/responseModels/responseMultiContratos";
import { boletos } from "../Dtos/boletosDto";
import { clienteDto } from "../Dtos/clienteDto"

export default interface IIxcSoftServices {
    ObterToken(codigoProvedor:string) : Promise<string>;
    //ObterDadosCliente(cpf:string, token:string) : Promise<clienteDto>;    
    ObterFaturas(cpf:string, codigoProvedor:string) : Promise<boletos>
    ObterContratos(cpf:string, codigoProvedor: string ) : Promise<string | multiplos>
    ObterDadosCliente(cpf:string, codigoProvedor: string, idContrato:number): Promise<clienteDto | multiplos> 
}