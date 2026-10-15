import { inject, injectable } from "tsyringe";
import ITokenProvider from "../../../core/contracts/token/ITokenProvider";
import ReceitaNetTokenProvider from "./ReceitaNetTokenProvider";
import IxcTokenProvider from "./IxcTokenProvider";
import MkAuthTokenProvider from "./MkAuthTokenProvider";
import SgpTokenProvider from "./SgpTokenProvider";
import { eGerenciador } from "../../../common/enuns/egerenciador";

@injectable()
export default class TokenProviderFactory {

    private readonly _receitaNetProvider: ITokenProvider;
    private readonly _ixcProvider: ITokenProvider;
    private readonly _mkAuthProvider: ITokenProvider;
    private readonly _sgpProvider: ITokenProvider;

    constructor(
        @inject(ReceitaNetTokenProvider) receitaNetProvider: ReceitaNetTokenProvider,
        @inject(IxcTokenProvider) ixcProvider: IxcTokenProvider,
        @inject(MkAuthTokenProvider) mkAuthProvider: MkAuthTokenProvider,
        @inject(SgpTokenProvider) sgpProvider: SgpTokenProvider
    ) {
        this._receitaNetProvider = receitaNetProvider;
        this._ixcProvider = ixcProvider;
        this._mkAuthProvider = mkAuthProvider;
        this._sgpProvider = sgpProvider;
    }

    criar(gerenciador: string | undefined): ITokenProvider {
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
