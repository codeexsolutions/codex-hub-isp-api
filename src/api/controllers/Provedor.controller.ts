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

    async ObterBeneficios(req:AuthRequest, res:Response){

        const codigoProvedor = req.params.codigoProvedor as string
        const beneficios = await this._provedorService.ObterBeneficios(codigoProvedor);

        return res.json({data: beneficios})
    }

    async ObterModulos(req:Request, res:Response){

        const codigoProvedor = req.params.codigoProvedor as string
        const modulos = await this._provedorService.ObterModulosAtivos(codigoProvedor);

        return res.json({data: modulos})
    }

    async RegistrarCliqueBeneficio(req:Request, res:Response){

        const idBeneficio = Number.parseInt(req.params.id as string);
        const codigoProvedor = Number.parseInt(req.body?.codigoProvedor as string);

        await this._provedorService.RegistrarCliqueBeneficio(idBeneficio, codigoProvedor);

        return res.status(200).json({ data: true });
    }

    async ComprarBeneficio(req:Request, res:Response){

        const idBeneficio = Number.parseInt(req.params.id as string);
        const { codigoProvedor, clienteNome, clienteCpfCnpj } = req.body || {};

        try {
            const compra = await this._provedorService.ComprarBeneficio(
                idBeneficio, Number.parseInt(codigoProvedor), clienteNome, clienteCpfCnpj
            );
            return res.status(200).json({ data: compra });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async ObterMinhasCompras(req:Request, res:Response){

        const codigoProvedor = req.params.codigoProvedor as string;
        const cpfCnpj = req.query.cpfCnpj as string;

        const compras = await this._provedorService.ObterMinhasCompras(codigoProvedor, cpfCnpj);

        return res.json({ data: compras });
    }

    async ObterMeusPontos(req:Request, res:Response){

        const codigoProvedor = req.params.codigoProvedor as string;
        const cpfCnpj = req.query.cpfCnpj as string;

        const pontos = await this._provedorService.ObterMeusPontos(codigoProvedor, cpfCnpj);

        return res.json({ data: pontos });
    }

    async ObterRecompensas(req:Request, res:Response){

        const codigoProvedor = req.params.codigoProvedor as string;
        const recompensas = await this._provedorService.ObterRecompensas(codigoProvedor);

        return res.json({ data: recompensas });
    }

    async ResgatarRecompensa(req:Request, res:Response){

        const { codigoProvedor, cpfCnpj, clienteNome, recompensaId } = req.body || {};

        try {
            const resgate = await this._provedorService.ResgatarRecompensa(codigoProvedor, cpfCnpj, clienteNome, Number.parseInt(recompensaId));
            return res.status(200).json({ data: resgate });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async ListarParceirosAtivos(req:Request, res:Response){

        const codigoProvedor = req.params.codigoProvedor as string;
        const parceiros = await this._provedorService.ListarParceirosAtivos(codigoProvedor);
        return res.json({ data: parceiros });
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