import { describe, it, expect, vi } from "vitest";
import ReceitaNetChamadoProvider from "../ReceitaNetChamadoProvider";
import { sessaoChamado } from "../../../../core/contracts/chamado/IChamadoProvider";

function criarServicoFalso() {
    return {
        ObterChamados: vi.fn().mockResolvedValue([{ id: 1, protocolo: "P1", descricao: "d", status: "Aberto", respostasStatus: 0 }]),
        AbrirNovoChamado: vi.fn().mockResolvedValue(42),
        EnviarRespostaChamado: vi.fn().mockResolvedValue("Mensagem Enviada."),
        RespostasDoChamado: vi.fn().mockResolvedValue([{ id: 1, mensagem: "oi" }]),
    };
}

describe("ReceitaNetChamadoProvider", () => {
    const sessao: sessaoChamado = { gerenciador: "RECEITANET", token: "tok-123" };

    it("listar() usa o token da sessão, não cpfCnpj/codigoProvedor", async () => {
        const servico = criarServicoFalso();
        const provider = new ReceitaNetChamadoProvider(servico as any);

        const resultado = await provider.listar(sessao);

        expect(servico.ObterChamados).toHaveBeenCalledWith("tok-123");
        expect(resultado).toHaveLength(1);
    });

    it("abrir() encaminha o token e os dados do chamado sem alterar", async () => {
        const servico = criarServicoFalso();
        const provider = new ReceitaNetChamadoProvider(servico as any);
        const dados = { assunto: "Sem sinal", descricao: "Internet caiu", categoria: "Técnico" };

        const id = await provider.abrir(sessao, dados);

        expect(servico.AbrirNovoChamado).toHaveBeenCalledWith("tok-123", dados);
        expect(id).toBe(42);
    });

    it("enviarMensagem() usa o token da sessão", async () => {
        const servico = criarServicoFalso();
        const provider = new ReceitaNetChamadoProvider(servico as any);

        await provider.enviarMensagem(sessao, 7, "olá");

        expect(servico.EnviarRespostaChamado).toHaveBeenCalledWith("tok-123", 7, "olá");
    });

    it("obterMensagens() usa o token da sessão", async () => {
        const servico = criarServicoFalso();
        const provider = new ReceitaNetChamadoProvider(servico as any);

        const respostas = await provider.obterMensagens(sessao, 7);

        expect(servico.RespostasDoChamado).toHaveBeenCalledWith("tok-123", 7);
        expect(respostas).toHaveLength(1);
    });
});
