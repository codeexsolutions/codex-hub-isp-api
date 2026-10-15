import { inject, injectable } from "tsyringe";
import IChamadoProvider, { abrirChamadoDados, sessaoChamado } from "../../../core/contracts/chamado/IChamadoProvider";
import IApiSgpService from "../../apis/sgp/interfaces/IApiSgpService";

// Adapter SGP — mesma forma dos adapters IXC/ReceitaNet/MK-Auth, mas delega
// pro stub ApiSgpService (ver esse arquivo): lança erro claro até a
// integração real ser implementada. Fica plugado nas rotas/factory desde já
// pra não sobrar nenhuma outra mudança pendente quando a API real entrar.
@injectable()
export default class SgpChamadoProvider implements IChamadoProvider {

    private readonly _apiSgp: IApiSgpService;

    constructor(@inject("IApiSgpService") apiSgp: IApiSgpService) {
        this._apiSgp = apiSgp;
    }

    async listar(sessao: sessaoChamado) {
        return await this._apiSgp.ObterChamados(sessao.codigoProvedor as string, sessao.cpfCnpj as string);
    }

    async abrir(sessao: sessaoChamado, dados: abrirChamadoDados) {
        return await this._apiSgp.AbrirChamado(sessao.codigoProvedor as string, sessao.cpfCnpj as string, dados);
    }

    async enviarMensagem(sessao: sessaoChamado, idChamado: number, mensagem: string) {
        await this._apiSgp.EnviarRespostaChamado(sessao.codigoProvedor as string, idChamado, mensagem);
    }

    async obterMensagens(sessao: sessaoChamado, idChamado: number) {
        return await this._apiSgp.RespostasDoChamado(sessao.codigoProvedor as string, idChamado);
    }
}
