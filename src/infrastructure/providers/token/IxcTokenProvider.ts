import { inject, injectable } from "tsyringe";
import ITokenProvider from "../../../core/contracts/token/ITokenProvider";
import Provedor from "../../../core/domains/Provedor";
import { tokenDto } from "../../../application/Dtos/tokenDto";
import IApiIxcSoftService from "../../apis/ixcsoft/interfaces/IApiIxcSoftService";

@injectable()
export default class IxcTokenProvider implements ITokenProvider {

    private readonly _apiIxcSoft: IApiIxcSoftService;

    constructor(@inject("IApiIxcSoftService") apiIxcSoft: IApiIxcSoftService) {
        this._apiIxcSoft = apiIxcSoft;
    }

    async obterToken(provedor: Provedor, codigoProvedor: string, cpf: string | undefined, base: tokenDto): Promise<tokenDto> {

        const token = this._apiIxcSoft.Token(provedor);
        base.token = token;
        base.nome = "";
        base.isContrassenha = false;
        return base;
    }

    async tokenPorContrato(provedor: Provedor, codigoProvedor: string, cpf: string, idContrato: string, base: tokenDto): Promise<tokenDto> {

        base.cpfCnpj = cpf;
        const token = this._apiIxcSoft.Token(provedor);
        base.token = token;
        base.nome = "";
        base.isContrassenha = false;
        base.multiploCadastro = false;
        base.contratoId = Number.parseInt(idContrato);
        return base;
    }
}
