import { inject, injectable } from "tsyringe";
import { Request, Response } from "express";
import IPainelServices from "../../application/interfaces/IPainelService";

@injectable()
export default class ServidorParceiroController {

    private readonly _painelService:IPainelServices;

    constructor(@inject("IPainelServices")painelService:IPainelServices){
        this._painelService = painelService;
    }

    // Público — a tela "Veio por uma revenda IPTV" do app chama isso antes
    // do login: se o código for válido, já mostra a URL do servidor e o
    // cliente só digita usuário/senha do Xtream.
    async Validar(req:Request, res:Response){
        try {
            const resultado = await this._painelService.ValidarServidorParceiro(req.params.codigo as string);
            return res.json({ data: resultado });
        } catch (error:any) {
            return res.status(400).json({ statusCode: 400, message: error.message, data: error.message });
        }
    }
}
