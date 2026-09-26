import { describe, it, expect, vi } from "vitest";
import ReceitaNetFaturaProvider from "../ReceitaNetFaturaProvider";
import { SessaoErp } from "../../../../core/contracts/SessaoErp";

function criarServicoFalso() {
    return {
        ObterFaturas: vi.fn().mockResolvedValue([{ id: 1, valor: 99.9 }]),
    };
}

describe("ReceitaNetFaturaProvider", () => {
    const sessao: SessaoErp = { gerenciador: "RECEITANET", token: "tok-123" };

    it("listar() usa o token da sessão, não codigoProvedor/contratoId", async () => {
        const servico = criarServicoFalso();
        const provider = new ReceitaNetFaturaProvider(servico as any);

        const resultado = await provider.listar(sessao);

        expect(servico.ObterFaturas).toHaveBeenCalledWith("tok-123");
        expect(resultado).toHaveLength(1);
    });
});
