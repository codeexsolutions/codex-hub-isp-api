import { describe, it, expect, vi } from "vitest";
import ReceitaNetTokenProvider from "../ReceitaNetTokenProvider";
import { tokenDto } from "../../../../application/Dtos/tokenDto";

function baseTokenDto(): tokenDto {
    return { gerenciador: "RECEITANET", codigoProvedor: 5, token: "", provedorAtivo: true };
}

describe("ReceitaNetTokenProvider", () => {

    it("obterToken() com access_token único: preenche nome/isContrassenha/multiploCadastro=false", async () => {
        const apiReceitaNet = { ObterToken: vi.fn().mockResolvedValue({ access_token: "tok-rn", name: "Fulano", isContrassenha: true }) };
        const provider = new ReceitaNetTokenProvider(apiReceitaNet as any);

        const resultado = await provider.obterToken({} as any, "5", "cpf", baseTokenDto());

        expect(apiReceitaNet.ObterToken).toHaveBeenCalledWith("5", "cpf");
        expect(resultado.token).toBe("tok-rn");
        expect(resultado.nome).toBe("Fulano");
        expect(resultado.isContrassenha).toBe(true);
        expect(resultado.multiploCadastro).toBe(false);
    });

    it("obterToken() com múltiplos contratos: mapeia a lista, sem token único", async () => {
        const apiReceitaNet = {
            ObterToken: vi.fn().mockResolvedValue({
                multiploCadastro: true,
                contratos: [{ id: 1, nome: "Contrato 1", login: "l1", endereco: "e1", complemento: "", bairro: "b1", cidade: "c1", uf: "CE" }],
            }),
        };
        const provider = new ReceitaNetTokenProvider(apiReceitaNet as any);

        const resultado = await provider.obterToken({} as any, "5", "cpf", baseTokenDto());

        expect(resultado.multiploCadastro).toBe(true);
        expect(resultado.contratos).toHaveLength(1);
        expect(resultado.contratos![0].id).toBe(1);
    });

    it("tokenPorContrato() usa ObterTokenPorContrato e devolve multiploCadastro=false", async () => {
        const apiReceitaNet = { ObterTokenPorContrato: vi.fn().mockResolvedValue({ access_token: "tok-ctr", name: "Fulano", isContrassenha: false }) };
        const provider = new ReceitaNetTokenProvider(apiReceitaNet as any);

        const resultado = await provider.tokenPorContrato({} as any, "5", "cpf", "9", baseTokenDto());

        expect(apiReceitaNet.ObterTokenPorContrato).toHaveBeenCalledWith("5", "cpf", "9");
        expect(resultado.token).toBe("tok-ctr");
        expect(resultado.multiploCadastro).toBe(false);
    });
});
