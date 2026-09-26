import { describe, it, expect, vi } from "vitest";
import TokenService from "../TokenService";
import Provedor from "../../../core/domains/Provedor";
import { estatus } from "../../../common/enuns/estatus";
import { eGerenciador } from "../../../common/enuns/egerenciador";
import TokenProviderFactory from "../../../infrastructure/providers/token/TokenProviderFactory";

// TokenService agora só orquestra (busca o provedor, checa status, monta o
// tokenDto base) e delega pro TokenProviderFactory — o comportamento
// específico de cada ERP tem testes próprios em
// infrastructure/providers/token/__tests__. Aqui testamos só a orquestração.

function criarProvedor(gerenciador: eGerenciador, status: estatus = estatus.ATIVO) {
    return new Provedor("Empresa", "Fantasia", 5, status, gerenciador, 1, "chave", "Admin", "00000000000", "", "user", "senha");
}

function criarFactoryFalsa(providerFalso: any) {
    return { criar: vi.fn().mockReturnValue(providerFalso) } as unknown as TokenProviderFactory;
}

describe("TokenService.ObterToken", () => {

    it("provedor inativo: devolve provedorAtivo=false e token vazio, sem chamar a factory de providers", async () => {
        const provedor = criarProvedor(eGerenciador.IXCSOFT, estatus.INATIVO);
        const provedorRepo = { ObterProvedor: vi.fn().mockResolvedValue(provedor) };
        const factory = criarFactoryFalsa({});
        const service = new TokenService(provedorRepo as any, factory);

        const resultado = await service.ObterToken("5", "cpf");

        expect(resultado.provedorAtivo).toBe(false);
        expect(resultado.token).toBe("");
        expect(factory.criar).not.toHaveBeenCalled();
    });

    it("provedor ativo: pede o provider certo pra factory e devolve o que ele retornar", async () => {
        const provedor = criarProvedor(eGerenciador.IXCSOFT, estatus.ATIVO);
        const provedorRepo = { ObterProvedor: vi.fn().mockResolvedValue(provedor) };
        const providerFalso = { obterToken: vi.fn().mockResolvedValue({ gerenciador: "IXCSOFT", codigoProvedor: 5, token: "tok-123" }) };
        const factory = criarFactoryFalsa(providerFalso);
        const service = new TokenService(provedorRepo as any, factory);

        const resultado = await service.ObterToken("5", "cpf");

        expect(factory.criar).toHaveBeenCalledWith(eGerenciador.IXCSOFT);
        expect(providerFalso.obterToken).toHaveBeenCalledWith(
            provedor, "5", "cpf",
            expect.objectContaining({ gerenciador: eGerenciador.IXCSOFT, codigoProvedor: 5, provedorAtivo: true })
        );
        expect(resultado.token).toBe("tok-123");
    });

    it("provedor não encontrado: lança erro", async () => {
        const provedorRepo = { ObterProvedor: vi.fn().mockResolvedValue(null) };
        const factory = criarFactoryFalsa({});
        const service = new TokenService(provedorRepo as any, factory);

        await expect(service.ObterToken("5", "cpf")).rejects.toThrow("Provedor não encontrado.");
    });
});

describe("TokenService.TokenPorContrato", () => {

    it("delega pro provider certo, passando codigoProvedor/cpf/idContrato/base", async () => {
        const provedor = criarProvedor(eGerenciador.RECEITANET);
        const provedorRepo = { ObterProvedor: vi.fn().mockResolvedValue(provedor) };
        const providerFalso = { tokenPorContrato: vi.fn().mockResolvedValue({ gerenciador: "RECEITANET", codigoProvedor: 5, token: "tok-ctr" }) };
        const factory = criarFactoryFalsa(providerFalso);
        const service = new TokenService(provedorRepo as any, factory);

        const resultado = await service.TokenPorContrato("5", "cpf", "9");

        expect(factory.criar).toHaveBeenCalledWith(eGerenciador.RECEITANET);
        expect(providerFalso.tokenPorContrato).toHaveBeenCalledWith(provedor, "5", "cpf", "9", expect.objectContaining({ codigoProvedor: 5 }));
        expect(resultado.token).toBe("tok-ctr");
    });

    it("provedor não encontrado: lança erro", async () => {
        const provedorRepo = { ObterProvedor: vi.fn().mockResolvedValue(null) };
        const factory = criarFactoryFalsa({});
        const service = new TokenService(provedorRepo as any, factory);

        await expect(service.TokenPorContrato("5", "cpf", "9")).rejects.toThrow("Provedor não encontrado.");
    });
});
