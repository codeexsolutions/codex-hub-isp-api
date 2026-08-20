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

}
