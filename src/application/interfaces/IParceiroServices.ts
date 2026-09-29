import { parceiroModel } from "../../core/models/parceiroModel";
import { compraModel } from "../../core/models/compraModel";
import { beneficioModel } from "../../core/models/beneficioModel";
import { ofertaEditeDto } from "../Dtos/ofertaEditeDto";
import { comissaoFaturaModel } from "../../core/models/comissaoFaturaModel";

export default interface IParceiroServices {
    Login(usuario:string, senha:string) : Promise<string>
    PreCadastrar(parceiro:parceiroModel) : Promise<parceiroModel>
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

    // PERFIL
    ObterMeuPerfil(parceiroId:number) : Promise<parceiroModel>
    AtualizarMeuPerfil(parceiroId:number, dados:{ nome?:string; cidade?:string|null; uf?:string|null; endereco?:string|null; contato?:string|null; pix_chave?:string|null }) : Promise<parceiroModel>
    AlterarSenha(parceiroId:number, senhaAtual:string, senhaNova:string) : Promise<void>

    // OFERTAS
    CriarOferta(oferta:beneficioModel) : Promise<beneficioModel>
    ObterMinhasOfertas(parceiroId:number) : Promise<beneficioModel[]>
    EditarOferta(id:number, oferta:ofertaEditeDto) : Promise<beneficioModel>
    ExcluirOferta(id:string, parceiroId:number) : Promise<{ removido:boolean }>
}
