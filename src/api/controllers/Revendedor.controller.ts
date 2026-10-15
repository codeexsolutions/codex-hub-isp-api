import { inject, injectable } from "tsyringe";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/IAuthRequest";
import IRevendedorServices from "../../application/interfaces/IRevendedorServices";

@injectable()
export default class RevendedorController {

    private readonly _revendedorService:IRevendedorServices;

    constructor(@inject("IRevendedorServices") revendedorService:IRevendedorServices){
        this._revendedorService = revendedorService;
    }

    async Login(req:Request, res:Response){

        const { usuario, senha } = req.body || {};

        try {
            const token = await this._revendedorService.Login(usuario, senha);
            return res.json({ data: { token } });
        } catch (error: any) {
            return res.status(401).json({ message: error.message || "Usuário ou senha inválido" });
        }
    }

    async ListarMinhasLicencas(req:AuthRequest, res:Response){

        const revendedorId = Number.parseInt(req.usuario?.revendedorId as string);
        const licencas = await this._revendedorService.ListarMinhasLicencas(revendedorId);
        return res.json({ data: licencas });
    }

    async CriarLicenca(req:AuthRequest, res:Response){

        const revendedorId = Number.parseInt(req.usuario?.revendedorId as string);
        const { nome, telefone } = req.body || {};

        try {
            const licenca = await this._revendedorService.CriarLicenca(revendedorId, nome, telefone);
            return res.status(201).json({ data: licenca });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async AprovarLicenca(req:AuthRequest, res:Response){

        const revendedorId = Number.parseInt(req.usuario?.revendedorId as string);
        const id = Number.parseInt(req.params.id as string);

        try {
            const licenca = await this._revendedorService.AprovarLicenca(id, revendedorId);
            return res.json({ data: licenca });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async CancelarLicenca(req:AuthRequest, res:Response){

        const revendedorId = Number.parseInt(req.usuario?.revendedorId as string);
        const id = Number.parseInt(req.params.id as string);

        try {
            const licenca = await this._revendedorService.CancelarLicenca(id, revendedorId);
            return res.json({ data: licenca });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async DefinirLinkPagamentoLista(req:AuthRequest, res:Response){

        const revendedorId = Number.parseInt(req.usuario?.revendedorId as string);
        const id = Number.parseInt(req.params.id as string);
        const { link } = req.body || {};

        try {
            const licenca = await this._revendedorService.DefinirLinkPagamentoLista(id, revendedorId, link ?? null);
            return res.json({ data: licenca });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }
}
