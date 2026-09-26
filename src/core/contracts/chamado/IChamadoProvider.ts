import { chamadoDto } from "../../../application/Dtos/chamadoDto";
import { SessaoErp } from "../SessaoErp";

// Contrato único de chamado — a Application (Chamado.controller.ts) só
// conhece isso, nunca IXC ou ReceitaNet diretamente.
export type sessaoChamado = SessaoErp;

export type abrirChamadoDados = {
    assunto: string;
    categoria?: string;
    descricao: string;
    idAssunto?: number;
};

export default interface IChamadoProvider {
    listar(sessao: sessaoChamado): Promise<chamadoDto[]>;
    abrir(sessao: sessaoChamado, dados: abrirChamadoDados): Promise<number>;
    enviarMensagem(sessao: sessaoChamado, idChamado: number, mensagem: string): Promise<void>;
    obterMensagens(sessao: sessaoChamado, idChamado: number): Promise<any[]>;
}
