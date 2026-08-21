import { inject, injectable } from "tsyringe";
import { AuthRequest } from "../middleware/IAuthRequest";
import { Request, Response } from "express";
import { themeModel } from "../../core/models/themeModel";
import IProvedorServices from "../../application/interfaces/IProvedorServices";
import { indicacaoModel } from "../../core/models/indicacaoModel";
import { cadastroProvedorDto } from "../../application/Dtos/cadastroProvedorDto";
import { cadastroProvedorModel } from "../../core/models/cadastroProvevedorModel";
import { loginPainel } from "../../application/Dtos/tokenDto";
import { retornoPadrao } from "../../application/Dtos/retornoPadrao";
import { tokenPainelDto } from "../../application/Dtos/tokenPainelDto";
import ITokenService from "../../application/interfaces/ITokenService";
import IPainelServices from "../../application/interfaces/IPainelService";
import { anuncioModel } from "../../core/models/anuncioModel";
import { bannerModel } from "../../core/models/bannerModel";
import { ThemeFiles } from "../../application/Dtos/temaFiles.dto";
import { anuncioEditeDto } from "../../application/Dtos/anuncioEditeDto";
import { adminLoginDto } from "../../application/Dtos/adminLoginDto";
import { configComissaoModel } from "../../core/models/configComissaoModel";
import { recompensaModel } from "../../core/models/recompensaModel";
import { pixConfigModel } from "../../core/models/pixConfigModel";
import { configPontosModel } from "../../core/models/configPontosModel";
import { parceiroModel } from "../../core/models/parceiroModel";

@injectable()
export default class PainelController {

    private readonly _provedorService:IProvedorServices;
    private readonly _tokenService: ITokenService;
    private readonly _painelService:IPainelServices;
    constructor(@inject("IProvedorServices")provedorServices:IProvedorServices, 
                @inject("ITokenService")tokenService:ITokenService,
                @inject("IPainelServices")paineService:IPainelServices
            ){
        this._provedorService = provedorServices;
        this._tokenService = tokenService;
        this._painelService = paineService;
    }

    async LoginPainel(req:Request, res:Response){
    
        const data = req.body as loginPainel;
        
        try {
            
            const token = await this._tokenService.TokenAcessoPainel(data);
    
            const retorno: retornoPadrao<tokenPainelDto> = {
                statusCode: 200,
                message: "Token retornado com sucesso.",
                data: token
            }
            return res.json(retorno);
            
        } catch (error) {

            const retorno: retornoPadrao<string> = {
                statusCode: 500,
                message: "Usuario ou Senha invalido.",
                data: ""
            }
            return res.json(retorno);
        }
    }

    async CadastrarProvedor(req: AuthRequest, res: Response){

        const data = req.body as cadastroProvedorDto;
        const provedor = await this._provedorService.Cadastrar(data);
        const token = await this._tokenService.TokenAcessoPainel({usuario: provedor.usuario, senha: provedor.senha as string, codigoProvedor: provedor?.codigo_provedor.toString()});
        
        const retorno: retornoPadrao<tokenPainelDto> = {
                statusCode: 200,
                message: "Token retornado com sucesso.",
                data: token
            }
            return res.json(retorno);
        return res.json(provedor)
    }
    
    async AtualizarProvedor(req: AuthRequest, res: Response){

        const data = req.body as cadastroProvedorModel;
        data.codigo_provedor = Number.parseInt(req.usuario?.codigoProvedor as string);
        
        const provedor = await this._provedorService.Atualizar(data);
        return res.json(provedor)
    }

    async ObterTema(req:AuthRequest, res:Response){
        
        const codigoProvedor = req.usuario?.codigoProvedor ?? req.params.codigoProvedor as string;

        const tema = await this._provedorService.ObterTema(codigoProvedor);

        return res.json({data: tema})
    }


    async GravarBanner(req:AuthRequest, res:Response){
        
        const data = req.body as bannerModel
        data.codigo_provedor_fk = Number.parseInt(req.usuario?.codigoProvedor as string);
        const anuncio = await this._painelService.GravarBanner(data);
        return res.status(200).json({data:anuncio})
    
    }

