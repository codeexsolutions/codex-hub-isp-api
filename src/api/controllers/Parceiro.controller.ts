import { inject, injectable } from "tsyringe";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/IAuthRequest";
import IParceiroServices from "../../application/interfaces/IParceiroServices";

@injectable()
export default class ParceiroController {

    private readonly _parceiroService:IParceiroServices;

    constructor(@inject("IParceiroServices") parceiroService:IParceiroServices){
        this._parceiroService = parceiroService;
    }

    async Login(req:Request, res:Response){

        const { usuario, senha } = req.body || {};

        try {
            const token = await this._parceiroService.Login(usuario, senha);
            return res.json({ data: { token } });
        } catch (error: any) {
            return res.status(401).json({ message: error.message || "Usuário ou senha inválido" });
        }
    }

    async ObterFinanceiro(req:AuthRequest, res:Response){

        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        const financeiro = await this._parceiroService.ObterFinanceiro(parceiroId);
        return res.json({ data: financeiro });
    }

    async ObterCupom(req:AuthRequest, res:Response){

        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        const cupom = req.params.codigo as string;

        try {
            const compra = await this._parceiroService.ObterCupom(cupom, parceiroId);
            return res.json({ data: compra });
        } catch (error: any) {
            return res.status(404).json({ message: error.message });
        }
    }

    async ValidarCupom(req:AuthRequest, res:Response){

        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        const cupom = req.params.codigo as string;

        try {
            const compra = await this._parceiroService.ValidarCupom(cupom, parceiroId);
            return res.json({ data: compra });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async CancelarCupom(req:AuthRequest, res:Response){

        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        const cupom = req.params.codigo as string;

        try {
            const compra = await this._parceiroService.CancelarCupom(cupom, parceiroId);
            return res.json({ data: compra });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }
}
