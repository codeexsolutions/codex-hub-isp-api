import { describe, it, expect, vi } from "vitest";
import IxcSoftServices from "../IxcSoftServices";

function criarService(overrides: any = {}) {
    const apiIxcSoft = {
        ObterClientePorCpfCnpj: vi.fn().mockResolvedValue({ registros: [{ id: 123, ativo: "S" }] }),
        ObterContratoPorIdCliente: vi.fn().mockResolvedValue({ registros: [{ id: 9, status: "A" }] }),
        ObterFibraPorContrato: vi.fn().mockResolvedValue({ registros: [{ id: 55 }] }),
        ReiniciarOnu: vi.fn().mockResolvedValue({ type: "success" }),
        ...overrides.apiIxcSoft,
    };
    const painelRepo = {
        ObterIxcContratoConfig: vi.fn().mockResolvedValue({ resource_imprimir: null, resource_reboot_onu: "radpop_radio_cliente_fibra_26379" }),
        ...overrides.painelRepo,
    };
    return { service: new IxcSoftServices(apiIxcSoft, {} as any, painelRepo as any), apiIxcSoft, painelRepo };
}

describe("IxcSoftServices.ReiniciarRoteador", () => {

    it("resolve cliente -> contrato ativo -> ONU e chama ReiniciarOnu com o resource configurado", async () => {
        const { service, apiIxcSoft } = criarService();

        await service.ReiniciarRoteador("111.222.333-44", "2");

        expect(apiIxcSoft.ObterContratoPorIdCliente).toHaveBeenCalledWith(123, "2");
        expect(apiIxcSoft.ObterFibraPorContrato).toHaveBeenCalledWith(9, "2");
        expect(apiIxcSoft.ReiniciarOnu).toHaveBeenCalledWith(55, "radpop_radio_cliente_fibra_26379", "2");
    });

    it("lança erro claro quando o provedor não configurou o botão Reboot ONU", async () => {
        const { service, apiIxcSoft } = criarService({ painelRepo: { ObterIxcContratoConfig: vi.fn().mockResolvedValue({ resource_imprimir: null, resource_reboot_onu: null }) } });

        await expect(service.ReiniciarRoteador("111.222.333-44", "2")).rejects.toThrow("ainda não foi configurado");
        expect(apiIxcSoft.ObterClientePorCpfCnpj).not.toHaveBeenCalled();
    });

    it("lança erro quando não encontra contrato ativo", async () => {
        const { service } = criarService({ apiIxcSoft: { ObterContratoPorIdCliente: vi.fn().mockResolvedValue({ registros: [] }) } });

        await expect(service.ReiniciarRoteador("111.222.333-44", "2")).rejects.toThrow("Contrato ativo não encontrado.");
    });

    it("lança erro quando não encontra o equipamento (ONU) do contrato", async () => {
        const { service } = criarService({ apiIxcSoft: { ObterFibraPorContrato: vi.fn().mockResolvedValue({ registros: [] }) } });

        await expect(service.ReiniciarRoteador("111.222.333-44", "2")).rejects.toThrow("Equipamento (ONU) não encontrado");
    });
});
