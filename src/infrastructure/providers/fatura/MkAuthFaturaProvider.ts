import { inject, injectable } from "tsyringe";
import IFaturaProvider from "../../../core/contracts/fatura/IFaturaProvider";
import { SessaoErp } from "../../../core/contracts/SessaoErp";
import IApiMkAuthService from "../../apis/mkauth/interfaces/IApiMkAuthService";

@injectable()
export default class MkAuthFaturaProvider implements IFaturaProvider {

    private readonly _apiMkAuth: IApiMkAuthService;

    constructor(@inject("IApiMkAuthService") apiMkAuth: IApiMkAuthService) {
        this._apiMkAuth = apiMkAuth;
    }

    async listar(sessao: SessaoErp) {
        return await this._apiMkAuth.ObterFaturas(sessao.codigoProvedor as string, sessao.cpfCnpj ?? String(sessao.contratoId));
    }
}
