import { inject, injectable } from "tsyringe";
import { Request, Response } from "express";
import ILinkTesteIptvServices from "../../application/interfaces/ILinkTesteIptvServices";

@injectable()
export default class LinkTesteIptvController {

    private readonly _linkTesteIptvService: ILinkTesteIptvServices;

    constructor(@inject("ILinkTesteIptvServices") linkTesteIptvService: ILinkTesteIptvServices) {
        this._linkTesteIptvService = linkTesteIptvService;
    }

    async Listar(req: Request, res: Response) {
        const links = await this._linkTesteIptvService.Listar();
        return res.json({ data: links });
    }

    async Criar(req: Request, res: Response) {
        const { rotulo, url } = req.body || {};

        try {
            const link = await this._linkTesteIptvService.Criar(rotulo, url);
            return res.status(201).json({ data: link });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async DefinirPadrao(req: Request, res: Response) {
        const id = Number.parseInt(req.params.id as string);

        try {
            const link = await this._linkTesteIptvService.DefinirPadrao(id);
            return res.json({ data: link });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }
}
