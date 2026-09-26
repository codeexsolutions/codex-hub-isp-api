import { describe, it, expect, vi, afterEach } from "vitest";
import ApiIxcSoftService from "../ApiIxcSoftService";
import Provedor from "../../../../core/domains/Provedor";
import { estatus } from "../../../../common/enuns/estatus";
import { eGerenciador } from "../../../../common/enuns/egerenciador";

function criarProvedorIxc() {
    return new Provedor(
        "Empresa", "Fantasia", 2, estatus.ATIVO, eGerenciador.IXCSOFT,
        128, "chave-api", "Admin", "00000000000", "suaempresa.ixcsoft.com.br", "user", "senha"
    );
}

function mockFetchSequencial(respostas: any[]) {
    let chamada = 0;
    return vi.fn(async (..._args: any[]) => {
        const r = respostas[chamada++] ?? respostas[respostas.length - 1];
        return {
            ok: true,
            status: 200,
            json: async () => r.json ?? {},
            text: async () => r.text ?? JSON.stringify(r.json ?? {}),
        } as any;
    });
}

describe("ApiIxcSoftService.ObterFibraPorContrato", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("lista radpop_radio_cliente_fibra filtrando por id_contrato", async () => {
        const provedorRepo = { ObterProvedor: vi.fn().mockResolvedValue(criarProvedorIxc()) };
        const service = new ApiIxcSoftService(provedorRepo as any);
        const fetchMock = mockFetchSequencial([{ json: { registros: [{ id: 55 }] } }]);
        vi.stubGlobal("fetch", fetchMock);

        const resultado = await service.ObterFibraPorContrato(9, "2");

        expect(resultado.registros[0].id).toBe(55);
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe("https://suaempresa.ixcsoft.com.br/webservice/v1/radpop_radio_cliente_fibra");
        expect(options.headers.ixcsoft).toBe("listar");
        const body = JSON.parse(options.body);
        expect(JSON.parse(body.grid_param)[0]).toEqual({ TB: "radpop_radio_cliente_fibra.id_contrato", OP: "=", P: 9 });
    });
});

describe("ApiIxcSoftService.ReiniciarOnu", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("faz POST no resource configurado com { id: idClienteFibra }", async () => {
        const provedorRepo = { ObterProvedor: vi.fn().mockResolvedValue(criarProvedorIxc()) };
        const service = new ApiIxcSoftService(provedorRepo as any);
        const fetchMock = mockFetchSequencial([{ json: { type: "success" } }]);
        vi.stubGlobal("fetch", fetchMock);

        await service.ReiniciarOnu(55, "radpop_radio_cliente_fibra_26379", "2");

        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe("https://suaempresa.ixcsoft.com.br/webservice/v1/radpop_radio_cliente_fibra_26379");
        expect(options.headers.ixcsoft).toBeUndefined();
        expect(JSON.parse(options.body)).toEqual({ id: "55" });
    });

    it("lança erro claro quando a API do IXC responde type:error", async () => {
        const provedorRepo = { ObterProvedor: vi.fn().mockResolvedValue(criarProvedorIxc()) };
        const service = new ApiIxcSoftService(provedorRepo as any);
        vi.stubGlobal("fetch", mockFetchSequencial([{ json: { type: "error", message: "Botão inválido" } }]));

        await expect(service.ReiniciarOnu(55, "resource-errado", "2")).rejects.toThrow("Botão inválido");
    });
});

describe("ApiIxcSoftService.ObterBoletoArquivo", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("devolve o texto puro quando a resposta não é JSON (assume base64 cru)", async () => {
        const provedorRepo = { ObterProvedor: vi.fn().mockResolvedValue(criarProvedorIxc()) };
        const service = new ApiIxcSoftService(provedorRepo as any);
        vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, text: async () => "JVBERi0xLjQK...", json: async () => { throw new Error("not json"); } } as any)));

        const resultado = await service.ObterBoletoArquivo(123, "2");

        expect(resultado).toBe("JVBERi0xLjQK...");
    });

    it("lança erro quando a API do IXC responde type:error", async () => {
        const provedorRepo = { ObterProvedor: vi.fn().mockResolvedValue(criarProvedorIxc()) };
        const service = new ApiIxcSoftService(provedorRepo as any);
        vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ type: "error", message: "Boleto não encontrado" }) } as any)));

        await expect(service.ObterBoletoArquivo(999, "2")).rejects.toThrow("Boleto não encontrado");
    });

    it("lança erro claro quando a resposta é JSON mas não é um erro conhecido (formato não documentado)", async () => {
        const provedorRepo = { ObterProvedor: vi.fn().mockResolvedValue(criarProvedorIxc()) };
        const service = new ApiIxcSoftService(provedorRepo as any);
        vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ algumCampo: "valor" }) } as any)));

        await expect(service.ObterBoletoArquivo(123, "2")).rejects.toThrow("Resposta inesperada");
    });
});
