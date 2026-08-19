import { anuncioModel } from "../models/anuncioModel";
import { bannerModel } from "../models/bannerModel";
import { beneficioModel } from "../models/beneficioModel";
import { compraModel } from "../models/compraModel";
import { configComissaoModel } from "../models/configComissaoModel";
import { recompensaModel } from "../models/recompensaModel";
import { configPontosModel } from "../models/configPontosModel";
import { parceiroModel } from "../models/parceiroModel";

export default interface IPainelRepository {

    // ANUNCIOS
    GravarAnuncio(anuncio:anuncioModel) : Promise<anuncioModel>
    ObterAnuncios(codigoProvedor: number) : Promise<anuncioModel[]>
    ObterAnuncioPorId(idAnuncio:number, codigoProvedor: number) : Promise<anuncioModel>
    EditarAnuncio(anuncio:anuncioModel) : Promise<anuncioModel>
    ExcluiAnuncio(idAnuncio:string, codigoProvedor:number) : Promise<any>

    // BANNERS
    GravarBanner(anuncio:bannerModel) : Promise<bannerModel>
    ObterBanners(codigoProvedor: number) : Promise<bannerModel[]>
    ObterBannerPorId(idAnuncio:number, codigoProvedor: number) : Promise<bannerModel>
    EditarBanner(anuncio:bannerModel) : Promise<bannerModel>
    ExcluiBanner(idAnuncio:string, codigoProvedor:number) : Promise<any>

    // BENEFICIOS
    GravarBeneficio(beneficio:beneficioModel) : Promise<beneficioModel>
    ObterBeneficios(codigoProvedor: number) : Promise<beneficioModel[]>
    ObterBeneficioPorId(idBeneficio:number, codigoProvedor: number) : Promise<beneficioModel>
    EditarBeneficio(beneficio:beneficioModel) : Promise<beneficioModel>
    ExcluiBeneficio(idBeneficio:string, codigoProvedor:number) : Promise<any>

    // METRICAS
    ContarCliquesBeneficios(codigoProvedor:number) : Promise<number>
    ObterResumoCompras(codigoProvedor:number) : Promise<{ compras:number; vendasGeradas:number; comissao:number }>
    ContarUsuariosAtivos(codigoProvedor:number) : Promise<number>

    // COMPRAS
    ObterCompras(codigoProvedor:number) : Promise<compraModel[]>
    ObterConfigComissao() : Promise<configComissaoModel>
    AtualizarConfigComissao(config:configComissaoModel) : Promise<configComissaoModel>

    // RELATORIO ADMIN (todos os provedores)
    ObterComprasTodos() : Promise<compraModel[]>
    ObterResumoComprasGlobal() : Promise<{ compras:number; totalVendas:number; totalParceiro:number; totalSynk:number; totalProvedor:number }>

    // RECOMPENSAS (pontos)
    GravarRecompensa(recompensa:recompensaModel) : Promise<recompensaModel>
    ObterRecompensas(codigoProvedor:number) : Promise<recompensaModel[]>
    ObterRecompensaPorId(idRecompensa:number, codigoProvedor:number) : Promise<recompensaModel>
    EditarRecompensa(recompensa:recompensaModel) : Promise<recompensaModel>
    ExcluiRecompensa(idRecompensa:string, codigoProvedor:number) : Promise<any>
    ObterConfigPontos() : Promise<configPontosModel>
    AtualizarConfigPontos(config:configPontosModel) : Promise<configPontosModel>

    // MODULOS
    ObterModulosAtivos(codigoProvedor:number) : Promise<string[]>
    PossuiModulo(codigoProvedor:number, modulo:string) : Promise<boolean>
    ListarProvedoresComModulos() : Promise<any[]>
    DefinirModulo(codigoProvedor:number, modulo:string, ativo:boolean) : Promise<void>
    DefinirStatusProvedor(codigoProvedor:number, status:string) : Promise<void>

    // PARCEIROS (admin)
    CriarParceiro(parceiro:parceiroModel) : Promise<parceiroModel>
    ListarParceiros() : Promise<parceiroModel[]>
    DefinirStatusParceiro(id:number, ativo:boolean) : Promise<void>
    DefinirProvedorParceiro(id:number, codigoProvedorFk:number|null) : Promise<void>
    ValidarCompraAdmin(idCompra:number) : Promise<compraModel>
}