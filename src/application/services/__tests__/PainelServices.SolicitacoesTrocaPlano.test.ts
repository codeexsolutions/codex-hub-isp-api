import { describe, it, expect, vi } from "vitest";
import PainelService from "../PainelServices";

function criarService(painelRepoOverrides: any = {}) {
    const painelRepo = {
        ListarSolicitacoesTrocaPlano: vi.fn().mockResolvedValue([{ id: 1, status: "pendente" }]),
        AtualizarStatusSolicitacaoTrocaPlano: vi.fn().mockResolvedValue({ id: 1, status: "atendida" }),
        ...painelRepoOverrides,
    };
    const provedorRepo = {};
    const ixcSoftServices = {};
    return { service: new PainelService(painelRepo as any, provedorRepo as any, ixcSoftServices as any), painelRepo };
}

describe("PainelServices — solicitações de troca de plano", () => {

    it("ListarSolicitacoesTrocaPlano delega pro repositório", async () => {
        const { service, painelRepo } = criarService();

        const resultado = await service.ListarSolicitacoesTrocaPlano(5);

        expect(painelRepo.ListarSolicitacoesTrocaPlano).toHaveBeenCalledWith(5);
        expect(resultado).toEqual([{ id: 1, status: "pendente" }]);
    });

    it("AtualizarStatusSolicitacaoTrocaPlano aceita status válido", async () => {
        const { service, painelRepo } = criarService();

        const resultado = await service.AtualizarStatusSolicitacaoTrocaPlano(1, 5, "atendida");

        expect(painelRepo.AtualizarStatusSolicitacaoTrocaPlano).toHaveBeenCalledWith(1, 5, "atendida");
        expect(resultado.status).toBe("atendida");
    });

    it("AtualizarStatusSolicitacaoTrocaPlano rejeita status inválido sem chamar o repositório", async () => {
        const { service, painelRepo } = criarService();

        await expect(service.AtualizarStatusSolicitacaoTrocaPlano(1, 5, "aprovado")).rejects.toThrow("Status inválido.");
        expect(painelRepo.AtualizarStatusSolicitacaoTrocaPlano).not.toHaveBeenCalled();
    });
});
