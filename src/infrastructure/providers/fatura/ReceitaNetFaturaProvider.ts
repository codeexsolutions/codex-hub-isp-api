import { inject, injectable } from "tsyringe";
import IFaturaProvider from "../../../core/contracts/fatura/IFaturaProvider";
import { SessaoErp } from "../../../core/contracts/SessaoErp";
import IReceitanetServices from "../../../application/interfaces/IReceitanetServicest";

@injectable()
export default class ReceitaNetFaturaProvider implements IFaturaProvider {

    private readonly _receitaNetService: IReceitanetServices;

    constructor(@inject("IReceitanetServices") receitaNetService: IReceitanetServices) {
        this._receitaNetService = receitaNetService;
    }

    async listar(sessao: SessaoErp) {
        return await this._receitaNetService.ObterFaturas(sessao.token as string);
    }
}
