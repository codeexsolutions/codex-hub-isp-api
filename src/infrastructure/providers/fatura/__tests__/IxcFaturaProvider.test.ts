import { describe, it, expect, vi } from "vitest";
import IxcFaturaProvider from "../IxcFaturaProvider";
import { SessaoErp } from "../../../../core/contracts/SessaoErp";

function criarServicoFalso() {
    return {
        ObterFaturas: vi.fn().mockResolvedValue([{ id: 1, valor: 149.9 }]),
    };
}

describe("IxcFaturaProvider", () => {
    // No IXC as faturas são buscadas por contrato, não por CPF — mesmo que o
    // nome do parâmetro na interface real seja "cpf" (herdado de outro
    // método), o que a implementação usa é o idContrato.
    const sessao: SessaoErp = { gerenciador: "IXCSOFT", contratoId: 7, codigoProvedor: "5" };

    it("listar() usa contratoId + codigoProvedor da sessão, não o token", async () => {
        const servico = criarServicoFalso();
        const provider = new IxcFaturaProvider(servico as any);

        const resultado = await provider.listar(sessao);

        expect(servico.ObterFaturas).toHaveBeenCalledWith("7", "5");
        expect(resultado).toHaveLength(1);
    });
});
