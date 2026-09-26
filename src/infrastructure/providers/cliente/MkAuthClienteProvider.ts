import { inject, injectable } from "tsyringe";
import IClienteProvider from "../../../core/contracts/cliente/IClienteProvider";
import { SessaoErp } from "../../../core/contracts/SessaoErp";
import IApiMkAuthService from "../../apis/mkauth/interfaces/IApiMkAuthService";

@injectable()
export default class MkAuthClienteProvider implements IClienteProvider {

    private readonly _apiMkAuth: IApiMkAuthService;

    constructor(@inject("IApiMkAuthService") apiMkAuth: IApiMkAuthService) {
        this._apiMkAuth = apiMkAuth;
    }

    async obterDados(sessao: SessaoErp) {
        return await this._apiMkAuth.ObterDadosCliente(sessao.codigoProvedor as string, sessao.cpfCnpj as string, sessao.contratoId);
    }
}
