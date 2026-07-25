import { inject, injectable } from "tsyringe";
import IProvedorServices from "../../application/interfaces/IProvedorServices";
import ProvedorServices from "../../application/services/ProvedorServices";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/IAuthRequest";
import { cadastroProvedorDto } from "../../application/Dtos/cadastroProvedorDto";
import { cadastroProvedorModel } from "../../core/models/cadastroProvevedorModel";
import { indicacaoModel } from "../../core/models/indicacaoModel";
import { avaliacaoModel } from "../../core/models/avaliacaoModel";
import { ThemeFiles } from "../../application/Dtos/temaFiles.dto";


@injectable()
export default class ProvedorController{

    private readonly _provedorService:IProvedorServices;

    constructor(@inject("IProvedorServices")provedorServices:IProvedorServices){
        this._provedorService = provedorServices;
    }

    async Cadastrar(req: Request, res: Response){
        const data = req.body as cadastroProvedorDto;
        const provedor = await this._provedorService.Cadastrar(data);
        return res.json(provedor)
    }

    async Atualizar(req: AuthRequest, res: Response){
        const data = req.body as cadastroProvedorModel;
        data.codigo_provedor = Number.parseInt(req.usuario?.codigoProvedor as string);
        
        const provedor = await this._provedorService.Atualizar(data);
        return res.json(provedor)
    }

    async ObterProvedorPorCodigo(req:Request, res:Response){

        const codigoProvedor = req.params.codigo as string;
        const provedor = await this._provedorService.ObterProvedor(codigoProvedor);

        return res.json(provedor)

    }

    async ObterTema(req:AuthRequest, res:Response){
        
        const codigoProvedor = req.usuario?.codigoProvedor ?? req.params.codigoProvedor as string;

        const tema = await this._provedorService.ObterTema(codigoProvedor);

        return res.json({data: tema})
    }

    async ObterBanner(req:AuthRequest, res:Response){
        
        const codigoProvedor = req.usuario?.codigoProvedor ?? req.params.codigoProvedor as string;
        const banners = await this._provedorService.ObterBanners(codigoProvedor);

        return res.json({data: banners})
    }

    async ObterAnuncios(req:AuthRequest, res:Response){
        
        const codigoProvedor = req.params.codigoProvedor as string
        const banners = await this._provedorService.ObterAnuncios(codigoProvedor);

        return res.json({data: banners})
    } 

    async AvaliarApp(req: Request, res: Response){

        const avaliacao = req.body as avaliacaoModel
        const result = await this._provedorService.AvaliarApp(avaliacao);
        return res.status(200).json(result)
    }

    async AvaliarServico(req: Request, res: Response){

        const avaliacao = req.body as avaliacaoModel
        const result = await this._provedorService.AvaliarServico(avaliacao);
        return res.status(200).json(result)
    }

    async ObterManifest(req: AuthRequest, res: Response){
         
        const codigoProvedor = req.usuario?.codigoProvedor ?? req.params.codigoProvedor as string;

        const manifest = await this._provedorService.ObterManifest(codigoProvedor);

        return res.type("application/manifest+json")
            .json(manifest);
    }

    // PAINEL

    async AtualizarTema(req:AuthRequest, res:Response){
        
        const data = req.body
        const files = req.files as ThemeFiles
        data.codigo_provedor_fk = Number.parseInt(req.usuario?.codigoProvedor ?? req.params.codigoProvedor as string);
        
        const result = await this._provedorService.AtualizarTema(data, files);
        return res.json({data: result})
    }

    async SalvarIndicacao(req:AuthRequest, res:Response){
        const data = req.body as indicacaoModel
        const result = await this._provedorService.SalvarIndicacao(data);
        return res.status(200).json({data: result})
    }


}