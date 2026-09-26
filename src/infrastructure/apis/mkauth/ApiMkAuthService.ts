import { inject, injectable } from "tsyringe";
import IApiMkAuthService from "./interfaces/IApiMkAuthService";
import Provedor from "../../../core/domains/Provedor";
import IProvedorRepository from "../../../core/interfaces/IProvedorRepository";

// Implementação real, baseada na documentação oficial do MK-Auth
// (postman.mk-auth.com.br + wiki.mk-auth.com.br/doku.php?id=guia_do_desenvolvedor):
//
// - Auth: GET https://{dominio}/api/ com Basic Auth (Client_Id:Client_Secret)
//   devolve um JWT (texto puro no corpo). Usado depois como
//   `Authorization: Bearer {jwt}` nas demais chamadas. Token expira em ~600s
//   — por simplicidade, geramos um novo a cada operação (sem cache).
// - Exige HTTPS com certificado válido no servidor MK-Auth (documentado).
//
// LIMITAÇÕES REAIS da API pública do MK-Auth (confirmadas na doc, não é
// lacuna de implementação):
//   - Não existe endpoint de faturas/boletos detalhados por cliente (só
//     contadores agregados dentro do próprio registro de cliente:
//     tit_abertos, tit_vencidos, parc_abertas, venc).
//   - Não existe endpoint de contrato (PDF/link) — só o número do contrato
//     como campo do cliente.
//   - Chamado não tem thread de mensagens: só listar/show/inserir/editar/
//     fechar/reabrir. "assunto" no chamado é uma categoria fixa (Financeiro,
//     Dúvidas, Conexão, Cadastro, Crítica, Sugestão, Transferencia,
//     Cancelamento, Outros), não um texto livre — não há campo pra
//     descrição/mensagem do cliente na criação do chamado.
@injectable()
export default class ApiMkAuthService implements IApiMkAuthService {

    private readonly _provedorRepository: IProvedorRepository;

    constructor(@inject("IProvedorRepository") provedorRepository: IProvedorRepository) {
        this._provedorRepository = provedorRepository;
    }

    private urlBase(provedor: Provedor): string {
        if (!provedor.DominioMkAuth) {
            throw new Error("Provedor sem domínio do MK-Auth configurado (aba Provedor > Domínio MK-Auth).");
        }
        return `https://${provedor.DominioMkAuth}/api`;
    }

    async Token(provedor: Provedor, cpf?: string): Promise<string> {

        if (!provedor.MkAuthClientId || !provedor.ObterChaveApiGerenciador()) {
            throw new Error("Provedor sem Client ID/Client Secret do MK-Auth configurados.");
        }

        const basic = Buffer.from(`${provedor.MkAuthClientId}:${provedor.ObterChaveApiGerenciador()}`).toString("base64");

        const response = await fetch(`${this.urlBase(provedor)}/`, {
            method: "GET",
            headers: { Authorization: `Basic ${basic}` },
        });

        if (!response.ok) {
            throw new Error(`Falha ao autenticar no MK-Auth (HTTP ${response.status}) — verifique domínio, Client ID e Client Secret.`);
        }

        const texto = (await response.text()).trim();

        // Defensivo: a doc mostra o token como texto puro, mas caso alguma
        // instalação devolva {"token":"..."} envelopado, tratamos os dois casos.
        try {
            const json = JSON.parse(texto);
            return json.token ?? json.jwt ?? texto;
        } catch {
            return texto;
        }
    }

    // MK-Auth não tem conceito de "múltiplos contratos por CPF" como o
    // ReceitaNet — um login já é um cliente/contrato só. Reaproveita o mesmo
    // fluxo de autenticação.
    async TokenPorContrato(provedor: Provedor, cpf: string, idContrato: string): Promise<any> {
        return this.Token(provedor, cpf);
    }

