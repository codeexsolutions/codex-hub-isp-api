import { inject, injectable } from "tsyringe";
import IFaturaProvider from "../../../core/contracts/fatura/IFaturaProvider";
import { SessaoErp } from "../../../core/contracts/SessaoErp";
import IApiSgpService from "../../apis/sgp/interfaces/IApiSgpService";

@injectable()
export default class SgpFaturaProvider implements IFaturaProvider {

    private readonly _apiSgp: IApiSgpService;

    constructor(@inject("IApiSgpService") apiSgp: IApiSgpService) {
        this._apiSgp = apiSgp;
    }

    async listar(sessao: SessaoErp) {
        return await this._apiSgp.ObterFaturas(sessao.codigoProvedor as string, sessao.cpfCnpj ?? String(sessao.contratoId));
    }
}
