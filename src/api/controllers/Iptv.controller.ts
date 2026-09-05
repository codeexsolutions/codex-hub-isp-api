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
    // cliente não digita um na tela de login. Sem código de provedor, cai
    // direto no padrão do admin (cliente avulso).
    async ObterUrlPadrao(req:Request, res:Response){

        const urlPadrao = await this._painelService.ObterUrlPadraoIptv();
        return res.json({ data: { urlPadrao } });
    }

    // Público — mesma coisa, mas prioriza o DNS próprio do provedor (se ele
    // tiver informado um no painel) antes de cair pro padrão do admin.
    async ObterUrlPadraoDoProvedor(req:Request, res:Response){

        const codigoProvedor = req.params.codigoProvedor as string;
        const urlPadrao = await this._painelService.ObterUrlPadraoIptv(codigoProvedor);
        return res.json({ data: { urlPadrao } });
    }
}
