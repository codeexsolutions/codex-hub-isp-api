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
            json: async () => r,
            text: async () => JSON.stringify(r),
        } as any;
    });
}

// Confirmado na doc oficial: campos de WiFi ficam no cadastro de Login
// (radusuarios), editado via PUT com o registro inteiro — mesmo contrato de
// AtualizarCliente, tabela diferente.
describe("ApiIxcSoftService.AtualizarLogin", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("busca o login atual (listar) e faz PUT em radusuarios/{id} com o registro inteiro + campos de wifi alterados", async () => {
        const provedorRepo = { ObterProvedor: vi.fn().mockResolvedValue(criarProvedorIxc()) };
        const service = new ApiIxcSoftService(provedorRepo as any);
        const loginAtual = { id: 4709, login: "joaotreinamento", senha: "123456", ssid_router_wifi: "", senha_rede_sem_fio: "" };
        const fetchMock = mockFetchSequencial([
            { registros: [loginAtual] },
            { type: "success" },
        ]);
        vi.stubGlobal("fetch", fetchMock);

        await service.AtualizarLogin(4709, { ssidWifi: "MinhaCasa", senhaWifi: "senha12345" }, "2");

        const [urlListar, optionsListar] = fetchMock.mock.calls[0];
        expect(urlListar).toBe("https://suaempresa.ixcsoft.com.br/webservice/v1/radusuarios");
        expect(optionsListar.headers.ixcsoft).toBe("listar");

        const [urlEditar, optionsEditar] = fetchMock.mock.calls[1];
        expect(urlEditar).toBe("https://suaempresa.ixcsoft.com.br/webservice/v1/radusuarios/4709");
        expect(optionsEditar.method).toBe("PUT");

        const body = JSON.parse(optionsEditar.body);
        expect(body.id).toBeUndefined();
        expect(body.ssid_router_wifi).toBe("MinhaCasa");
        expect(body.senha_rede_sem_fio).toBe("senha12345");
        expect(body.login).toBe("joaotreinamento"); // resto do login preservado
        expect(body.senha).toBe("123456"); // senha PPPoE não alterada, preservada
    });

    it("lança erro claro quando o login não é encontrado pelo id", async () => {
        const provedorRepo = { ObterProvedor: vi.fn().mockResolvedValue(criarProvedorIxc()) };
        const service = new ApiIxcSoftService(provedorRepo as any);
        vi.stubGlobal("fetch", mockFetchSequencial([{ registros: [] }]));

        await expect(service.AtualizarLogin(999, { ssidWifi: "x" }, "2")).rejects.toThrow("Login não encontrado no IXC pra atualizar.");
    });

    it("lança erro claro quando a API do IXC responde type:error", async () => {
        const provedorRepo = { ObterProvedor: vi.fn().mockResolvedValue(criarProvedorIxc()) };
        const service = new ApiIxcSoftService(provedorRepo as any);
        vi.stubGlobal("fetch", mockFetchSequencial([
            { registros: [{ id: 4709 }] },
            { type: "error", message: "Senha muito curta" },
        ]));

        await expect(service.AtualizarLogin(4709, { senhaWifi: "123" }, "2")).rejects.toThrow("Senha muito curta");
    });
});
