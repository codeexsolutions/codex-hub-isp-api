import { inject, injectable } from "tsyringe";
import IClienteProvider from "../../../core/contracts/cliente/IClienteProvider";
import ReceitaNetClienteProvider from "./ReceitaNetClienteProvider";
import IxcClienteProvider from "./IxcClienteProvider";
import MkAuthClienteProvider from "./MkAuthClienteProvider";
import SgpClienteProvider from "./SgpClienteProvider";
import { eGerenciador } from "../../../common/enuns/egerenciador";

@injectable()
export default class ClienteProviderFactory {

    private readonly _receitaNetProvider: IClienteProvider;
    private readonly _ixcProvider: IClienteProvider;
    private readonly _mkAuthProvider: IClienteProvider;
    private readonly _sgpProvider: IClienteProvider;

    constructor(
        @inject(ReceitaNetClienteProvider) receitaNetProvider: ReceitaNetClienteProvider,
        @inject(IxcClienteProvider) ixcProvider: IxcClienteProvider,
        @inject(MkAuthClienteProvider) mkAuthProvider: MkAuthClienteProvider,
        @inject(SgpClienteProvider) sgpProvider: SgpClienteProvider
    ) {
        this._receitaNetProvider = receitaNetProvider;
        this._ixcProvider = ixcProvider;
        this._mkAuthProvider = mkAuthProvider;
        this._sgpProvider = sgpProvider;
    }

    criar(gerenciador: string | undefined): IClienteProvider {
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
