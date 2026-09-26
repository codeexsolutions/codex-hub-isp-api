import { describe, it, expect, vi } from "vitest";
import IxcTokenProvider from "../IxcTokenProvider";
import { tokenDto } from "../../../../application/Dtos/tokenDto";

function baseTokenDto(): tokenDto {
    return { gerenciador: "IXCSOFT", codigoProvedor: 2, token: "", provedorAtivo: true };
}

describe("IxcTokenProvider", () => {

    it("obterToken() usa apiIxcSoft.Token (síncrono)", async () => {
        const apiIxc = { Token: vi.fn().mockReturnValue("token-ixc") };
        const provider = new IxcTokenProvider(apiIxc as any);
        const provedor = {} as any;

        const resultado = await provider.obterToken(provedor, "2", "cpf", baseTokenDto());

        expect(apiIxc.Token).toHaveBeenCalledWith(provedor);
        expect(resultado.token).toBe("token-ixc");
        expect(resultado.isContrassenha).toBe(false);
    });

    it("tokenPorContrato() preenche cpfCnpj/contratoId e usa apiIxcSoft.Token", async () => {
        const apiIxc = { Token: vi.fn().mockReturnValue("token-ixc") };
        const provider = new IxcTokenProvider(apiIxc as any);

        const resultado = await provider.tokenPorContrato({} as any, "2", "cpf-x", "9", baseTokenDto());

        expect(resultado.token).toBe("token-ixc");
        expect(resultado.cpfCnpj).toBe("cpf-x");
        expect(resultado.contratoId).toBe(9);
        expect(resultado.multiploCadastro).toBe(false);
    });
});