    async ObterBanner(req:AuthRequest, res:Response){
        
        const codigoProvedor = req.usuario?.codigoProvedor as string
        const banners = await this._painelService.ObterBanners(Number.parseInt(codigoProvedor));

        return res.json({data: banners})
    }

    async EditarBanner(req:AuthRequest, res:Response){
        
        const id = Number.parseInt(req.params.id as string);
        const data = req.body as bannerModel;
        const codigoProvedor = Number.parseInt(req.usuario?.codigoProvedor as string);
        data.codigo_provedor_fk = codigoProvedor;
        const banner = await this._painelService.EditarBanner(id, data);
        return res.status(201).json({data:banner})
    
    }

    async ExcluirBanner(req:AuthRequest, res:Response){
        
        const id = req.params.id as string;
        const codigoProvedor = Number.parseInt(req.usuario?.codigoProvedor as string);
        const banner = await this._painelService.ExcluiBanner(id, codigoProvedor);
        return res.status(201).json({data:banner})
    
    }

    async GravarAnuncio(req:AuthRequest, res:Response){
        
        const data = req.body as anuncioModel
        data.file = req.file;
        data.codigo_provedor_fk = Number.parseInt(req.usuario?.codigoProvedor as string);
        const anuncio = await this._painelService.GravarAnuncio(data);
        return res.status(200).json({data:anuncio})
    
    }

    async EditarAnuncio(req:AuthRequest, res:Response){
        
        const id = Number.parseInt(req.params.id as string);
        const data = req.body as anuncioEditeDto;
        data.file = req.file;
        const codigoProvedor = Number.parseInt(req.usuario?.codigoProvedor as string);
        data.codigo_provedor_fk = codigoProvedor;
        const anuncio = await this._painelService.EditarAnuncio(id, data);
        return res.status(201).json({data:anuncio})
    
    }

    async ExcluirAnuncio(req:AuthRequest, res:Response){
        
        const id = req.params.id as string;
        const codigoProvedor = Number.parseInt(req.usuario?.codigoProvedor as string);
        const anuncio = await this._painelService.ExcluirAnuncio(id, codigoProvedor);
        return res.status(201).json({data:anuncio})
    
    }   

    async ObterAnuncios(req:AuthRequest, res:Response){
        
        const codigoProvedor = req.usuario?.codigoProvedor ?? req.params.codigoProvedor as string;
        const anuncios = await this._provedorService.ObterAnuncios(codigoProvedor);

        return res.json({data: anuncios})
    }
    

    async ObterIndicacoes(req:AuthRequest, res:Response) : Promise<any> {

        const codigoProvedor = req. usuario?.codigoProvedor  as string;
        const result = await this._provedorService.ObterIndicacoes(codigoProvedor);
        return res.json(result);
    }   

    async AtualizarTema(req:AuthRequest, res:Response){
        
        const data = req.body as any
        const files = req.files as ThemeFiles
        
        data.codigo = Number.parseInt(req.usuario?.codigoProvedor ?? req.params.codigoProvedor as string);
        const result = await this._provedorService.AtualizarTema(data, files);
        
        return res.json({data: result})
    }

    async SalvarIndicacao(req:AuthRequest, res:Response){
        
        const data = req.body as indicacaoModel
        const result = await this._provedorService.SalvarIndicacao(data);
        
        return res.json({data: result})
    }

    async ObterAvaliacaoServico(req: AuthRequest, res: Response) {
        const codigoProvedor = req.usuario?.codigoProvedor as string;
        const avaliacoes = await this._provedorService.ObterAvaliacoesServico(codigoProvedor)
        return res.status(200).json(avaliacoes)
    }

    async ObterAvaliacaoApp(req: AuthRequest, res: Response) {
        const codigoProvedor = req.usuario?.codigoProvedor as string;
        const avaliacoes = await this._provedorService.ObterAvaliacoesApp(codigoProvedor)
        return res.status(200).json(avaliacoes)
    }

