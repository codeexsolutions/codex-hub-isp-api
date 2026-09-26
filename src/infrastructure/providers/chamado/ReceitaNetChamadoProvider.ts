import { inject, injectable } from "tsyringe";
import IChamadoProvider, { abrirChamadoDados, sessaoChamado } from "../../../core/contracts/chamado/IChamadoProvider";
import IReceitanetServices from "../../../application/interfaces/IReceitanetServicest";

// Adapter — traduz o contrato IChamadoProvider pra chamadas do ReceitaNet.
// Não duplica lógica: só encaminha pro IReceitanetServices já existente
// (autenticação, mapeamento de resposta etc. continuam lá).
@injectable()
export default class ReceitaNetChamadoProvider implements IChamadoProvider {

    private readonly _receitaNetService: IReceitanetServices;

    constructor(@inject("IReceitanetServices") receitaNetService: IReceitanetServices) {
        this._receitaNetService = receitaNetService;
    }

    async listar(sessao: sessaoChamado) {
        return await this._receitaNetService.ObterChamados(sessao.token as string);
    }

    async abrir(sessao: sessaoChamado, dados: abrirChamadoDados) {
        return await this._receitaNetService.AbrirNovoChamado(sessao.token as string, dados as any);
    }

    async enviarMensagem(sessao: sessaoChamado, idChamado: number, mensagem: string) {
        await this._receitaNetService.EnviarRespostaChamado(sessao.token as string, idChamado, mensagem);
    }

    async obterMensagens(sessao: sessaoChamado, idChamado: number) {
        return await this._receitaNetService.RespostasDoChamado(sessao.token as string, idChamado);
    }
}
