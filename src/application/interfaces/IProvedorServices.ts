import { avaliacaoModel } from "../../core/models/avaliacaoModel";
import { cadastroProvedorModel } from "../../core/models/cadastroProvevedorModel";
import { indicacaoModel } from "../../core/models/indicacaoModel";
import { themeModel } from "../../core/models/themeModel";
import { cadastroProvedorDto } from "../Dtos/cadastroProvedorDto";
import { provedorDto, provedorPainelDto, temaDto } from "../Dtos/provedorDto";
import { ThemeFiles } from "../Dtos/temaFiles.dto";

export default interface IProvedorServices {
    Cadastrar(cadastro:cadastroProvedorDto): Promise<provedorPainelDto>
    Atualizar(update:cadastroProvedorModel) : Promise<provedorPainelDto>
    ObterProvedor(codigoProvedor:string) : Promise<provedorDto>;
    ObterTema(codigo:string) : Promise<temaDto>;
    ObterBanners(codigo:string) : Promise<any> ;
    ObterAnuncios(codigo:string) : Promise<any> ;
    SalvarIndicacao(indicao:indicacaoModel) : Promise<number>
    ObterIndicacoes(codigoProvedor:string) : Promise<any>
    AtualizarTema(tema:themeModel, files: ThemeFiles) : Promise<any> 
    AvaliarServico(avaliacao:avaliacaoModel) : Promise<any> 
    ObterAvaliacoesServico(codigoProvedor:string) : Promise<any>
    AvaliarApp(avaliacao:avaliacaoModel) : Promise<any> 
    ObterAvaliacoesApp(codigoProvedor:string) : Promise<any>
    ObterManifest(codigo:string) : Promise<any>
}