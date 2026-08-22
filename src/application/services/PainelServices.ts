import { inject, injectable } from "tsyringe";
import IPainelRepository from "../../core/interfaces/IPainelRepository";
import { anuncioModel } from "../../core/models/anuncioModel";
import IPainelServices, { metricasModel } from "../interfaces/IPainelService";
import { bannerModel } from "../../core/models/bannerModel";
import UploadService from "./UploadServices";
import { ETipoArquivo } from "../../infrastructure/supabase/ETipoArquivo";
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
import { homeConfigModel } from "../../core/models/homeConfigModel";
import { atendimentoModel } from "../../core/models/atendimentoModel";
import { clubeBeneficiosModel } from "../../core/models/clubeBeneficiosModel";
import { planoModel } from "../../core/models/planoModel";
import { comissaoFaturaModel } from "../../core/models/comissaoFaturaModel";
import { gerarPixCopiaCola } from "../../infrastructure/pix/gerarPixCopiaCola";
import * as QRCode from "qrcode";

// mesma lista usada pela tela de módulos do admin — plano sincroniza ativação
// desses módulos, os demais (novos módulos ainda não incluídos em plano
// nenhum) continuam controláveis manualmente.
const MODULOS_CONHECIDOS = ["beneficios", "recompensas", "desbloqueio_confianca"];

@injectable()
export default class PainelService implements IPainelServices {

    private readonly _painelRepository:IPainelRepository;

    constructor(@inject("IPainelRepository")painelRepository:IPainelRepository){
        this._painelRepository = painelRepository;
    }
    
    async GravarAnuncio(anuncio:anuncioModel) : Promise<anuncioModel> {

        const _upload = new UploadService()
        anuncio.link_imagem =  await _upload.UploadArquivo({
                       codigoProvedor: anuncio.codigo_provedor_fk.toString(),
                       file: anuncio.file?.buffer,
                       nomeArquivo: "anuncio"+anuncio.file?.originalname,
                       tipo: ETipoArquivo.ANUNCIO
                   })
        return await this._painelRepository.GravarAnuncio(anuncio);
    }

    async ExcluirAnuncio(id:string, codigoProvedor:number) : Promise<any> {
        await this._painelRepository.ExcluiAnuncio(id, codigoProvedor)

    }

    async EditarAnuncio(id:number, anuncioEdite:anuncioEditeDto) : Promise<anuncioModel>  {
        const anuncio = await this._painelRepository.ObterAnuncioPorId(id, anuncioEdite.codigo_provedor_fk);
        
        if(anuncioEdite.titulo !== undefined)
            anuncio.titulo = anuncioEdite.titulo;
        if(anuncioEdite.subtitulo !== undefined)
            anuncio.subtitulo = anuncioEdite.subtitulo;
        if(anuncioEdite.descricao !== undefined)
            anuncio.descricao = anuncioEdite.descricao;
             
        
        if(anuncioEdite.file !== undefined){
            
            const _upload = new UploadService();
            anuncio.link_imagem = await _upload.UploadArquivo({
               codigoProvedor: anuncioEdite.codigo_provedor_fk.toString(),
               file: anuncioEdite.file.buffer,
               nomeArquivo: "anuncio",
               tipo: ETipoArquivo.ANUNCIO
           });
        }
        
        if(anuncioEdite.link !== undefined)
            anuncio.link_acao = anuncioEdite.link;

        anuncio.ativo = anuncioEdite.ativo;

        const novoAnuncio = await this._painelRepository.EditarAnuncio(anuncio);

        return novoAnuncio;
    }

    async GravarBanner(anuncio: bannerModel): Promise<bannerModel> {
        return await this._painelRepository.GravarBanner(anuncio);
    }

    async ObterBanners(codigoProvedor: number): Promise<bannerModel[]> {
        const banners =  await this._painelRepository.ObterBanners(codigoProvedor);
        if(banners)
            return banners;
        return [];
    }

