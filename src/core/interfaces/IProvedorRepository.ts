import { loginPainel } from "../../application/Dtos/tokenDto";
import Provedor from "../domains/Provedor";
import { avaliacaoModel } from "../models/avaliacaoModel";
import { cadastroProvedorModel } from "../models/cadastroProvevedorModel";
import { indicacaoModel } from "../models/indicacaoModel";
import { themeModel } from "../models/themeModel";
import { compraModel } from "../models/compraModel";
import { configComissaoModel } from "../models/configComissaoModel";
import { beneficioModel } from "../models/beneficioModel";
import { recompensaModel } from "../models/recompensaModel";
import { extratoPontosModel } from "../models/extratoPontosModel";
import { parceiroModel } from "../models/parceiroModel";
import { homeConfigModel } from "../models/homeConfigModel";
import { ixcAssuntoModel } from "../models/ixcAssuntoModel";
import { atendimentoModel } from "../models/atendimentoModel";
import { clubeBeneficiosModel } from "../models/clubeBeneficiosModel";

export default interface IProvedorRepository{
    ObterProvedor(codigoProvedor:string): Promise<Provedor>
    ObterProvedorPorId(id: string): Promise<Provedor> 
    ObterTema(codigo:string) : Promise<any>;
    ObterBanners(codigo:string) : Promise<any>;
    ObterAnuncios(codigo:string) : Promise<any>;
    ObterBeneficios(codigo:string) : Promise<any>;
    ObterModulosAtivos(codigo:string) : Promise<string[]>;
    ObterHomeConfig(codigo:string) : Promise<homeConfigModel>;
    ObterAtendimento(codigo:string) : Promise<atendimentoModel>;
    ObterClubeBeneficios(codigo:string) : Promise<clubeBeneficiosModel>;
    ObterIxcAssuntos(codigo:string) : Promise<ixcAssuntoModel[]>;
    RegistrarCliqueBeneficio(idBeneficio:number, codigoProvedor:number) : Promise<void>;
    ObterBeneficioPorId(idBeneficio:number, codigoProvedor:number) : Promise<beneficioModel>;
    ObterConfigComissao() : Promise<configComissaoModel>;
    RegistrarCompra(compra:compraModel) : Promise<compraModel>;
    ObterComprasCliente(codigoProvedor:string, cpfCnpj:string) : Promise<compraModel[]>;
    RegistrarLoginCliente(codigoProvedor:string, cpfCnpj:string, nome:string) : Promise<void>;
    ObterSaldoPontos(codigoProvedor:string, cpfCnpj:string) : Promise<number>;
    ObterExtratoPontos(codigoProvedor:string, cpfCnpj:string) : Promise<extratoPontosModel[]>;
    ObterRecompensasAtivas(codigoProvedor:string) : Promise<recompensaModel[]>;
    ObterRecompensaPorIdPublico(idRecompensa:number, codigoProvedor:number) : Promise<recompensaModel>;
    RegistrarResgate(codigoProvedor:number, cpfCnpj:string, nome:string, recompensa:recompensaModel, cupom:string) : Promise<extratoPontosModel>;
    ListarParceirosAtivos(codigoProvedor:string) : Promise<parceiroModel[]>;
    Cadastrar(cadastro:cadastroProvedorModel) : Promise<Provedor>
    Atualizar(cadastro: cadastroProvedorModel) : Promise<Provedor>
    AvaliarServico(avaliacao:avaliacaoModel) : Promise<any> 
    ObterAvaliacoesServico(codigoProvedor:string) : Promise<any>
    AvaliarApp(avaliacao:avaliacaoModel) : Promise<any> 
    ObterAvaliacoesApp(codigoProvedor:string) : Promise<any>
    //PAINEL
    Login(loginPainel:loginPainel) : Promise<any>
    AlterarTema(themeModel:themeModel) : Promise<any> 
    SalvarIndicacao(indicacao:indicacaoModel) : Promise<any>
    ObterIndicacoes(codigoProvedor:string) : Promise<any>;
    ObterProvedorPorCpfCnpj(cnpj: string): Promise<Provedor | null>
    ObterManifest(codigo:string) : Promise<any>
}