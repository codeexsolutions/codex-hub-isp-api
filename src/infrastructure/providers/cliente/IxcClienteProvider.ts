import { inject, injectable } from "tsyringe";
import IClienteProvider from "../../../core/contracts/cliente/IClienteProvider";
import { SessaoErp } from "../../../core/contracts/SessaoErp";
import IIxcSoftServices from "../../../application/interfaces/IIxcSoftServices";

@injectable()
export default class IxcClienteProvider implements IClienteProvider {

    private readonly _ixcSoftService: IIxcSoftServices;

    constructor(@inject("IIxcSoftServices") ixcSoftService: IIxcSoftServices) {
        this._ixcSoftService = ixcSoftService;
    }

    async obterDados(sessao: SessaoErp) {
        return await this._ixcSoftService.ObterDadosCliente(sessao.cpfCnpj as string, sessao.codigoProvedor as string, sessao.contratoId as number);
    }
}
