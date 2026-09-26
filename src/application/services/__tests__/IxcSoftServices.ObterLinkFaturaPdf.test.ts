import { describe, it, expect, vi } from "vitest";
import IxcSoftServices from "../IxcSoftServices";

function criarService(apiOverrides: any = {}) {
    const apiIxcSoft = {
        ObterFaturas: vi.fn().mockResolvedValue({
            registros: [
                { id: 1, valor: "99.90", valor_recebido: "0", status: "A", gateway_link: "https://gateway.com/boleto/1" },
                { id: 2, valor: "50.00", valor_recebido: "0", status: "A", gateway_link: "" },
            ],
        }),
        ObterPix: vi.fn().mockResolvedValue({ pix: null }),
        ObterBoletoArquivo: vi.fn().mockResolvedValue("BASE64CRU"),
        ...apiOverrides,
    };
    return { service: new IxcSoftServices(apiIxcSoft, {} as any, {} as any), apiIxcSoft };
}

describe("IxcSoftServices.ObterFaturas — fallback de link do boleto", () => {

    it("usa gateway_link quando presente, e busca 2ª via (data URI) quando ausente", async () => {
        const { service, apiIxcSoft } = criarService();

        const resultado = await service.ObterFaturas("9", "2");

        expect(resultado.boletos[0].linkFaturaPdf).toBe("https://gateway.com/boleto/1");
        expect(apiIxcSoft.ObterBoletoArquivo).toHaveBeenCalledWith(2, "2");
        expect(resultado.boletos[1].linkFaturaPdf).toBe("data:application/pdf;base64,BASE64CRU");
    });

    it("devolve link vazio (sem quebrar a fatura) quando a 2ª via também falha", async () => {
        const { service } = criarService({ ObterBoletoArquivo: vi.fn().mockRejectedValue(new Error("indisponível")) });

        const resultado = await service.ObterFaturas("9", "2");

        expect(resultado.boletos[1].linkFaturaPdf).toBe("");
    });
});
