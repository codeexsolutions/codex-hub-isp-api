import { inject, injectable } from "tsyringe";
import IFaturaProvider from "../../../core/contracts/fatura/IFaturaProvider";
import ReceitaNetFaturaProvider from "./ReceitaNetFaturaProvider";
import IxcFaturaProvider from "./IxcFaturaProvider";
import MkAuthFaturaProvider from "./MkAuthFaturaProvider";
import { eGerenciador } from "../../../common/enuns/egerenciador";

@injectable()
export default class FaturaProviderFactory {

    private readonly _receitaNetProvider: IFaturaProvider;
    private readonly _ixcProvider: IFaturaProvider;
    private readonly _mkAuthProvider: IFaturaProvider;

    constructor(
        @inject(ReceitaNetFaturaProvider) receitaNetProvider: ReceitaNetFaturaProvider,
        @inject(IxcFaturaProvider) ixcProvider: IxcFaturaProvider,
        @inject(MkAuthFaturaProvider) mkAuthProvider: MkAuthFaturaProvider
    ) {
        this._receitaNetProvider = receitaNetProvider;
        this._ixcProvider = ixcProvider;
        this._mkAuthProvider = mkAuthProvider;
    }

    criar(gerenciador: string | undefined): IFaturaProvider {
        if (gerenciador === eGerenciador.IXCSOFT.toString()) {
            return this._ixcProvider;
        }
        if (gerenciador === eGerenciador.MKAUTH.toString()) {
            return this._mkAuthProvider;
        }
        return this._receitaNetProvider;
    }
}
