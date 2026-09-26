import { inject, injectable } from "tsyringe";
import IClienteProvider from "../../../core/contracts/cliente/IClienteProvider";
import { SessaoErp } from "../../../core/contracts/SessaoErp";
import IReceitanetServices from "../../../application/interfaces/IReceitanetServicest";

@injectable()
export default class ReceitaNetClienteProvider implements IClienteProvider {

    private readonly _receitaNetService: IReceitanetServices;

    constructor(@inject("IReceitanetServices") receitaNetService: IReceitanetServices) {
        this._receitaNetService = receitaNetService;
    }

    async obterDados(sessao: SessaoErp) {
        return await this._receitaNetService.ObterDadosCliente(sessao.token as string);
    }
}
