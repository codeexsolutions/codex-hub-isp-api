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
        const resposta = respostas[chamada++] ?? respostas[respostas.length - 1];
        return {
            ok: true,
            status: 200,
            json: async () => resposta,
            text: async () => JSON.stringify(resposta),
        } as any;
    });
}

// Contrato confirmado na doc oficial (docs.doc-api-provedor.com, coleção
// "API - IXC Provedor"): editar é PUT /webservice/v1/cliente/{id} com o
// registro INTEIRO no corpo — não POST + header "ixcsoft: alterar" (era a
// suposição inicial, baseada só em fontes de terceiros, incorreta).
describe("ApiIxcSoftService.AtualizarCliente", () => {

    afterEach(() => vi.unstubAllGlobals());

    it("busca o cadastro atual (listar) e faz PUT em cliente/{id} com o registro inteiro + campos alterados", async () => {
        const provedorRepo = { ObterProvedor: vi.fn().mockResolvedValue(criarProvedorIxc()) };
        const service = new ApiIxcSoftService(provedorRepo as any);
        const clienteAtual = { id: 123, razao: "Fulano", email: "antigo@teste.com", fone: "4133334444", telefone_celular: "41999998888", cnpj_cpf: "00000000000" };
        const fetchMock = mockFetchSequencial([
            { registros: [clienteAtual] }, // listar
            { type: "success", message: "Registro alterado com sucesso" }, // editar
        ]);
        vi.stubGlobal("fetch", fetchMock);

        await service.AtualizarCliente(123, { email: "novo@teste.com" }, "2");

        expect(fetchMock).toHaveBeenCalledTimes(2);

        const [urlListar, optionsListar] = fetchMock.mock.calls[0];
        expect(urlListar).toBe("https://suaempresa.ixcsoft.com.br/webservice/v1/cliente");
        expect(optionsListar.headers.ixcsoft).toBe("listar");

        const [urlEditar, optionsEditar] = fetchMock.mock.calls[1];
        expect(urlEditar).toBe("https://suaempresa.ixcsoft.com.br/webservice/v1/cliente/123");
        expect(optionsEditar.method).toBe("PUT");
        expect(optionsEditar.headers.ixcsoft).toBeUndefined();

        const body = JSON.parse(optionsEditar.body);
        expect(body.id).toBeUndefined(); // id vai na URL, não no corpo
        expect(body.email).toBe("novo@teste.com");
        expect(body.razao).toBe("Fulano"); // resto do cadastro preservado
        expect(body.fone).toBe("4133334444"); // telefone não alterado, preservado
    });

    it("lança erro claro quando o cliente não é encontrado pelo id", async () => {
        const provedorRepo = { ObterProvedor: vi.fn().mockResolvedValue(criarProvedorIxc()) };
        const service = new ApiIxcSoftService(provedorRepo as any);
        vi.stubGlobal("fetch", mockFetchSequencial([{ registros: [] }]));

        await expect(service.AtualizarCliente(999, { email: "x" }, "2")).rejects.toThrow("Cliente não encontrado no IXC pra atualizar.");
    });

    it("lança erro claro quando a API do IXC responde type:error (mesmo com HTTP 200)", async () => {
        const provedorRepo = { ObterProvedor: vi.fn().mockResolvedValue(criarProvedorIxc()) };
        const service = new ApiIxcSoftService(provedorRepo as any);
        vi.stubGlobal("fetch", mockFetchSequencial([
            { registros: [{ id: 123, razao: "Fulano" }] },
            { type: "error", message: "Campo inválido" },
        ]));

        await expect(service.AtualizarCliente(123, { email: "invalido" }, "2")).rejects.toThrow("Campo inválido");
    });
});
