import { describe, it, expect, vi } from "vitest";
import IxcChamadoProvider from "../IxcChamadoProvider";
import { sessaoChamado } from "../../../../core/contracts/chamado/IChamadoProvider";

function criarServicoFalso() {
    return {
        ObterChamados: vi.fn().mockResolvedValue([]),
        AbrirNovoChamado: vi.fn().mockResolvedValue(99),
        EnviarMensagemChamado: vi.fn().mockResolvedValue(undefined),
        ObterMensagensChamado: vi.fn().mockResolvedValue([]),
    };
}

describe("IxcChamadoProvider", () => {
    const sessao: sessaoChamado = { gerenciador: "IXCSOFT", cpfCnpj: "000.000.000-00", codigoProvedor: "5" };

    it("listar() usa cpfCnpj + codigoProvedor, não o token", async () => {
        const servico = criarServicoFalso();
        const provider = new IxcChamadoProvider(servico as any);

        await provider.listar(sessao);

        expect(servico.ObterChamados).toHaveBeenCalledWith("000.000.000-00", "5");
    });

    it("abrir() monta a mensagem (assunto + descrição) e passa o idAssunto", async () => {
        const servico = criarServicoFalso();
        const provider = new IxcChamadoProvider(servico as any);

        await provider.abrir(sessao, { assunto: "Financeiro", descricao: "Fatura errada", idAssunto: 3 });

        expect(servico.AbrirNovoChamado).toHaveBeenCalledWith(
            "000.000.000-00",
            "5",
            3,
            "Assunto: Financeiro\nDescrição: Fatura errada"
        );
    });

    it("enviarMensagem() usa codigoProvedor da sessão, não o token", async () => {
        const servico = criarServicoFalso();
        const provider = new IxcChamadoProvider(servico as any);

        await provider.enviarMensagem(sessao, 10, "oi");

        expect(servico.EnviarMensagemChamado).toHaveBeenCalledWith(10, "5", "oi");
    });
});