    async EditarBanner(id:number, bannerEdite: bannerModel): Promise<bannerModel> {
        const banner = await this._painelRepository.ObterBannerPorId(id, bannerEdite.codigo_provedor_fk);

        if(bannerEdite.selo)
            banner.selo = bannerEdite.selo;
        if(bannerEdite.titulo)
            banner.titulo = bannerEdite.titulo;
        if(bannerEdite.subtitulo)
            banner.subtitulo = bannerEdite.subtitulo;
        if(bannerEdite.cta)
            banner.cta = bannerEdite.cta;
        if(bannerEdite.cor1)
            banner.cor1 = bannerEdite.cor1;
        if(bannerEdite.cor2)
            banner.cor2 = bannerEdite.cor2;        
        if(bannerEdite.emoji)
            banner.emoji = bannerEdite.emoji;        
        if(bannerEdite.link)
            banner.link = bannerEdite.link;        
        //if(bannerEdite.ativo)     
        banner.ativo = true;

        const novoBanner = await this._painelRepository.EditarBanner(banner);

        return novoBanner;
    }

    async ExcluiBanner(idBanner: string, codigoProvedor: number): Promise<any> {
        return await this._painelRepository.ExcluiBanner(idBanner, codigoProvedor)
    }

    // Ofertas são criadas/editadas pelo parceiro (ver ParceiroServices) — o provedor só
    // enxerga o catálogo e ativa/desativa pra própria base.
    async ObterCatalogoOfertas(codigoProvedor: number): Promise<beneficioModel[]> {
        return await this._painelRepository.ObterCatalogoOfertas(codigoProvedor);
    }

    async AtivarOferta(idBeneficio:number, codigoProvedor:number, ativo:boolean) : Promise<void> {
        await this._painelRepository.AtivarOferta(idBeneficio, codigoProvedor, ativo);
    }

    async ObterMetricas(codigoProvedor:number) : Promise<metricasModel> {

        const beneficiosUtilizados = await this._painelRepository.ContarCliquesBeneficios(codigoProvedor);
        const resumoCompras = await this._painelRepository.ObterResumoCompras(codigoProvedor);
        const usuariosAtivos = await this._painelRepository.ContarUsuariosAtivos(codigoProvedor);

        // clientesConectados (base total de assinantes do provedor) é impossível de obter:
        // ReceitaNet/IXC só respondem consulta por cliente individual (CPF/token), não existe
        // endpoint de listagem em massa — permanece 0 enquanto a API for só uma ponte.
        return {
            clientesConectados: 0,
            usuariosAtivos,
            compras: resumoCompras.compras,
            vendasGeradas: resumoCompras.vendasGeradas,
            comissao: resumoCompras.comissao,
            beneficiosUtilizados,
        };
    }

    async ObterCompras(codigoProvedor:number) : Promise<compraModel[]> {
        return await this._painelRepository.ObterCompras(codigoProvedor);
    }

    async ObterConfigComissao() : Promise<configComissaoModel> {
        return await this._painelRepository.ObterConfigComissao();
    }

    async DefinirConfigComissao(config:configComissaoModel) : Promise<configComissaoModel> {
        const soma = Number(config.percentual_parceiro) + Number(config.percentual_synk) + Number(config.percentual_provedor);
        if (Math.round(soma * 100) / 100 !== 100)
            throw new Error("Os percentuais precisam somar 100%.");
        return await this._painelRepository.AtualizarConfigComissao(config);
    }

    async GravarRecompensa(recompensa:recompensaModel) : Promise<recompensaModel> {
        return await this._painelRepository.GravarRecompensa(recompensa);
    }

    async ObterRecompensas(codigoProvedor:number) : Promise<recompensaModel[]> {
        const recompensas = await this._painelRepository.ObterRecompensas(codigoProvedor);
        return recompensas || [];
    }

    async EditarRecompensa(id:number, recompensaEdite:recompensaModel) : Promise<recompensaModel> {
        const recompensa = await this._painelRepository.ObterRecompensaPorId(id, recompensaEdite.codigo_provedor_fk);
        if(!recompensa)
            throw new Error("Recompensa não encontrada.");

        if(recompensaEdite.titulo !== undefined)
            recompensa.titulo = recompensaEdite.titulo;
        if(recompensaEdite.descricao !== undefined)
            recompensa.descricao = recompensaEdite.descricao;
        if(recompensaEdite.pontos_necessarios !== undefined)
            recompensa.pontos_necessarios = recompensaEdite.pontos_necessarios;
        recompensa.ativo = recompensaEdite.ativo;

        return await this._painelRepository.EditarRecompensa(recompensa);
    }

