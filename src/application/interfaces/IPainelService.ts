import { anuncioModel } from "../../core/models/anuncioModel";
import { bannerModel } from "../../core/models/bannerModel";
import { anuncioEditeDto } from "../Dtos/anuncioEditeDto";
import { beneficioModel } from "../../core/models/beneficioModel";
import { compraModel } from "../../core/models/compraModel";
import { configComissaoModel } from "../../core/models/configComissaoModel";
import { recompensaModel } from "../../core/models/recompensaModel";
import { configPontosModel } from "../../core/models/configPontosModel";
import { parceiroModel } from "../../core/models/parceiroModel";
import { extratoPontosModel } from "../../core/models/extratoPontosModel";

export default interface IPainelServices {

    GravarAnuncio(anuncio:anuncioModel) : Promise<anuncioModel>
    ExcluirAnuncio(id:string, codigoProvedor:number) : Promise<any>
    EditarAnuncio(id:number, anuncio:anuncioEditeDto) : Promise<anuncioModel>

    // BANNERS
    GravarBanner(banner:bannerModel) : Promise<bannerModel>
    ObterBanners(codigoProvedor: number) : Promise<bannerModel[]>
    EditarBanner(id:number, banner:bannerModel) : Promise<bannerModel>
    ExcluiBanner(idAnuncio:string, codigoProvedor:number) : Promise<any>

    // OFERTAS (criadas pelo parceiro — provedor só vê o catálogo e ativa/desativa)
    ObterCatalogoOfertas(codigoProvedor: number) : Promise<beneficioModel[]>
    AtivarOferta(idBeneficio:number, codigoProvedor:number, ativo:boolean) : Promise<void>

    // METRICAS
    ObterMetricas(codigoProvedor:number) : Promise<metricasModel>

    // COMPRAS
    ObterCompras(codigoProvedor:number) : Promise<compraModel[]>
    ObterConfigComissao() : Promise<configComissaoModel>
    DefinirConfigComissao(config:configComissaoModel) : Promise<configComissaoModel>

    // RELATORIO ADMIN
    ObterRelatorioComprasAdmin() : Promise<{
        resumo: { compras:number; totalVendas:number; totalParceiro:number; totalSynk:number; totalProvedor:number };
        compras: compraModel[];
    }>

    // RECOMPENSAS (pontos)
    GravarRecompensa(recompensa:recompensaModel) : Promise<recompensaModel>
    ObterRecompensas(codigoProvedor:number) : Promise<recompensaModel[]>
    EditarRecompensa(id:number, recompensa:recompensaModel) : Promise<recompensaModel>
    ExcluirRecompensa(id:string, codigoProvedor:number) : Promise<any>
    ObterConfigPontos() : Promise<configPontosModel>
    DefinirConfigPontos(config:configPontosModel) : Promise<configPontosModel>

    // PONTOS MANUAIS (pagamento em dia / indicação efetivada)
    ConcederPontosManual(codigoProvedor:number, clienteCpfCnpj:string, clienteNome:string, pontos:number, motivo:string) : Promise<extratoPontosModel>
    MarcarIndicacaoEfetivada(idIndicacao:number, codigoProvedor:number) : Promise<{ indicacao:any; extrato:extratoPontosModel }>

    // MODULOS
    ObterModulosAtivos(codigoProvedor:number) : Promise<string[]>
    ListarProvedoresComModulos() : Promise<any[]>
    DefinirModulo(codigoProvedor:number, modulo:string, ativo:boolean) : Promise<void>
    DefinirStatusProvedor(codigoProvedor:number, status:string) : Promise<void>

    // PARCEIROS (admin)
    CriarParceiro(parceiro:parceiroModel) : Promise<parceiroModel>
    ListarParceiros() : Promise<parceiroModel[]>
    DefinirStatusParceiro(id:number, ativo:boolean) : Promise<void>
    DefinirProvedorParceiro(id:number, codigoProvedorFk:number|null) : Promise<void>
    DefinirLocalizacaoParceiro(id:number, cidade:string|null, uf:string|null) : Promise<void>
    DefinirContatoParceiro(id:number, endereco:string|null, contato:string|null) : Promise<void>
    ValidarCompraAdmin(idCompra:number) : Promise<compraModel>
}

export type metricasModel = {
    clientesConectados:number;
    usuariosAtivos:number;
    compras:number;
    vendasGeradas:number;
    comissao:number;
    beneficiosUtilizados:number;
}