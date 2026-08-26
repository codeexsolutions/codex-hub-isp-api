import { parceiroModel } from "../models/parceiroModel";
import { compraModel } from "../models/compraModel";
import { configPontosModel } from "../models/configPontosModel";
import { beneficioModel } from "../models/beneficioModel";

export default interface IParceiroRepository {
    ObterPorUsuarioSenha(usuario:string, senha:string) : Promise<parceiroModel|null>
    PreCadastrar(parceiro:parceiroModel) : Promise<parceiroModel>
    ObterResumoFinanceiro(parceiroId:number) : Promise<{ status:string; qtd:number; total:number; synk:number; provedor:number }[]>
    ObterComprasParceiro(parceiroId:number) : Promise<compraModel[]>
    ObterCompraPorCupom(cupom:string, parceiroId:number) : Promise<compraModel|null>
    ValidarCupom(cupom:string) : Promise<compraModel>
    CancelarCupom(cupom:string) : Promise<compraModel>
    ObterConfigPontos() : Promise<configPontosModel>
    RegistrarPontosGanhos(codigoProvedor:number, cpfCnpj:string, nome:string, pontos:number, idCompra:number) : Promise<void>

    // OFERTAS (o parceiro cria/gerencia as próprias ofertas)
    CriarOferta(oferta:beneficioModel) : Promise<beneficioModel>
    ObterMinhasOfertas(parceiroId:number) : Promise<beneficioModel[]>
    ObterOfertaPorId(id:number, parceiroId:number) : Promise<beneficioModel>
    EditarOferta(oferta:beneficioModel) : Promise<beneficioModel>
    ExcluirOferta(id:string, parceiroId:number) : Promise<{ removido:boolean }>
}
