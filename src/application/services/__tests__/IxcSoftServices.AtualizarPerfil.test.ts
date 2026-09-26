import { describe, it, expect, vi } from "vitest";
import IxcSoftServices from "../IxcSoftServices";

function criarService(overrides: Partial<{ apiIxcSoft: any }> = {}) {
    const apiIxcSoft = overrides.apiIxcSoft ?? {
        ObterClientePorCpfCnpj: vi.fn().mockResolvedValue({ registros: [{ id: 123, ativo: "S" }] }),
        AtualizarCliente: vi.fn().mockResolvedValue({ type: "success" }),
    };
    const provedorRepo = {};
    const painelRepo = {};
    return { service: new IxcSoftServices(apiIxcSoft, provedorRepo as any, painelRepo as any), apiIxcSoft };
}

describe("IxcSoftServices.AtualizarPerfil", () => {

    it("resolve cliente.id pelo CPF e delega pra AtualizarCliente", async () => {
        const { service, apiIxcSoft } = criarService();

        await service.AtualizarPerfil("111.222.333-44", "2", { email: "novo@teste.com" });

        expect(apiIxcSoft.ObterClientePorCpfCnpj).toHaveBeenCalledWith("111.222.333-44", "2");
        expect(apiIxcSoft.AtualizarCliente).toHaveBeenCalledWith(123, { email: "novo@teste.com" }, "2");
    });

    it("lança erro claro quando não encontra cliente ativo com esse CPF", async () => {
        const apiIxcSoft = {
            ObterClientePorCpfCnpj: vi.fn().mockResolvedValue({ registros: [] }),
            AtualizarCliente: vi.fn(),
        };
        const { service } = criarService({ apiIxcSoft });

        await expect(service.AtualizarPerfil("000.000.000-00", "2", { email: "x" })).rejects.toThrow("Cliente não encontrado no IXC.");
        expect(apiIxcSoft.AtualizarCliente).not.toHaveBeenCalled();
    });
});
