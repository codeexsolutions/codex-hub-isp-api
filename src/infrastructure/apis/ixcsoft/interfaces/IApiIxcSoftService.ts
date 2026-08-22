import Provedor from "../../../../core/domains/Provedor";

export default interface IApiIxcSoftService {
    Token(provedor:Provedor): string;
    ObterClientePorCpfCnpj(cpfcnpj:string, codigoProvedor:string):Promise<any>
    ObterCidade(id:number,codigoProvedor:string):Promise<any>
    ObterUf(id:number,codigoProvedor:string):Promise<any>
    ObterContratoPorIdCliente(id:number, codigoProvedor:string) : Promise<any>
    ObterContratoPorId(id: number, codigoProvedor:string): Promise<any>
    ObterProdutoContrato(id:number, codigoProvedor:string) : Promise<any>
    ObterFaturas(idContrato:number, codigoProvedor:string) : Promise<any>
    ObterPix(idAreceber:number, codigoProvedor:string) : Promise<any>
    ObterConsumo(idUsuario:number, codigoProvedor:string) : Promise<any> 
    ObterLogin(codigoProvedor:string, contrato:string) : Promise<any>
    ObterOS(idCliente:number, codigoProvedor:string) : Promise<any>
    CriarOS(dados:{ idCliente:number; idAssunto:number; idFilial:number; setor:number; mensagem:string }, codigoProvedor:string) : Promise<any>
    ObterMensagensOS(idChamado:number, codigoProvedor:string) : Promise<any>
    CriarMensagemOS(dados:{ idChamado:number; idEvento:number; mensagem:string }, codigoProvedor:string) : Promise<any>
    ImprimirContrato(idContrato:number, resource:string, codigoProvedor:string) : Promise<string>
}