    async ExcluirRecompensa(id:string, codigoProvedor:number) : Promise<any> {
        await this._painelRepository.ExcluiRecompensa(id, codigoProvedor);
    }

    async ObterConfigPontos() : Promise<configPontosModel> {
        return await this._painelRepository.ObterConfigPontos();
    }

    async DefinirConfigPontos(config:configPontosModel) : Promise<configPontosModel> {
        if (Number(config.pontos_por_real) <= 0)
            throw new Error("A taxa de pontos por real precisa ser maior que zero.");
        if (config.pontos_indicacao_efetivada != null && Number(config.pontos_indicacao_efetivada) < 0)
            throw new Error("Os pontos por indicação efetivada não podem ser negativos.");
        return await this._painelRepository.AtualizarConfigPontos(config);
    }

    async ConcederPontosManual(codigoProvedor:number, clienteCpfCnpj:string, clienteNome:string, pontos:number, motivo:string) : Promise<extratoPontosModel> {
        if(!clienteCpfCnpj?.trim() || !clienteNome?.trim())
            throw new Error("Informe o CPF/CNPJ e o nome do cliente.");
        if(!Number.isFinite(pontos) || pontos <= 0)
            throw new Error("Informe uma quantidade de pontos válida.");
        if(!motivo?.trim())
            throw new Error("Informe o motivo da concessão.");
        return await this._painelRepository.ConcederPontosManual(codigoProvedor, clienteCpfCnpj.trim(), clienteNome.trim(), pontos, motivo.trim());
    }

    async MarcarIndicacaoEfetivada(idIndicacao:number, codigoProvedor:number) : Promise<{ indicacao:any; extrato:extratoPontosModel }> {
        return await this._painelRepository.MarcarIndicacaoEfetivada(idIndicacao, codigoProvedor);
    }

    async ObterRelatorioComprasAdmin() {
        const [resumo, compras] = await Promise.all([
            this._painelRepository.ObterResumoComprasGlobal(),
            this._painelRepository.ObterComprasTodos(),
        ]);
        return { resumo, compras };
    }

    async ObterModulosAtivos(codigoProvedor:number) : Promise<string[]> {
        return await this._painelRepository.ObterModulosAtivos(codigoProvedor);
    }

    async ListarProvedoresComModulos() : Promise<any[]> {
        return await this._painelRepository.ListarProvedoresComModulos();
    }

    async DefinirModulo(codigoProvedor:number, modulo:string, ativo:boolean) : Promise<void> {
        await this._painelRepository.DefinirModulo(codigoProvedor, modulo, ativo);
    }

    async DefinirStatusProvedor(codigoProvedor:number, status:string) : Promise<void> {
        if(status !== "ATIVO" && status !== "INATIVO")
            throw new Error("Status inválido.");
        await this._painelRepository.DefinirStatusProvedor(codigoProvedor, status);
    }

    async CriarParceiro(parceiro:parceiroModel) : Promise<parceiroModel> {
        if(!parceiro.nome || !parceiro.usuario || !parceiro.senha)
            throw new Error("Informe nome, usuário e senha do parceiro.");
        return await this._painelRepository.CriarParceiro(parceiro);
    }

    async ListarParceiros() : Promise<parceiroModel[]> {
        return await this._painelRepository.ListarParceiros();
    }

    async DefinirStatusParceiro(id:number, ativo:boolean) : Promise<void> {
        await this._painelRepository.DefinirStatusParceiro(id, ativo);
    }

    async DefinirProvedorParceiro(id:number, codigoProvedorFk:number|null) : Promise<void> {
        await this._painelRepository.DefinirProvedorParceiro(id, codigoProvedorFk);
    }

