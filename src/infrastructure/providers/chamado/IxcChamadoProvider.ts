import { inject, injectable } from "tsyringe";
import IChamadoProvider, { abrirChamadoDados, sessaoChamado } from "../../../core/contracts/chamado/IChamadoProvider";
import IIxcSoftServices from "../../../application/interfaces/IIxcSoftServices";

// Adapter — traduz o contrato IChamadoProvider pra chamadas do IXC.
// A mensagem completa (assunto + descrição) é montada aqui, não no
// controller — é detalhe de como o IXC representa um chamado, não regra
// de negócio do Synk.
@injectable()
export default class IxcChamadoProvider implements IChamadoProvider {

    private readonly _ixcSoftService: IIxcSoftServices;

    constructor(@inject("IIxcSoftServices") ixcSoftService: IIxcSoftServices) {
        this._ixcSoftService = ixcSoftService;
    }

    async listar(sessao: sessaoChamado) {
        return await this._ixcSoftService.ObterChamados(sessao.cpfCnpj as string, sessao.codigoProvedor as string);
    }

    async abrir(sessao: sessaoChamado, dados: abrirChamadoDados) {
        const mensagem = `Assunto: ${dados.assunto}\nDescrição: ${dados.descricao}`;
        return await this._ixcSoftService.AbrirNovoChamado(
            sessao.cpfCnpj as string,
            sessao.codigoProvedor as string,
            dados.idAssunto as number,
            mensagem
        );
    }

    async enviarMensagem(sessao: sessaoChamado, idChamado: number, mensagem: string) {
        await this._ixcSoftService.EnviarMensagemChamado(idChamado, sessao.codigoProvedor as string, mensagem);
    }

    async obterMensagens(sessao: sessaoChamado, idChamado: number) {
        return await this._ixcSoftService.ObterMensagensChamado(idChamado, sessao.codigoProvedor as string);
    }
}
