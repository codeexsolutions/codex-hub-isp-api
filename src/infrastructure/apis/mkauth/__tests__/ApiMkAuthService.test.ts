import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ApiMkAuthService from "../ApiMkAuthService";
import Provedor from "../../../../core/domains/Provedor";
import { estatus } from "../../../../common/enuns/estatus";
import { eGerenciador } from "../../../../common/enuns/egerenciador";

function criarProvedorMkAuth() {
    // (empresa, nomeFantasia, codigoProvedor, status, gerenciador, codigoApiGerenciador,
    //  chaveApiGerenciador, nomeAdministrador, cpfcnpj, dominio, usuario, senha, dominioMkAuth, mkAuthClientId)
    return new Provedor(
        "Empresa", "Fantasia", 9, estatus.ATIVO, eGerenciador.MKAUTH,
        0, "Client_Secret_abc", "Admin", "00000000000", "", "user", "senha",
        "192.168.88.2", "Client_Id_xyz"
    );
}

function mockFetchSequencial(respostas: Array<{ ok?: boolean; status?: number; json?: any; text?: string }>) {
    let chamada = 0;
    return vi.fn(async (..._args: any[]) => {
        const r = respostas[chamada++] ?? respostas[respostas.length - 1];
        return {
            ok: r.ok ?? true,
            status: r.status ?? 200,
            text: async () => r.text ?? JSON.stringify(r.json ?? {}),
            json: async () => r.json ?? {},
        } as any;
    });
}

describe("ApiMkAuthService", () => {
    let provedorRepo: any;
    let service: ApiMkAuthService;

    beforeEach(() => {
        provedorRepo = { ObterProvedor: vi.fn() };
        service = new ApiMkAuthService(provedorRepo);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("Token(): usa Basic Auth com Client_Id/Client_Secret e devolve o JWT em texto puro", async () => {
        const provedor = criarProvedorMkAuth();
        const fetchMock = mockFetchSequencial([{ text: "eyJhbGciOiJIUzUxMiJ9.fake.jwt" }]);
        vi.stubGlobal("fetch", fetchMock);

        const token = await service.Token(provedor);

        expect(token).toBe("eyJhbGciOiJIUzUxMiJ9.fake.jwt");
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe("https://192.168.88.2/api/");
        expect(options.headers.Authorization).toBe(`Basic ${Buffer.from("Client_Id_xyz:Client_Secret_abc").toString("base64")}`);
    });

    it("Token(): lança erro claro sem domínio MK-Auth configurado", async () => {
        const provedor = criarProvedorMkAuth();
        provedor.DominioMkAuth = "";

        await expect(service.Token(provedor)).rejects.toThrow(/domínio do MK-Auth/i);
    });

    it("Token(): lança erro claro quando a autenticação HTTP falha", async () => {
        const provedor = criarProvedorMkAuth();
        vi.stubGlobal("fetch", mockFetchSequencial([{ ok: false, status: 401 }]));

        await expect(service.Token(provedor)).rejects.toThrow(/HTTP 401/);
    });

    it("ObterDadosCliente(): resolve por cpf_cnpj (listar) e depois busca o show completo", async () => {
        const provedor = criarProvedorMkAuth();
        provedorRepo.ObterProvedor.mockResolvedValue(provedor);

        const fetchMock = mockFetchSequencial([
            { text: "jwt-token" },
            { json: { total_registros: 1, clientes: [{ login: "fulano", uuid: "u1" }] } },
            { json: { nome: "Fulano da Silva", cpf_cnpj: "11122233344", endereco: "Rua X", bairro: "Centro", cidade: "Fortaleza", estado: "CE", cep: "60000-000", plano: "100 MEGA", tit_abertos: 1, tit_vencidos: 0, parc_abertas: 1, venc: "2026-10-10" } },
        ]);
        vi.stubGlobal("fetch", fetchMock);

        const resultado = await service.ObterDadosCliente("9", "111.222.333-44");

        expect(resultado.dadosCadastrais.nome).toBe("Fulano da Silva");
        expect(resultado.endereco.cidade).toBe("Fortaleza");
        expect(resultado.resumoFinanceiro.titulosAbertos).toBe(1);
        expect(resultado.ultimasFaturas).toEqual([]);

        // 1ª chamada: token. 2ª: listar filtrando por cpf_cnpj (sem máscara). 3ª: show pelo login.
        expect(fetchMock.mock.calls[1][0]).toContain("/cliente/listar/pagina=1&cpf_cnpj=11122233344");
        expect(fetchMock.mock.calls[2][0]).toContain("/cliente/show/fulano");
    });

    it("ObterDadosCliente(): devolve null quando não encontra cliente pelo CPF", async () => {
        const provedor = criarProvedorMkAuth();
        provedorRepo.ObterProvedor.mockResolvedValue(provedor);
        vi.stubGlobal("fetch", mockFetchSequencial([
            { text: "jwt-token" },
            { json: { total_registros: 0, clientes: [] } },
        ]));

        const resultado = await service.ObterDadosCliente("9", "999.999.999-99");
        expect(resultado).toBeNull();
    });

    it("ObterFaturas(): lança erro claro (API pública do MK-Auth não expõe faturas detalhadas)", async () => {
        await expect(service.ObterFaturas("9", "111.222.333-44")).rejects.toThrow(/não expõe detalhamento de faturas/i);
    });

    it("ObterChamados(): resolve o login pelo CPF e lista os chamados desse login", async () => {
        const provedor = criarProvedorMkAuth();
        provedorRepo.ObterProvedor.mockResolvedValue(provedor);
        const fetchMock = mockFetchSequencial([
            { text: "jwt-token" },
            { json: { clientes: [{ login: "fulano" }] } },
            { json: { nome: "Fulano", login: "fulano" } }, // show
            { json: { chamados: [{ id: 1, chamado: "20260101000000", assunto: "Conexão", status: "aberto" }] } },
        ]);
        vi.stubGlobal("fetch", fetchMock);

        const chamados = await service.ObterChamados("9", "111.222.333-44");

        expect(chamados).toHaveLength(1);
        expect(chamados[0].protocolo).toBe("20260101000000");
        expect(fetchMock.mock.calls[3][0]).toContain("/chamado/listar/pagina=1&login=fulano");
    });

    it("AbrirChamado(): cai em categoria 'Outros' quando a categoria não é uma das aceitas pelo MK-Auth", async () => {
        const provedor = criarProvedorMkAuth();
        provedorRepo.ObterProvedor.mockResolvedValue(provedor);
        const fetchMock = mockFetchSequencial([
            { text: "jwt-token" },
            { json: { clientes: [{ login: "fulano" }] } },
            { json: { nome: "Fulano", login: "fulano" } }, // show
            { json: { chamado: "29122313564327" } },
        ]);
        vi.stubGlobal("fetch", fetchMock);

        const idChamado = await service.AbrirChamado("9", "111.222.333-44", { assunto: "Sem sinal", descricao: "Internet caiu", categoria: "Técnico" });

        expect(idChamado).toBe(29122313564327);
        const [, options] = fetchMock.mock.calls[3];
        const body = JSON.parse(options.body);
        expect(body.assunto).toBe("Outros");
        expect(body.login).toBe("fulano");
    });

    it("EnviarRespostaChamado()/RespostasDoChamado(): sem thread de mensagens no MK-Auth", async () => {
        await expect(service.EnviarRespostaChamado("9", 1, "oi")).rejects.toThrow(/não tem endpoint de mensagens/i);
        await expect(service.RespostasDoChamado("9", 1)).resolves.toEqual([]);
    });
});
