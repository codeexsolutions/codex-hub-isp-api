import { describe, it, expect, vi } from "vitest";
import MkAuthTokenProvider from "../MkAuthTokenProvider";
import { tokenDto } from "../../../../application/Dtos/tokenDto";

function baseTokenDto(): tokenDto {
    return { gerenciador: "MKAUTH", codigoProvedor: 9, token: "", provedorAtivo: true };
}

// Confirma só a "fiação" (o provider delega pro IApiMkAuthService e repassa
// os campos certos) — a implementação real do MK-Auth ainda não existe (ver
// ApiMkAuthService.ts), então aqui o serviço é sempre mockado.
describe("MkAuthTokenProvider", () => {

    it("obterToken() delega pra apiMkAuth.Token com provedor e cpf", async () => {
        const apiMkAuth = { Token: vi.fn().mockResolvedValue("token-mkauth") };
        const provider = new MkAuthTokenProvider(apiMkAuth as any);
        const provedor = {} as any;

        const resultado = await provider.obterToken(provedor, "9", "cpf", baseTokenDto());

        expect(apiMkAuth.Token).toHaveBeenCalledWith(provedor, "cpf");
        expect(resultado.token).toBe("token-mkauth");
    });

    it("tokenPorContrato() delega pra apiMkAuth.TokenPorContrato e preenche cpfCnpj/contratoId", async () => {
        const apiMkAuth = { TokenPorContrato: vi.fn().mockResolvedValue("token-mkauth-ctr") };
        const provider = new MkAuthTokenProvider(apiMkAuth as any);
        const provedor = {} as any;

        const resultado = await provider.tokenPorContrato(provedor, "9", "cpf-x", "9", baseTokenDto());

        expect(apiMkAuth.TokenPorContrato).toHaveBeenCalledWith(provedor, "cpf-x", "9");
        expect(resultado.token).toBe("token-mkauth-ctr");
        expect(resultado.cpfCnpj).toBe("cpf-x");
        expect(resultado.contratoId).toBe(9);
    });
});
