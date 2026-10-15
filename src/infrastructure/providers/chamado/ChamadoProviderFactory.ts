import { inject, injectable } from "tsyringe";
import IChamadoProvider from "../../../core/contracts/chamado/IChamadoProvider";
import ReceitaNetChamadoProvider from "./ReceitaNetChamadoProvider";
import IxcChamadoProvider from "./IxcChamadoProvider";
import MkAuthChamadoProvider from "./MkAuthChamadoProvider";
import SgpChamadoProvider from "./SgpChamadoProvider";
import { eGerenciador } from "../../../common/enuns/egerenciador";

// Único lugar do sistema que sabe "qual gerenciador vira qual Provider".
// Chamado.controller.ts (e qualquer outro lugar que precisar) nunca mais
// precisa checar `gerenciador === "IXCSOFT"` na mão — só pede o Provider
// certo aqui e usa o contrato.
@injectable()
export default class ChamadoProviderFactory {

    private readonly _receitaNetProvider: IChamadoProvider;
    private readonly _ixcProvider: IChamadoProvider;
    private readonly _mkAuthProvider: IChamadoProvider;
    private readonly _sgpProvider: IChamadoProvider;

    constructor(
        @inject(ReceitaNetChamadoProvider) receitaNetProvider: ReceitaNetChamadoProvider,
        @inject(IxcChamadoProvider) ixcProvider: IxcChamadoProvider,
        @inject(MkAuthChamadoProvider) mkAuthProvider: MkAuthChamadoProvider,
        @inject(SgpChamadoProvider) sgpProvider: SgpChamadoProvider
    ) {
        this._receitaNetProvider = receitaNetProvider;
        this._ixcProvider = ixcProvider;
        this._mkAuthProvider = mkAuthProvider;
        this._sgpProvider = sgpProvider;
    }

    criar(gerenciador: string | undefined): IChamadoProvider {
        // Mantém o comportamento de hoje: qualquer coisa que não seja
        // "IXCSOFT"/"MKAUTH"/"SGP" explicitamente cai no ReceitaNet (era o
        // "else" implícito no controller antigo).
        if (gerenciador === eGerenciador.IXCSOFT.toString()) {
            return this._ixcProvider;
        }
        if (gerenciador === eGerenciador.MKAUTH.toString()) {
            return this._mkAuthProvider;
        }
        if (gerenciador === eGerenciador.SGP.toString()) {
            return this._sgpProvider;
        }
        return this._receitaNetProvider;
    }
}
