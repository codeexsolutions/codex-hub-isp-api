import { parceiroModel } from "../models/parceiroModel";
import { compraModel } from "../models/compraModel";
import { configPontosModel } from "../models/configPontosModel";

export default interface IParceiroRepository {
    ObterPorUsuarioSenha(usuario:string, senha:string) : Promise<parceiroModel|null>
    ObterResumoFinanceiro(parceiroId:number) : Promise<{ status:string; qtd:number; total:number; synk:number; provedor:number }[]>
    ObterComprasParceiro(parceiroId:number) : Promise<compraModel[]>
    ObterCompraPorCupom(cupom:string, parceiroId:number) : Promise<compraModel|null>
    ValidarCupom(cupom:string) : Promise<compraModel>
    CancelarCupom(cupom:string) : Promise<compraModel>
    ObterConfigPontos() : Promise<configPontosModel>
    RegistrarPontosGanhos(codigoProvedor:number, cpfCnpj:string, nome:string, pontos:number, idCompra:number) : Promise<void>
}
