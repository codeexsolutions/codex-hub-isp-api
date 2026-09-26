import { describe, it, expect, vi } from "vitest";
import IxcSoftServices from "../IxcSoftServices";

function criarService(overrides: any = {}) {
    const apiIxcSoft = {
        ObterClientePorCpfCnpj: vi.fn().mockResolvedValue({ registros: [{ id: 123, ativo: "S" }] }),
        ObterContratoPorIdCliente: vi.fn().mockResolvedValue({ registros: [{ id: 9, status: "A" }] }),
        ObterLogin: vi.fn().mockResolvedValue({ registros: [{ id: 4709 }] }),
        AtualizarLogin: vi.fn().mockResolvedValue({ type: "success" }),
        ...overrides.apiIxcSoft,
    };
    return { service: new IxcSoftServices(apiIxcSoft, {} as any, {} as any), apiIxcSoft };
}

describe("IxcSoftServices.AlterarSenhaWifi", () => {

    it("resolve cliente -> contrato ativo -> login e chama AtualizarLogin com os dados do wifi", async () => {
        const { service, apiIxcSoft } = criarService();

        await service.AlterarSenhaWifi("111.222.333-44", "2", { ssidWifi: "MinhaCasa", senhaWifi: "senha12345" });

        expect(apiIxcSoft.ObterContratoPorIdCliente).toHaveBeenCalledWith(123, "2");
        expect(apiIxcSoft.ObterLogin).toHaveBeenCalledWith("2", 9);
        expect(apiIxcSoft.AtualizarLogin).toHaveBeenCalledWith(4709, { ssidWifi: "MinhaCasa", senhaWifi: "senha12345" }, "2");
    });

    it("lança erro quando não encontra contrato ativo", async () => {
        const { service } = criarService({ apiIxcSoft: { ObterContratoPorIdCliente: vi.fn().mockResolvedValue({ registros: [] }) } });

        await expect(service.AlterarSenhaWifi("111.222.333-44", "2", { senhaWifi: "x" })).rejects.toThrow("Contrato ativo não encontrado.");
    });

    it("lança erro quando não encontra o login (radusuarios) do contrato", async () => {
        const { service } = criarService({ apiIxcSoft: { ObterLogin: vi.fn().mockResolvedValue({ registros: [] }) } });

        await expect(service.AlterarSenhaWifi("111.222.333-44", "2", { senhaWifi: "x" })).rejects.toThrow("Login (conexão) não encontrado");
    });
});
