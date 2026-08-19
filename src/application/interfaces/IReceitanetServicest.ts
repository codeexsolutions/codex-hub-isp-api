import { chamadoDto } from "../Dtos/chamadoDto";
import { clienteDto } from "../Dtos/clienteDto";

export default interface IReceitanetServices {
    
    ObterDadosCliente(token:string): Promise<clienteDto>
    ObterFaturas(token: string) : Promise<any>;
    ObterContrato(token: string) : Promise<{ link?:string; buffer?:Buffer; contentType?:string }>;
    NotificarPagamento(token: string) : Promise<{ success:boolean; date:string }>;
    ObterChamados(token:string) : Promise<chamadoDto[]>;
    AbrirNovoChamado(token:string, payload:object) : Promise<number>;
    EnviarRespostaChamado(token:string, idChamado:number, mensagem:string) : Promise<any>
    RespostasDoChamado(token: string, idChamado: number) : Promise<any>
}