import { loginPainel } from "../../application/Dtos/tokenDto";
import Provedor from "../domains/Provedor";
import { avaliacaoModel } from "../models/avaliacaoModel";
import { cadastroProvedorModel } from "../models/cadastroProvevedorModel";
import { indicacaoModel } from "../models/indicacaoModel";
import { themeModel } from "../models/themeModel";

export default interface IProvedorRepository{
    ObterProvedor(codigoProvedor:string): Promise<Provedor>
    ObterProvedorPorId(id: string): Promise<Provedor> 
    ObterTema(codigo:string) : Promise<any>;
    ObterBanners(codigo:string) : Promise<any>;
    ObterAnuncios(codigo:string) : Promise<any>;
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