    // Ofertas são criadas/editadas pelo parceiro (ver ParceiroController) — aqui o
    // provedor só enxerga o catálogo e ativa/desativa pra própria base.
    async ObterCatalogoOfertas(req:AuthRequest, res:Response){

        const codigoProvedor = Number.parseInt(req.usuario?.codigoProvedor as string);
        const ofertas = await this._painelService.ObterCatalogoOfertas(codigoProvedor);
        return res.json({ data: ofertas });
    }

    async AtivarOferta(req:AuthRequest, res:Response){

        const id = Number.parseInt(req.params.id as string);
        const codigoProvedor = Number.parseInt(req.usuario?.codigoProvedor as string);
        const ativo = Boolean(req.body?.ativo);

        try {
            await this._painelService.AtivarOferta(id, codigoProvedor, ativo);
            return res.status(200).json({ data: { id, ativo } });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async GravarRecompensa(req:AuthRequest, res:Response){

        const data = req.body as recompensaModel
        data.codigo_provedor_fk = Number.parseInt(req.usuario?.codigoProvedor as string);
        const recompensa = await this._painelService.GravarRecompensa(data);
        return res.status(200).json({data:recompensa})
    }

    async EditarRecompensa(req:AuthRequest, res:Response){

        const id = Number.parseInt(req.params.id as string);
        const data = req.body as recompensaModel;
        data.codigo_provedor_fk = Number.parseInt(req.usuario?.codigoProvedor as string);
        const recompensa = await this._painelService.EditarRecompensa(id, data);
        return res.status(201).json({data:recompensa})
    }

    async ExcluirRecompensa(req:AuthRequest, res:Response){

        const id = req.params.id as string;
        const codigoProvedor = Number.parseInt(req.usuario?.codigoProvedor as string);
        const recompensa = await this._painelService.ExcluirRecompensa(id, codigoProvedor);
        return res.status(201).json({data:recompensa})
    }

    async ObterRecompensasPainel(req:AuthRequest, res:Response){

        const codigoProvedor = req.usuario?.codigoProvedor as string
        const recompensas = await this._painelService.ObterRecompensas(Number.parseInt(codigoProvedor));
        return res.json({data: recompensas})
    }

    async ObterMetricas(req:AuthRequest, res:Response){

        const codigoProvedor = req.usuario?.codigoProvedor as string
        const metricas = await this._painelService.ObterMetricas(Number.parseInt(codigoProvedor));

        return res.json({data: metricas})
    }

    async ObterModulosProprio(req:AuthRequest, res:Response){

        const codigoProvedor = req.usuario?.codigoProvedor as string
        const modulos = await this._painelService.ObterModulosAtivos(Number.parseInt(codigoProvedor));

        return res.json({data: modulos})
    }

    async ObterCompras(req:AuthRequest, res:Response){

        const codigoProvedor = req.usuario?.codigoProvedor as string
        const compras = await this._painelService.ObterCompras(Number.parseInt(codigoProvedor));

        return res.json({data: compras})
    }

    // ADMIN

    async LoginAdmin(req:Request, res:Response){

        const data = req.body as adminLoginDto;

        try {
            const token = await this._tokenService.TokenAcessoAdmin(data);
            return res.json({ data: { token } });
        } catch (error) {
            return res.status(401).json({ message: "Usuario ou senha invalido." });
        }
    }

    async ListarProvedoresAdmin(req:AuthRequest, res:Response){

        const provedores = await this._painelService.ListarProvedoresComModulos();
        return res.json({data: provedores})
    }

    async DefinirModuloAdmin(req:AuthRequest, res:Response){

        const codigoProvedor = Number.parseInt(req.params.codigoProvedor as string);
        const modulo = req.params.modulo as string;
        const ativo = Boolean(req.body?.ativo);

        await this._painelService.DefinirModulo(codigoProvedor, modulo, ativo);
        return res.status(200).json({data: { codigoProvedor, modulo, ativo }})
    }

    async DefinirStatusProvedorAdmin(req:AuthRequest, res:Response){

        const codigoProvedor = Number.parseInt(req.params.codigoProvedor as string);
        const status = req.body?.status as string;

        try {
            await this._painelService.DefinirStatusProvedor(codigoProvedor, status);
            return res.status(200).json({data: { codigoProvedor, status }})
        } catch (error: any) {
            return res.status(400).json({ message: error.message })
        }
    }

    async ObterConfigComissaoAdmin(req:AuthRequest, res:Response){

        const config = await this._painelService.ObterConfigComissao();
        return res.json({data: config})
    }

    async ObterRelatorioComprasAdmin(req:AuthRequest, res:Response){

        const relatorio = await this._painelService.ObterRelatorioComprasAdmin();
        return res.json({data: relatorio})
    }

    async DefinirConfigComissaoAdmin(req:AuthRequest, res:Response){

        const config = req.body as configComissaoModel;

        try {
            const atualizado = await this._painelService.DefinirConfigComissao(config);
            return res.status(200).json({data: atualizado})
        } catch (error: any) {
            return res.status(400).json({ message: error.message })
        }
    }

    async ObterConfigPontosAdmin(req:AuthRequest, res:Response){

        const config = await this._painelService.ObterConfigPontos();
        return res.json({data: config})
    }

    async DefinirConfigPontosAdmin(req:AuthRequest, res:Response){

        const config = req.body as configPontosModel;

        try {
            const atualizado = await this._painelService.DefinirConfigPontos(config);
            return res.status(200).json({data: atualizado})
        } catch (error: any) {
            return res.status(400).json({ message: error.message })
        }
    }

    // "Já paga em dia" — o provedor digita a quantidade e o motivo (ex.: "Pagamento em dia").
    async ConcederPontos(req:AuthRequest, res:Response){

        const codigoProvedor = Number.parseInt(req.usuario?.codigoProvedor as string);
        const { cliente_cpf_cnpj, cliente_nome, pontos, motivo } = req.body || {};

        try {
            const extrato = await this._painelService.ConcederPontosManual(
                codigoProvedor, cliente_cpf_cnpj, cliente_nome, Number.parseInt(pontos), motivo
            );
            return res.status(200).json({ data: extrato });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    // Marca a indicação como efetivada (o amigo indicado virou cliente de fato) e credita
    // os pontos padrão configurados automaticamente pro cliente que indicou.
    async MarcarIndicacaoEfetivada(req:AuthRequest, res:Response){

        const codigoProvedor = Number.parseInt(req.usuario?.codigoProvedor as string);
        const id = Number.parseInt(req.params.id as string);

        try {
            const resultado = await this._painelService.MarcarIndicacaoEfetivada(id, codigoProvedor);
            return res.status(200).json({ data: resultado });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async CriarParceiroAdmin(req:AuthRequest, res:Response){

        const data = req.body as parceiroModel;

        try {
            const parceiro = await this._painelService.CriarParceiro(data);
            return res.status(200).json({data: parceiro})
        } catch (error: any) {
            return res.status(400).json({ message: error.message })
        }
    }

    async ListarParceirosAdmin(req:AuthRequest, res:Response){

        const parceiros = await this._painelService.ListarParceiros();
        return res.json({data: parceiros})
    }

    async DefinirStatusParceiroAdmin(req:AuthRequest, res:Response){

        const id = Number.parseInt(req.params.id as string);
        const ativo = Boolean(req.body?.ativo);

        await this._painelService.DefinirStatusParceiro(id, ativo);
        return res.status(200).json({data: { id, ativo }})
    }

    async DefinirProvedorParceiroAdmin(req:AuthRequest, res:Response){

        const id = Number.parseInt(req.params.id as string);
        const codigoProvedorFk = req.body?.codigo_provedor_fk ? Number.parseInt(req.body.codigo_provedor_fk) : null;

        await this._painelService.DefinirProvedorParceiro(id, codigoProvedorFk);
        return res.status(200).json({data: { id, codigo_provedor_fk: codigoProvedorFk }})
    }

    async DefinirLocalizacaoParceiroAdmin(req:AuthRequest, res:Response){

        const id = Number.parseInt(req.params.id as string);
        const cidade = req.body?.cidade || null;
        const uf = req.body?.uf || null;

        await this._painelService.DefinirLocalizacaoParceiro(id, cidade, uf);
        return res.status(200).json({data: { id, cidade, uf }})
    }

    async DefinirContatoParceiroAdmin(req:AuthRequest, res:Response){

        const id = Number.parseInt(req.params.id as string);
        const endereco = req.body?.endereco || null;
        const contato = req.body?.contato || null;

        await this._painelService.DefinirContatoParceiro(id, endereco, contato);
        return res.status(200).json({data: { id, endereco, contato }})
    }

    async ValidarCompraAdmin(req:AuthRequest, res:Response){

        const idCompra = Number.parseInt(req.params.id as string);

        try {
            const compra = await this._painelService.ValidarCompraAdmin(idCompra);
            return res.status(200).json({data: compra})
        } catch (error: any) {
            return res.status(400).json({ message: error.message })
        }
    }

    // FATURAMENTO SYNK (mensalidade que o provedor paga pra Synk)

    async ObterFaturamentoProvedor(req:AuthRequest, res:Response){

        const codigoProvedor = Number.parseInt(req.usuario?.codigoProvedor as string);

        try {
            const faturamento = await this._painelService.ObterFaturamentoProvedor(codigoProvedor);
            return res.json({data: faturamento})
        } catch (error: any) {
            return res.status(400).json({ message: error.message })
        }
    }

    async ListarFaturamentoAdmin(req:AuthRequest, res:Response){

        const lista = await this._painelService.ListarFaturamentoTodos();
        return res.json({data: lista})
    }

    async ConfigurarAssinaturaAdmin(req:AuthRequest, res:Response){

        const codigoProvedor = Number.parseInt(req.params.codigoProvedor as string);
        const valorMensalidade = Number.parseFloat(req.body?.valor_mensalidade);
        const dataAdesao = req.body?.data_adesao as string;

        try {
            const assinatura = await this._painelService.CriarOuEditarAssinatura(codigoProvedor, valorMensalidade, dataAdesao);
            return res.status(200).json({data: assinatura})
        } catch (error: any) {
            return res.status(400).json({ message: error.message })
        }
    }

    async MarcarFaturaPagaAdmin(req:AuthRequest, res:Response){

        const id = Number.parseInt(req.params.id as string);

        try {
            const fatura = await this._painelService.MarcarFaturaPaga(id);
            return res.status(200).json({data: fatura})
        } catch (error: any) {
            return res.status(400).json({ message: error.message })
        }
    }

    async MarcarFaturaCanceladaAdmin(req:AuthRequest, res:Response){

        const id = Number.parseInt(req.params.id as string);

        try {
            const fatura = await this._painelService.MarcarFaturaCancelada(id);
            return res.status(200).json({data: fatura})
        } catch (error: any) {
            return res.status(400).json({ message: error.message })
        }
    }

    async ObterReciboAdmin(req:AuthRequest, res:Response){

        const id = Number.parseInt(req.params.id as string);

        try {
            const recibo = await this._painelService.ObterRecibo(id);
            return res.json({data: recibo})
        } catch (error: any) {
            return res.status(400).json({ message: error.message })
        }
    }

    async ObterConfigPixAdmin(req:AuthRequest, res:Response){

        const config = await this._painelService.ObterConfigPix();
        return res.json({data: config})
    }

    async DefinirConfigPixAdmin(req:AuthRequest, res:Response){

        const config = req.body as pixConfigModel;

        try {
            const atualizado = await this._painelService.DefinirConfigPix(config);
            return res.status(200).json({data: atualizado})
        } catch (error: any) {
            return res.status(400).json({ message: error.message })
        }
    }

}