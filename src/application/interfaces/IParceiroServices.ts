import { parceiroModel } from "../../core/models/parceiroModel";
import { compraModel } from "../../core/models/compraModel";

export default interface IParceiroServices {
    Login(usuario:string, senha:string) : Promise<string>
    ObterFinanceiro(parceiroId:number) : Promise<{
        resumo: Record<string, { qtd:number; total:number; synk:number; provedor:number }>;
        compras: compraModel[];
    }>
    ObterCupom(cupom:string, parceiroId:number) : Promise<compraModel>
    ValidarCupom(cupom:string, parceiroId:number) : Promise<compraModel>
    CancelarCupom(cupom:string, parceiroId:number) : Promise<compraModel>
}
