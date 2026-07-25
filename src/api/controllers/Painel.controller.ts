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
        data.codigo_provedor_fk = Number.parseInt(req.usuario?.codigoProvedor as string);
        const anuncio = await this._painelService.GravarAnuncio(data);
        return res.status(200).json({data:anuncio})
    
    }

    async EditarAnuncio(req:AuthRequest, res:Response){
        
        const id = Number.parseInt(req.params.id as string);
        const data = req.body as anuncioModel;
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
        
        const data = req.body as themeModel
        const files = req.files as ThemeFiles
        
        data.codigo_provedor_fk = Number.parseInt(req.usuario?.codigoProvedor ?? req.params.codigoProvedor as string);
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

}