import { describe, it, expect, vi } from "vitest";
import ProvedorServices from "../ProvedorServices";

function criarService(overrides: Partial<{ provedorRepo: any; notificacaoPainel: any }> = {}) {
    const provedorRepo = overrides.provedorRepo ?? {
        ObterModulosAtivos: vi.fn().mockResolvedValue(["landpage"]),
        ObterPlanoInternetAtivoPorId: vi.fn().mockResolvedValue({ id: 5, nome: "300 MEGA", valor: 129.9 }),
        CriarSolicitacaoTrocaPlano: vi.fn().mockResolvedValue({ id: 1, status: "pendente" }),
    };
    const notificacaoPainel = overrides.notificacaoPainel ?? { Avisar: vi.fn().mockResolvedValue(undefined) };
    const notificacaoParceiro: any = { Avisar: vi.fn().mockResolvedValue(undefined) };
    return { service: new ProvedorServices(provedorRepo, notificacaoPainel, notificacaoParceiro), provedorRepo, notificacaoPainel };
}

describe("ProvedorServices.SolicitarTrocaPlanoInternet", () => {

    it("cria a solicitação e avisa o provedor quando o módulo landpage está ativo e o plano existe", async () => {
        const { service, provedorRepo, notificacaoPainel } = criarService();

        const resultado = await service.SolicitarTrocaPlanoInternet("5", 5, "111.222.333-44", "Fulano");

        expect(provedorRepo.CriarSolicitacaoTrocaPlano).toHaveBeenCalledWith("5", { id: 5, nome: "300 MEGA", valor: 129.9 }, "111.222.333-44", "Fulano");
        expect(resultado).toEqual({ id: 1, status: "pendente" });
        expect(notificacaoPainel.Avisar).toHaveBeenCalledWith("5", "troca_plano", expect.any(String), expect.stringContaining("300 MEGA"));
    });

    it("lança erro quando o módulo landpage não está ativo", async () => {
        const { service } = criarService({ provedorRepo: { ObterModulosAtivos: vi.fn().mockResolvedValue([]) } });

        await expect(service.SolicitarTrocaPlanoInternet("5", 5, "111.222.333-44", "Fulano")).rejects.toThrow("Vitrine de Planos não está ativa para este provedor.");
    });

    it("lança erro quando o plano não existe/não está ativo pra esse provedor", async () => {
        const provedorRepo = {
            ObterModulosAtivos: vi.fn().mockResolvedValue(["landpage"]),
            ObterPlanoInternetAtivoPorId: vi.fn().mockResolvedValue(null),
            CriarSolicitacaoTrocaPlano: vi.fn(),
        };
        const { service } = criarService({ provedorRepo });

        await expect(service.SolicitarTrocaPlanoInternet("5", 999, "111.222.333-44", "Fulano")).rejects.toThrow("Plano não encontrado.");
        expect(provedorRepo.CriarSolicitacaoTrocaPlano).not.toHaveBeenCalled();
    });

    it("lança erro quando falta CPF/CNPJ", async () => {
        const { service } = criarService();

        await expect(service.SolicitarTrocaPlanoInternet("5", 5, "  ", "Fulano")).rejects.toThrow("Dados do cliente incompletos.");
    });
});