    async DefinirLocalizacaoParceiro(id:number, cidade:string|null, uf:string|null) : Promise<void> {
        await this._painelRepository.DefinirLocalizacaoParceiro(id, cidade, uf);
    }

    async DefinirContatoParceiro(id:number, endereco:string|null, contato:string|null) : Promise<void> {
        await this._painelRepository.DefinirContatoParceiro(id, endereco, contato);
    }

    async ValidarCompraAdmin(idCompra:number) : Promise<compraModel> {
        const compra = await this._painelRepository.ValidarCompraAdmin(idCompra);
        if(!compra)
            throw new Error("Compra não encontrada ou já processada.");
        return compra;
    }

    // FATURAMENTO SYNK (mensalidade que o provedor paga pra Synk)

    async ObterFaturamentoProvedor(codigoProvedor:number) {
        await this._painelRepository.GarantirFaturaDoMes(codigoProvedor);

        const [assinatura, faturas, modulosAtivos, pixConfig] = await Promise.all([
            this._painelRepository.ObterAssinatura(codigoProvedor),
            this._painelRepository.ObterFaturasProvedor(codigoProvedor),
            this._painelRepository.ObterModulosAtivos(codigoProvedor),
            this._painelRepository.ObterConfigPix(),
        ]);

        const faturaAberta = faturas.find((f) => f.status === "pendente");
        let pixCopiaCola: string | null = null;
        let pixQrCode: string | null = null;
        if (faturaAberta && pixConfig?.chave_pix) {
            pixCopiaCola = gerarPixCopiaCola({
                chave: pixConfig.chave_pix,
                nomeRecebedor: pixConfig.nome_recebedor,
                cidade: pixConfig.cidade,
                valor: Number(faturaAberta.valor),
                txid: `FAT${faturaAberta.id}`,
            });
            // gera a imagem do QR code localmente a partir do próprio texto do PIX —
            // sem chamada de rede, sem serviço externo.
            pixQrCode = await QRCode.toDataURL(pixCopiaCola, { margin: 1, width: 280 });
        }

        return { assinatura, faturas, modulosAtivos, pixCopiaCola, pixQrCode };
    }

    async CriarOuEditarAssinatura(codigoProvedor:number, valorMensalidade:number, dataAdesao:string, planoId:number|null) : Promise<assinaturaModel> {
        if (!dataAdesao)
            throw new Error("Informe a data de adesão.");

        let valor = valorMensalidade;

        if (planoId) {
            const plano = await this._painelRepository.ObterPlano(planoId);
            if (!plano)
                throw new Error("Plano não encontrado.");

            valor = Number(plano.valor_mensalidade);

            // plano define os módulos: ativa os incluídos, desativa os demais —
            // assinatura "sem plano" (planoId null) continua sem mexer nos módulos,
            // pra não bagunçar configuração manual/personalizada.
            for (const modulo of MODULOS_CONHECIDOS) {
                await this._painelRepository.DefinirModulo(codigoProvedor, modulo, plano.modulos.includes(modulo));
            }
        }

        if (!(valor > 0))
            throw new Error("Informe um valor de mensalidade válido.");

        const assinatura = await this._painelRepository.CriarOuEditarAssinatura(codigoProvedor, valor, dataAdesao, planoId);
        await this._painelRepository.GarantirFaturaDoMes(codigoProvedor);
        return assinatura;
    }

    async ListarPlanos() : Promise<planoModel[]> {
        return await this._painelRepository.ListarPlanos();
    }

    async CriarPlano(nome:string, valorMensalidade:number, modulos:string[], ordem:number) : Promise<planoModel> {
        if (!nome?.trim())
            throw new Error("Informe o nome do plano.");
        if (!(valorMensalidade > 0))
            throw new Error("Informe um valor de mensalidade válido.");
        return await this._painelRepository.CriarPlano(nome.trim(), valorMensalidade, modulos ?? [], ordem ?? 0);
    }

    async EditarPlano(id:number, nome:string, valorMensalidade:number, modulos:string[], ordem:number) : Promise<planoModel> {
        if (!nome?.trim())
            throw new Error("Informe o nome do plano.");
        if (!(valorMensalidade > 0))
            throw new Error("Informe um valor de mensalidade válido.");
        return await this._painelRepository.EditarPlano(id, nome.trim(), valorMensalidade, modulos ?? [], ordem ?? 0);
    }

