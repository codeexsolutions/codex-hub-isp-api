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
import { assinaturaModel } from "../../core/models/assinaturaModel";
import { faturaModel } from "../../core/models/faturaModel";
import { pixConfigModel } from "../../core/models/pixConfigModel";
import { iptvConfigModel } from "../../core/models/iptvConfigModel";
import { homeConfigModel } from "../../core/models/homeConfigModel";
import { atendimentoModel } from "../../core/models/atendimentoModel";
import { planoModel } from "../../core/models/planoModel";
import { comissaoFaturaModel } from "../../core/models/comissaoFaturaModel";
import { ixcOsConfigModel } from "../../core/models/ixcOsConfigModel";
import { ixcContratoConfigModel } from "../../core/models/ixcContratoConfigModel";
import { ixcAssuntoModel } from "../../core/models/ixcAssuntoModel";
import { clubeBeneficiosModel } from "../../core/models/clubeBeneficiosModel";
import { licencaTvModel, configLicencaTvModel } from "../../core/models/licencaTvModel";

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

    // FATURAMENTO SYNK (mensalidade do provedor pra Synk)
    ObterFaturamentoProvedor(codigoProvedor:number) : Promise<{
        assinatura: assinaturaModel|null;
        faturas: faturaModel[];
        modulosAtivos: string[];
        pixCopiaCola: string|null;
        pixQrCode: string|null;
    }>
    CriarOuEditarAssinatura(codigoProvedor:number, valorMensalidade:number, dataAdesao:string, planoId:number|null) : Promise<assinaturaModel>
    ListarPlanos() : Promise<planoModel[]>
    CriarPlano(nome:string, valorMensalidade:number, modulos:string[], ordem:number) : Promise<planoModel>
    EditarPlano(id:number, nome:string, valorMensalidade:number, modulos:string[], ordem:number) : Promise<planoModel>
    DefinirStatusPlano(id:number, ativo:boolean) : Promise<void>

    // PAGAMENTO DE COMISSÃO DO PARCEIRO
    GarantirFaturasComissaoTodos() : Promise<void>
    ListarFaturasComissaoTodos() : Promise<any[]>
    MarcarFaturaComissaoPaga(id:number) : Promise<comissaoFaturaModel>
    MarcarFaturaComissaoCancelada(id:number) : Promise<comissaoFaturaModel>

    // ORDEM DE SERVIÇO IXC
    ObterIxcOsConfig(codigoProvedor:number) : Promise<ixcOsConfigModel>
    DefinirIxcOsConfig(codigoProvedor:number, dados:ixcOsConfigModel) : Promise<ixcOsConfigModel>

    // ASSUNTOS DE OS IXC
    ListarIxcAssuntos(codigoProvedor:number) : Promise<ixcAssuntoModel[]>
    CriarIxcAssunto(codigoProvedor:number, nome:string, idAssuntoIxc:number) : Promise<ixcAssuntoModel>
    ExcluirIxcAssunto(id:number, codigoProvedor:number) : Promise<void>

    // IMPRESSÃO DE CONTRATO IXC
    ObterIxcContratoConfig(codigoProvedor:number) : Promise<ixcContratoConfigModel>
    DefinirIxcContratoConfig(codigoProvedor:number, resourceImprimir:string) : Promise<ixcContratoConfigModel>

    ListarFaturamentoTodos() : Promise<any[]>
    MarcarFaturaPaga(idFatura:number) : Promise<faturaModel>
    MarcarFaturaCancelada(idFatura:number) : Promise<faturaModel>
    ObterRecibo(idFatura:number) : Promise<{
        numero:string;
        provedorNome:string;
        provedorCnpj?:string;
        competencia:string;
        valor:number;
        pagoEm:string|null|undefined;
    }>
    ObterConfigPix() : Promise<pixConfigModel>
    DefinirConfigPix(config:pixConfigModel) : Promise<pixConfigModel>
    VerificarInadimplenciaTodos() : Promise<number>

    // IPTV (URL padrão do servidor Xtream usada pelo app de TV)
    ObterConfigIptv() : Promise<iptvConfigModel>
    DefinirConfigIptv(urlPadrao:string) : Promise<iptvConfigModel>

    // LICENÇA ANUAL DO SYNK TV (venda avulsa, sem provedor)
    ObterConfigLicencaTv() : Promise<configLicencaTvModel>
    DefinirConfigLicencaTv(config:configLicencaTvModel) : Promise<configLicencaTvModel>
    SolicitarLicencaTv(nome:string, telefone:string) : Promise<{ chave:string; valor:number; status:string; vencimento:string|null; pixCopiaCola:string|null; pixQrCode:string|null }>
    ObterStatusLicencaTv(chave:string) : Promise<{ chave:string; status:string; vencimento:string|null; valor:number; pixCopiaCola?:string|null; pixQrCode?:string|null }>
    ListarLicencasTv() : Promise<licencaTvModel[]>
    AprovarLicencaTv(id:number) : Promise<licencaTvModel>
    CancelarLicencaTv(id:number) : Promise<licencaTvModel>

    // HOME CONFIGURÁVEL (blocos ativos/ocultos na tela inicial do app)
    ObterHomeConfig(codigoProvedor:number) : Promise<homeConfigModel>
    DefinirHomeConfig(codigoProvedor:number, config:homeConfigModel) : Promise<homeConfigModel>

    // CANAIS DE ATENDIMENTO
    ObterAtendimento(codigoProvedor:number) : Promise<atendimentoModel>
    DefinirAtendimento(codigoProvedor:number, dados:atendimentoModel) : Promise<atendimentoModel>

    // CLUBE DE BENEFÍCIOS (identidade própria)
    ObterClubeBeneficios(codigoProvedor:number) : Promise<clubeBeneficiosModel>
    DefinirClubeBeneficios(codigoProvedor:number, dados:clubeBeneficiosModel) : Promise<clubeBeneficiosModel>
}

export type metricasModel = {
    clientesConectados:number;
    usuariosAtivos:number;
    compras:number;
    vendasGeradas:number;
    comissao:number;
    beneficiosUtilizados:number;
}