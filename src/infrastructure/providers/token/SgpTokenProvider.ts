import { inject, injectable } from "tsyringe";
import ITokenProvider from "../../../core/contracts/token/ITokenProvider";
import Provedor from "../../../core/domains/Provedor";
import { tokenDto } from "../../../application/Dtos/tokenDto";
import IApiSgpService from "../../apis/sgp/interfaces/IApiSgpService";

@injectable()
export default class SgpTokenProvider implements ITokenProvider {

    private readonly _apiSgp: IApiSgpService;

    constructor(@inject("IApiSgpService") apiSgp: IApiSgpService) {
        this._apiSgp = apiSgp;
    }

    async obterToken(provedor: Provedor, codigoProvedor: string, cpf: string | undefined, base: tokenDto): Promise<tokenDto> {
        const token = await this._apiSgp.Token(provedor, cpf);
        base.token = token;
        return base;
    }

    async tokenPorContrato(provedor: Provedor, codigoProvedor: string, cpf: string, idContrato: string, base: tokenDto): Promise<tokenDto> {
        const token = await this._apiSgp.TokenPorContrato(provedor, cpf, idContrato);
        base.token = token;
        base.cpfCnpj = cpf;
        base.contratoId = Number.parseInt(idContrato);
        return base;
    }
}
