import { describe, it, expect, vi } from "vitest";
import ReceitaNetClienteProvider from "../ReceitaNetClienteProvider";
import { SessaoErp } from "../../../../core/contracts/SessaoErp";

function criarServicoFalso() {
    return {
        ObterDadosCliente: vi.fn().mockResolvedValue({ dadosCadastrais: { nome: "Fulano" } }),
    };
}

describe("ReceitaNetClienteProvider", () => {
    const sessao: SessaoErp = { gerenciador: "RECEITANET", token: "tok-123" };

    it("obterDados() usa o token da sessão, não cpfCnpj/codigoProvedor/contratoId", async () => {
        const servico = criarServicoFalso();
        const provider = new ReceitaNetClienteProvider(servico as any);

        const resultado = await provider.obterDados(sessao);

        expect(servico.ObterDadosCliente).toHaveBeenCalledWith("tok-123");
        expect(resultado.dadosCadastrais.nome).toBe("Fulano");
    });
});
