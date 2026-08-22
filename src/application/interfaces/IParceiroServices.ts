import { parceiroModel } from "../../core/models/parceiroModel";
import { compraModel } from "../../core/models/compraModel";
import { beneficioModel } from "../../core/models/beneficioModel";
import { ofertaEditeDto } from "../Dtos/ofertaEditeDto";
import { comissaoFaturaModel } from "../../core/models/comissaoFaturaModel";

export default interface IParceiroServices {
    Login(usuario:string, senha:string) : Promise<string>
    ObterFinanceiro(parceiroId:number) : Promise<{
        resumo: Record<string, { qtd:number; total:number; synk:number; provedor:number }>;
        compras: compraModel[];
    }>
    ObterFaturamentoComissao(parceiroId:number) : Promise<{
        faturas: comissaoFaturaModel[];
        pixCopiaCola: string|null;
        pixQrCode: string|null;
    }>
    ObterCupom(cupom:string, parceiroId:number) : Promise<compraModel>
    ValidarCupom(cupom:string, parceiroId:number) : Promise<compraModel>
    CancelarCupom(cupom:string, parceiroId:number) : Promise<compraModel>

    // OFERTAS
    CriarOferta(oferta:beneficioModel) : Promise<beneficioModel>
    ObterMinhasOfertas(parceiroId:number) : Promise<beneficioModel[]>
    EditarOferta(id:number, oferta:ofertaEditeDto) : Promise<beneficioModel>
    ExcluirOferta(id:string, parceiroId:number) : Promise<{ removido:boolean }>
}