    async DefinirStatusPlano(id:number, ativo:boolean) : Promise<void> {
        await this._painelRepository.DefinirStatusPlano(id, ativo);
    }

    async GarantirFaturasComissaoTodos() : Promise<void> {
        await this._painelRepository.GarantirFaturasComissaoTodos();
    }

    async ListarFaturasComissaoTodos() : Promise<any[]> {
        await this._painelRepository.GarantirFaturasComissaoTodos();
        return await this._painelRepository.ListarFaturasComissaoTodos();
    }

    async MarcarFaturaComissaoPaga(id:number) : Promise<comissaoFaturaModel> {
        return await this._painelRepository.MarcarFaturaComissaoPaga(id);
    }

    async MarcarFaturaComissaoCancelada(id:number) : Promise<comissaoFaturaModel> {
        return await this._painelRepository.MarcarFaturaComissaoCancelada(id);
    }

    async ListarFaturamentoTodos() : Promise<any[]> {
        await this._painelRepository.GarantirFaturasTodos();
        return await this._painelRepository.ListarFaturamentoTodos();
    }

    async MarcarFaturaPaga(idFatura:number) : Promise<faturaModel> {
        return await this._painelRepository.MarcarFaturaPaga(idFatura);
    }

    async MarcarFaturaCancelada(idFatura:number) : Promise<faturaModel> {
        return await this._painelRepository.MarcarFaturaCancelada(idFatura);
    }

    async ObterRecibo(idFatura:number) {
        const fatura = await this._painelRepository.ObterFaturaComProvedor(idFatura);
        if (!fatura)
            throw new Error("Fatura não encontrada.");
        if (fatura.status !== "pago")
            throw new Error("Só é possível gerar recibo de faturas pagas.");

        return {
            numero: `SYNK-${String(fatura.id).padStart(6, "0")}`,
            provedorNome: fatura.provedor_nome ?? "",
            provedorCnpj: fatura.provedor_cnpj,
            competencia: fatura.competencia,
            valor: Number(fatura.valor),
            pagoEm: fatura.pago_em,
        };
    }

    async ObterConfigPix() : Promise<pixConfigModel> {
        return await this._painelRepository.ObterConfigPix();
    }

    async DefinirConfigPix(config:pixConfigModel) : Promise<pixConfigModel> {
        if (!config.chave_pix?.trim())
            throw new Error("Informe a chave PIX.");
        return await this._painelRepository.DefinirConfigPix(config);
    }

    async ObterHomeConfig(codigoProvedor:number) : Promise<homeConfigModel> {
        return await this._painelRepository.ObterHomeConfig(codigoProvedor);
    }

    async DefinirHomeConfig(codigoProvedor:number, config:homeConfigModel) : Promise<homeConfigModel> {
        return await this._painelRepository.DefinirHomeConfig(codigoProvedor, config);
    }

    async ObterAtendimento(codigoProvedor:number) : Promise<atendimentoModel> {
        return await this._painelRepository.ObterAtendimento(codigoProvedor);
    }

    async DefinirAtendimento(codigoProvedor:number, dados:atendimentoModel) : Promise<atendimentoModel> {
        return await this._painelRepository.DefinirAtendimento(codigoProvedor, dados);
    }

    async ObterClubeBeneficios(codigoProvedor:number) : Promise<clubeBeneficiosModel> {
        return await this._painelRepository.ObterClubeBeneficios(codigoProvedor);
    }

    async DefinirClubeBeneficios(codigoProvedor:number, dados:clubeBeneficiosModel) : Promise<clubeBeneficiosModel> {
        return await this._painelRepository.DefinirClubeBeneficios(codigoProvedor, dados);
    }

    async VerificarInadimplenciaTodos() : Promise<number> {
        await this._painelRepository.GarantirFaturasTodos();
        return await this._painelRepository.VerificarInadimplenciaTodos();
    }

}
