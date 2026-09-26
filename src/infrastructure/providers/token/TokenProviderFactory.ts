import { inject, injectable } from "tsyringe";
import ITokenProvider from "../../../core/contracts/token/ITokenProvider";
import ReceitaNetTokenProvider from "./ReceitaNetTokenProvider";
import IxcTokenProvider from "./IxcTokenProvider";
import MkAuthTokenProvider from "./MkAuthTokenProvider";
import { eGerenciador } from "../../../common/enuns/egerenciador";

@injectable()
export default class TokenProviderFactory {

    private readonly _receitaNetProvider: ITokenProvider;
    private readonly _ixcProvider: ITokenProvider;
    private readonly _mkAuthProvider: ITokenProvider;

    constructor(
        @inject(ReceitaNetTokenProvider) receitaNetProvider: ReceitaNetTokenProvider,
        @inject(IxcTokenProvider) ixcProvider: IxcTokenProvider,
        @inject(MkAuthTokenProvider) mkAuthProvider: MkAuthTokenProvider
    ) {
        this._receitaNetProvider = receitaNetProvider;
        this._ixcProvider = ixcProvider;
        this._mkAuthProvider = mkAuthProvider;
    }

    criar(gerenciador: string | undefined): ITokenProvider {
        if (gerenciador === eGerenciador.IXCSOFT.toString()) {
            return this._ixcProvider;
        }
        if (gerenciador === eGerenciador.MKAUTH.toString()) {
            return this._mkAuthProvider;
        }
        return this._receitaNetProvider;
    }
}
