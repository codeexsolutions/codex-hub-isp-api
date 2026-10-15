import { inject, injectable } from "tsyringe";
import IClienteProvider from "../../../core/contracts/cliente/IClienteProvider";
import { SessaoErp } from "../../../core/contracts/SessaoErp";
import IApiSgpService from "../../apis/sgp/interfaces/IApiSgpService";

@injectable()
export default class SgpClienteProvider implements IClienteProvider {

    private readonly _apiSgp: IApiSgpService;

    constructor(@inject("IApiSgpService") apiSgp: IApiSgpService) {
        this._apiSgp = apiSgp;
    }

    async obterDados(sessao: SessaoErp) {
        return await this._apiSgp.ObterDadosCliente(sessao.codigoProvedor as string, sessao.cpfCnpj as string, sessao.contratoId);
    }
}
