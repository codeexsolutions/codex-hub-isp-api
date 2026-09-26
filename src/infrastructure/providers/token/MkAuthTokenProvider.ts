import { inject, injectable } from "tsyringe";
import ITokenProvider from "../../../core/contracts/token/ITokenProvider";
import Provedor from "../../../core/domains/Provedor";
import { tokenDto } from "../../../application/Dtos/tokenDto";
import IApiMkAuthService from "../../apis/mkauth/interfaces/IApiMkAuthService";

@injectable()
export default class MkAuthTokenProvider implements ITokenProvider {

    private readonly _apiMkAuth: IApiMkAuthService;

    constructor(@inject("IApiMkAuthService") apiMkAuth: IApiMkAuthService) {
        this._apiMkAuth = apiMkAuth;
    }

    async obterToken(provedor: Provedor, codigoProvedor: string, cpf: string | undefined, base: tokenDto): Promise<tokenDto> {
        const token = await this._apiMkAuth.Token(provedor, cpf);
        base.token = token;
        return base;
    }

    async tokenPorContrato(provedor: Provedor, codigoProvedor: string, cpf: string, idContrato: string, base: tokenDto): Promise<tokenDto> {
        const token = await this._apiMkAuth.TokenPorContrato(provedor, cpf, idContrato);
        base.token = token;
        base.cpfCnpj = cpf;
        base.contratoId = Number.parseInt(idContrato);
        return base;
    }
}
