import { describe, it, expect, vi } from "vitest";
import IxcClienteProvider from "../IxcClienteProvider";
import { SessaoErp } from "../../../../core/contracts/SessaoErp";

function criarServicoFalso() {
    return {
        ObterDadosCliente: vi.fn().mockResolvedValue({ dadosCadastrais: { nome: "Fulano" } }),
    };
}

describe("IxcClienteProvider", () => {
    const sessao: SessaoErp = { gerenciador: "IXCSOFT", cpfCnpj: "000.000.000-00", codigoProvedor: "5", contratoId: 7 };

    it("obterDados() usa cpfCnpj + codigoProvedor + contratoId, não o token", async () => {
        const servico = criarServicoFalso();
        const provider = new IxcClienteProvider(servico as any);

        await provider.obterDados(sessao);

        expect(servico.ObterDadosCliente).toHaveBeenCalledWith("000.000.000-00", "5", 7);
    });

    it("repassa null quando o contrato está inativo", async () => {
        const servico = { ObterDadosCliente: vi.fn().mockResolvedValue(null) };
        const provider = new IxcClienteProvider(servico as any);

        const resultado = await provider.obterDados(sessao);

        expect(resultado).toBeNull();
    });
});
