import { avaliacaoModel } from "../../core/models/avaliacaoModel";
import { cadastroProvedorModel } from "../../core/models/cadastroProvevedorModel";
import { indicacaoModel } from "../../core/models/indicacaoModel";
import { themeModel } from "../../core/models/themeModel";
import { cadastroProvedorDto } from "../Dtos/cadastroProvedorDto";
import { provedorDto, provedorPainelDto, temaDto } from "../Dtos/provedorDto";
import { ThemeFiles } from "../Dtos/temaFiles.dto";
import { compraModel } from "../../core/models/compraModel";
import { recompensaModel } from "../../core/models/recompensaModel";
import { extratoPontosModel } from "../../core/models/extratoPontosModel";
import { homeConfigModel } from "../../core/models/homeConfigModel";
import { atendimentoModel } from "../../core/models/atendimentoModel";
import { ixcAssuntoModel } from "../../core/models/ixcAssuntoModel";
import { clubeBeneficiosModel } from "../../core/models/clubeBeneficiosModel";
import { parceiroModel } from "../../core/models/parceiroModel";
import { ativacaoTvModel } from "../../core/models/ativacaoTvModel";

export default interface IProvedorServices {
    Cadastrar(cadastro:cadastroProvedorDto): Promise<provedorPainelDto>
    Atualizar(update:cadastroProvedorModel) : Promise<provedorPainelDto>
    ObterProvedor(codigoProvedor:string) : Promise<provedorDto>;
    ObterTema(codigo:string) : Promise<temaDto>;
    ObterBanners(codigo:string) : Promise<any> ;
    ObterAnuncios(codigo:string) : Promise<any> ;
    ObterBeneficios(codigo:string) : Promise<any> ;
    ObterModulosAtivos(codigo:string) : Promise<string[]> ;
    ObterHomeConfig(codigo:string) : Promise<homeConfigModel>;
    ObterAtendimento(codigo:string) : Promise<atendimentoModel>;
    ObterClubeBeneficios(codigo:string) : Promise<clubeBeneficiosModel>;
    ObterIxcAssuntos(codigo:string) : Promise<ixcAssuntoModel[]>;
    RegistrarCliqueBeneficio(idBeneficio:number, codigoProvedor:number) : Promise<void> ;
    ComprarBeneficio(idBeneficio:number, codigoProvedor:number, clienteNome:string, clienteCpfCnpj:string) : Promise<compraModel> ;
    ObterMinhasCompras(codigoProvedor:string, cpfCnpj:string) : Promise<compraModel[]> ;
    RegistrarLoginCliente(codigoProvedor:string, cpfCnpj:string, nome:string) : Promise<void> ;
    ObterMeusPontos(codigo:string, cpfCnpj:string) : Promise<{ saldo:number; extrato:extratoPontosModel[] }> ;
    ObterRecompensas(codigo:string) : Promise<recompensaModel[]> ;
    ResgatarRecompensa(codigo:string, cpfCnpj:string, clienteNome:string, idRecompensa:number) : Promise<extratoPontosModel> ;
    ListarParceirosAtivos(codigoProvedor:string) : Promise<parceiroModel[]> ;
    SalvarIndicacao(indicao:indicacaoModel) : Promise<number>
    ObterIndicacoes(codigoProvedor:string) : Promise<any>
    AtualizarTema(tema:themeModel, files: ThemeFiles) : Promise<any> 
    AvaliarServico(avaliacao:avaliacaoModel) : Promise<any> 
    ObterAvaliacoesServico(codigoProvedor:string) : Promise<any>
    AvaliarApp(avaliacao:avaliacaoModel) : Promise<any> 
    ObterAvaliacoesApp(codigoProvedor:string) : Promise<any>
    ObterManifest(codigo:string) : Promise<any>
    // ATIVAÇÃO TV
    GerarAtivacaoTv(codigoProvedor:number, clienteNome?:string) : Promise<ativacaoTvModel>
    ListarAtivacoesTv(codigoProvedor:number) : Promise<ativacaoTvModel[]>
    RevogarAtivacaoTv(codigoProvedor:number, id:number) : Promise<ativacaoTvModel>
    ValidarAtivacaoTv(codigoProvedor:string, codigo:string) : Promise<{ valido:boolean }>
}