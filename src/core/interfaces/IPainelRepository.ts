import { anuncioModel } from "../models/anuncioModel";
import { bannerModel } from "../models/bannerModel";
import { beneficioModel } from "../models/beneficioModel";
import { compraModel } from "../models/compraModel";
import { configComissaoModel } from "../models/configComissaoModel";
import { recompensaModel } from "../models/recompensaModel";
import { configPontosModel } from "../models/configPontosModel";
import { parceiroModel } from "../models/parceiroModel";
import { extratoPontosModel } from "../models/extratoPontosModel";
import { assinaturaModel } from "../models/assinaturaModel";
import { planoModel } from "../models/planoModel";
import { faturaModel } from "../models/faturaModel";
import { pixConfigModel } from "../models/pixConfigModel";
import { homeConfigModel } from "../models/homeConfigModel";
import { atendimentoModel } from "../models/atendimentoModel";
import { comissaoFaturaModel } from "../models/comissaoFaturaModel";
import { clubeBeneficiosModel } from "../models/clubeBeneficiosModel";

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

    // OFERTAS (criadas pelo parceiro — provedor só vê o catálogo e ativa/desativa)
    ObterCatalogoOfertas(codigoProvedor: number) : Promise<beneficioModel[]>
    AtivarOferta(idBeneficio:number, codigoProvedor:number, ativo:boolean) : Promise<void>

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

    // PONTOS MANUAIS (pagamento em dia / indicação efetivada)
    ConcederPontosManual(codigoProvedor:number, clienteCpfCnpj:string, clienteNome:string, pontos:number, motivo:string) : Promise<extratoPontosModel>
    MarcarIndicacaoEfetivada(idIndicacao:number, codigoProvedor:number) : Promise<{ indicacao:any; extrato:extratoPontosModel }>

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
    DefinirLocalizacaoParceiro(id:number, cidade:string|null, uf:string|null) : Promise<void>
    DefinirContatoParceiro(id:number, endereco:string|null, contato:string|null) : Promise<void>
    ValidarCompraAdmin(idCompra:number) : Promise<compraModel>

    // FATURAMENTO SYNK (mensalidade do provedor pra Synk)
    ObterAssinatura(codigoProvedor:number) : Promise<assinaturaModel|null>
    CriarOuEditarAssinatura(codigoProvedor:number, valorMensalidade:number, dataAdesao:string, planoId:number|null) : Promise<assinaturaModel>
    ListarPlanos() : Promise<planoModel[]>
    ObterPlano(id:number) : Promise<planoModel|null>
    CriarPlano(nome:string, valorMensalidade:number, modulos:string[], ordem:number) : Promise<planoModel>
    EditarPlano(id:number, nome:string, valorMensalidade:number, modulos:string[], ordem:number) : Promise<planoModel>
    DefinirStatusPlano(id:number, ativo:boolean) : Promise<void>
    GarantirFaturaDoMes(codigoProvedor:number) : Promise<void>
    GarantirFaturasTodos() : Promise<void>
    ObterFaturasProvedor(codigoProvedor:number) : Promise<faturaModel[]>
    ObterFaturaComProvedor(idFatura:number) : Promise<faturaModel|null>
    MarcarFaturaPaga(idFatura:number) : Promise<faturaModel>
    MarcarFaturaCancelada(idFatura:number) : Promise<faturaModel>
    VerificarInadimplenciaTodos() : Promise<number>
    ListarFaturamentoTodos() : Promise<any[]>
    ObterConfigPix() : Promise<pixConfigModel>
    DefinirConfigPix(config:pixConfigModel) : Promise<pixConfigModel>

    // HOME CONFIGURÁVEL (blocos ativos/ocultos na tela inicial do app)
    ObterHomeConfig(codigoProvedor:number) : Promise<homeConfigModel>
    DefinirHomeConfig(codigoProvedor:number, config:homeConfigModel) : Promise<homeConfigModel>

    // CANAIS DE ATENDIMENTO
    ObterAtendimento(codigoProvedor:number) : Promise<atendimentoModel>
    DefinirAtendimento(codigoProvedor:number, dados:atendimentoModel) : Promise<atendimentoModel>

    // CLUBE DE BENEFÍCIOS (identidade própria)
    ObterClubeBeneficios(codigoProvedor:number) : Promise<clubeBeneficiosModel>
    DefinirClubeBeneficios(codigoProvedor:number, dados:clubeBeneficiosModel) : Promise<clubeBeneficiosModel>

    // PAGAMENTO DE COMISSÃO DO PARCEIRO
    GarantirFaturaComissaoParceiro(parceiroId:number) : Promise<void>
    GarantirFaturasComissaoTodos() : Promise<void>
    ObterFaturasComissaoParceiro(parceiroId:number) : Promise<comissaoFaturaModel[]>
    ListarFaturasComissaoTodos() : Promise<any[]>
    MarcarFaturaComissaoPaga(id:number) : Promise<comissaoFaturaModel>
    MarcarFaturaComissaoCancelada(id:number) : Promise<comissaoFaturaModel>
}