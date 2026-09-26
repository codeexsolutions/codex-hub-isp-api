import { inject, injectable } from "tsyringe";
import IChamadoProvider, { abrirChamadoDados, sessaoChamado } from "../../../core/contracts/chamado/IChamadoProvider";
import IApiMkAuthService from "../../apis/mkauth/interfaces/IApiMkAuthService";

// Adapter MK-Auth — mesma forma dos adapters IXC/ReceitaNet, mas delega pro
// stub ApiMkAuthService (ver esse arquivo): lança erro claro até a
// integração real ser implementada. Fica plugado nas rotas/factory desde já
// pra não sobrar nenhuma outra mudança pendente quando a API real entrar.
@injectable()
export default class MkAuthChamadoProvider implements IChamadoProvider {

    private readonly _apiMkAuth: IApiMkAuthService;

    constructor(@inject("IApiMkAuthService") apiMkAuth: IApiMkAuthService) {
        this._apiMkAuth = apiMkAuth;
    }

    async listar(sessao: sessaoChamado) {
        return await this._apiMkAuth.ObterChamados(sessao.codigoProvedor as string, sessao.cpfCnpj as string);
    }

    async abrir(sessao: sessaoChamado, dados: abrirChamadoDados) {
        return await this._apiMkAuth.AbrirChamado(sessao.codigoProvedor as string, sessao.cpfCnpj as string, dados);
    }

    async enviarMensagem(sessao: sessaoChamado, idChamado: number, mensagem: string) {
        await this._apiMkAuth.EnviarRespostaChamado(sessao.codigoProvedor as string, idChamado, mensagem);
    }

    async obterMensagens(sessao: sessaoChamado, idChamado: number) {
        return await this._apiMkAuth.RespostasDoChamado(sessao.codigoProvedor as string, idChamado);
    }
}