    // Recebe o token já gerado (uma vez por operação lógica, não uma vez por
    // chamada HTTP) — evita autenticar de novo pra cada requisição dentro do
    // mesmo fluxo (ex.: listar + show em buscarClientePorCpf).
    private async requisitar(token: string, provedor: Provedor, metodo: string, caminho: string, body?: any): Promise<any> {

        const response = await fetch(`${this.urlBase(provedor)}${caminho}`, {
            method: metodo,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            throw new Error(`Erro na API do MK-Auth (HTTP ${response.status}) em ${caminho}.`);
        }

        return response.json();
    }

    private async obterProvedor(codigoProvedor: string): Promise<Provedor> {
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        if (!provedor) throw new Error("Provedor não encontrado.");
        return provedor;
    }

    // Resolve CPF/CNPJ -> registro completo do cliente no MK-Auth (listar
    // filtrando por cpf_cnpj, depois show pelo login pra pegar todos os
    // campos). Reaproveitado por ObterDadosCliente e pelos métodos de
    // chamado, que no MK-Auth precisam do `login`, não do CPF.
    private async buscarClientePorCpf(token: string, provedor: Provedor, cpfCnpj: string): Promise<any | null> {
        const cpfLimpo = cpfCnpj.replace(/\D/g, "");
        const listagem = await this.requisitar(token, provedor, "GET", `/cliente/listar/pagina=1&cpf_cnpj=${cpfLimpo}&limite=1`);
        const cliente = listagem?.clientes?.[0];
        if (!cliente) return null;

        const identificador = cliente.login ?? cliente.uuid_cliente ?? cliente.uuid;
        return await this.requisitar(token, provedor, "GET", `/cliente/show/${identificador}`);
    }

    async ObterDadosCliente(codigoProvedor: string, cpfCnpj: string, contratoId?: number): Promise<any> {

        const provedor = await this.obterProvedor(codigoProvedor);
        const token = await this.Token(provedor);
        const detalhe = await this.buscarClientePorCpf(token, provedor, cpfCnpj);
        if (!detalhe) return null;

        // Best-effort: MK-Auth não expõe faturas detalhadas (link/QR/PIX) via
        // API pública — só contadores agregados no próprio cliente.
        return {
            idContrato: detalhe.contrato ?? detalhe.numero ?? null,
            dadosCadastrais: {
                nome: detalhe.nome,
                cpfCnpj: detalhe.cpf_cnpj,
                dataNascimento: detalhe.nascimento ?? null,
                email: detalhe.email ?? "",
            },
            endereco: {
                logradouro: detalhe.endereco ?? "",
                complemento: detalhe.complemento ?? "",
                bairro: detalhe.bairro ?? "",
                cidade: detalhe.cidade ?? "",
                uf: detalhe.estado ?? "",
                cep: detalhe.cep ?? "",
            },
            plano: detalhe.plano ? [{ id: null, descricao: String(detalhe.plano), quantidade: 1, valor: null, total: null }] : [],
            resumoFinanceiro: {
                titulosAbertos: detalhe.tit_abertos ?? null,
                titulosVencidos: detalhe.tit_vencidos ?? null,
                parcelasAbertas: detalhe.parc_abertas ?? null,
                proximoVencimento: detalhe.venc ?? null,
            },
            ultimasFaturas: [],
        };
    }

    async ObterFaturas(codigoProvedor: string, identificador: string): Promise<any> {
        throw new Error("A API pública do MK-Auth não expõe detalhamento de faturas (linha digitável/PIX/QR) — apenas contadores agregados no cadastro do cliente.");
    }

    async ObterContrato(codigoProvedor: string, identificador: string): Promise<any> {
        throw new Error("A API pública do MK-Auth não expõe endpoint de contrato (PDF/link).");
    }

    // `identificador` aqui é o CPF/CNPJ do cliente (mesma convenção usada em
    // ObterDadosCliente/ObterFaturas) — resolve pro `login` do MK-Auth
    // internamente, já que é isso que o endpoint de chamado exige.
    async ObterChamados(codigoProvedor: string, identificador: string): Promise<any> {
        const provedor = await this.obterProvedor(codigoProvedor);
        const token = await this.Token(provedor);
        const cliente = await this.buscarClientePorCpf(token, provedor, identificador);
        if (!cliente) return [];

        const listagem = await this.requisitar(token, provedor, "GET", `/chamado/listar/pagina=1&login=${encodeURIComponent(cliente.login)}`);
        const chamados = listagem?.chamados ?? [];

        return chamados.map((c: any) => ({
            id: c.id ?? c.chamado,
            protocolo: c.chamado,
            descricao: c.assunto,
            status: c.status,
            respostasStatus: 0,
        }));
    }

    // MK-Auth: "assunto" do chamado é uma categoria fixa, não texto livre —
    // não há onde colocar a descrição digitada pelo cliente. Mapeamos o
    // melhor esforço a partir de `categoria` (se já vier num valor aceito
    // pelo MK-Auth) e caímos em "Outros" como padrão. `identificador` é o
    // CPF/CNPJ, resolvido pro `login` internamente (igual ObterChamados).
    async AbrirChamado(codigoProvedor: string, identificador: string, dados: { assunto: string; descricao: string; categoria?: string }): Promise<number> {
        const provedor = await this.obterProvedor(codigoProvedor);
        const token = await this.Token(provedor);
        const cliente = await this.buscarClientePorCpf(token, provedor, identificador);
        if (!cliente) throw new Error("Cliente não encontrado no MK-Auth.");

        const categoriasValidas = ["Financeiro", "Dúvidas", "Conexão", "Cadastro", "Crítica", "Sugestão", "Transferencia", "Cancelamento", "Outros"];
        const assunto = categoriasValidas.includes(dados.categoria ?? "") ? dados.categoria : "Outros";

        const resultado = await this.requisitar(token, provedor, "POST", "/chamado/inserir", {
            login: cliente.login,
            assunto,
            prioridade: "normal",
        });

        return Number(resultado?.chamado ?? resultado?.dados?.chamado ?? 0);
    }

    async EnviarRespostaChamado(codigoProvedor: string, idChamado: number, mensagem: string): Promise<any> {
        throw new Error("A API pública do MK-Auth não tem endpoint de mensagens/respostas em chamado — só listar, abrir, editar, fechar e reabrir.");
    }

    async RespostasDoChamado(codigoProvedor: string, idChamado: number): Promise<any> {
        // Não existe thread de mensagens no MK-Auth — devolve vazio em vez de
        // quebrar a tela de chamado no app.
        return [];
    }
}
