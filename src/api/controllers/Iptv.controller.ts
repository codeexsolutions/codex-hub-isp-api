import { inject, injectable } from "tsyringe";
import { Request, Response } from "express";
import IPainelServices from "../../application/interfaces/IPainelService";

@injectable()
export default class IptvController {

    private readonly _painelService:IPainelServices;

    constructor(@inject("IPainelServices")painelService:IPainelServices){
        this._painelService = painelService;
    }

    // Público — usado pelo app de TV pra preencher o servidor quando o
    // cliente não digita um na tela de login.
    async ObterUrlPadrao(req:Request, res:Response){

        const config = await this._painelService.ObterConfigIptv();
        return res.json({ data: { urlPadrao: config?.url_padrao ?? "" } });
    }
}
