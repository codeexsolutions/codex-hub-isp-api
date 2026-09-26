import { inject, injectable } from "tsyringe";
import IFaturaProvider from "../../../core/contracts/fatura/IFaturaProvider";
import { SessaoErp } from "../../../core/contracts/SessaoErp";
import IIxcSoftServices from "../../../application/interfaces/IIxcSoftServices";

@injectable()
export default class IxcFaturaProvider implements IFaturaProvider {

    private readonly _ixcSoftService: IIxcSoftServices;

    constructor(@inject("IIxcSoftServices") ixcSoftService: IIxcSoftServices) {
        this._ixcSoftService = ixcSoftService;
    }

    async listar(sessao: SessaoErp) {
        // No IXC, faturas são buscadas por contrato, não por CPF — o nome do
        // parâmetro na interface (cpf) é só herança de outro método; na prática
        // é o idContrato mesmo (ver IxcSoftServices.ObterFaturas).
        return await this._ixcSoftService.ObterFaturas(String(sessao.contratoId), sessao.codigoProvedor as string);
    }
}
