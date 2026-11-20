import { inject, injectable } from "tsyringe";
import ILinkTesteIptvServices from "../interfaces/ILinkTesteIptvServices";
import ILinkTesteIptvRepository from "../../core/interfaces/ILinkTesteIptvRepository";
import { linkTesteIptvModel } from "../../core/models/linkTesteIptvModel";

@injectable()
export default class LinkTesteIptvServices implements ILinkTesteIptvServices {

    private readonly _linkTesteIptvRepository: ILinkTesteIptvRepository;

    constructor(@inject("ILinkTesteIptvRepository") linkTesteIptvRepository: ILinkTesteIptvRepository) {
        this._linkTesteIptvRepository = linkTesteIptvRepository;
    }

    async Listar(): Promise<linkTesteIptvModel[]> {
        return await this._linkTesteIptvRepository.Listar();
    }

    async Criar(rotulo: string, url: string): Promise<linkTesteIptvModel> {
        if (!rotulo?.trim() || !url?.trim())
            throw new Error("Informe rótulo e URL.");
        if (!/^https?:\/\//i.test(url.trim()))
            throw new Error("URL inválida — precisa começar com http:// ou https://.");

        return await this._linkTesteIptvRepository.Criar(rotulo.trim(), url.trim());
    }

    async DefinirPadrao(id: number): Promise<linkTesteIptvModel> {
        return await this._linkTesteIptvRepository.DefinirPadrao(id);
    }
}
