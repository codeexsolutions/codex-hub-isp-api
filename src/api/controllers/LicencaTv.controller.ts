import { inject, injectable } from "tsyringe";
import { Request, Response } from "express";
import IPainelServices from "../../application/interfaces/IPainelService";

@injectable()
export default class LicencaTvController {

    private readonly _painelService:IPainelServices;

    constructor(@inject("IPainelServices")painelService:IPainelServices){
        this._painelService = painelService;
    }

    // Público — usado pelo app de TV na venda avulsa (sem provedor). Gera uma
    // licença "pendente" com PIX pra pagar.
    async Solicitar(req:Request, res:Response){
        try {
            const { nome, telefone } = req.body;
            const resultado = await this._painelService.SolicitarLicencaTv(nome, telefone);
            return res.status(201).json({ data: resultado });
        } catch (error:any) {
            return res.status(400).json({ statusCode: 400, message: error.message, data: error.message });
        }
    }

    // Público — o app consulta periodicamente pra saber se o admin já
    // aprovou o pagamento, ou pra reativar a licença em outro aparelho.
    async ObterStatus(req:Request, res:Response){
        try {
            const resultado = await this._painelService.ObterStatusLicencaTv(req.params.chave as string);
            return res.json({ data: resultado });
        } catch (error:any) {
            return res.status(404).json({ statusCode: 404, message: error.message, data: error.message });
        }
    }
}
