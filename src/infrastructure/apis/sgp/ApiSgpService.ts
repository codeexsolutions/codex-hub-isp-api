import { inject, injectable } from "tsyringe";
import IApiSgpService from "./interfaces/IApiSgpService";
import Provedor from "../../../core/domains/Provedor";
import IProvedorRepository from "../../../core/interfaces/IProvedorRepository";
import RequestService from "../requesService";
import { configRequest } from "../configRequest";
import { emethodHttp } from "../../../common/enuns/emethodhttp";
import { clienteDto, faturaDto } from "../../../application/Dtos/clienteDto";
import { boletos } from "../../../application/Dtos/boletosDto";
import { chamadoDto } from "../../../application/Dtos/chamadoDto";
import { contrato, multiplos } from "../receitanet/responseModels/responseMultiContratos";

// Implementação real, baseada na collection oficial do Postman do SGP (pasta
// "SGP", auth documentada em info.description: Básica/usuário+senha do SGP,
// Token (App+Token gerado em Sistema -> Ferramentas -> Painel Admin ->
// Tokens) e CPF/CNPJ+Senha da Central do Assinante).
//
// Usamos exclusivamente App+Token (provedor.SgpApp + chave_api_gerenciador)
// — é o único esquema que autentica chamadas "em nome do provedor" sem
// precisar da senha da central do próprio cliente, igual IXC (Basic) e
// MK-Auth (Client_Id/Client_Secret) fazem. app/token vão no BODY de cada
// requisição (não em header), conforme a doc oficial.
//
// LIMITAÇÕES REAIS confirmadas na doc pública do SGP (não é lacuna de
// implementação):
//   - Não há endpoint de consumo mensal/franquia por CPF via App+Token.
//   - A thread de respostas de uma Ordem de Serviço (os/{id}/comentario/list)
//     só existe autenticada via Basic Auth (usuário/senha do painel SGP), fora
//     do escopo de credenciais do provedor usado aqui — ver RespostasDoChamado.
@injectable()
export default class ApiSgpService implements IApiSgpService {

    private readonly _provedorRepository: IProvedorRepository;

    constructor(@inject("IProvedorRepository") provedorRepository: IProvedorRepository) {
        this._provedorRepository = provedorRepository;
    }

    private urlBase(provedor: Provedor): string {
        if (!provedor.DominioSgp) {
            throw new Error("Provedor sem domínio do SGP configurado (aba Provedor > Domínio SGP).");
        }
        return `https://${provedor.DominioSgp}`;
    }

    private credenciais(provedor: Provedor): { app: string; token: string } {
        const app = provedor.SgpApp;
        const token = provedor.ObterChaveApiGerenciador();
        if (!app || !token) {
            throw new Error("Provedor sem App/Token do SGP configurados (aba Provedor > App SGP / Token SGP).");
        }
        return { app, token };
    }

    private async obterProvedor(codigoProvedor: string): Promise<Provedor> {
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        if (!provedor) throw new Error("Provedor não encontrado.");
        return provedor;
    }

    // app/token sempre embutidos no corpo — igual IXC/MkAuth, cada chamada
    // resolve o Provedor e monta a requisição do zero (sem cache de sessão,
    // já que o App+Token do SGP não expira).
    private async requisitar(provedor: Provedor, resource: string, body: object): Promise<any> {

        const service = new RequestService(this.urlBase(provedor));

        const configReques: configRequest = {
            method: emethodHttp.POST,
            resource,
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
            },
            body: { ...this.credenciais(provedor), ...body },
        };

        const response = await service.Requst(configReques);
        return response.json();
    }

    // Resolve CPF/CNPJ -> contratos no SGP (/api/ura/consultacliente/).
    // Reaproveitado por todos os métodos de domínio (cliente/fatura/chamado),
    // já que o SGP identifica tudo pelo "contrato", não pelo CPF direto.
    private async buscarContratos(provedor: Provedor, cpfCnpj: string): Promise<any[]> {
        const resultado = await this.requisitar(provedor, "/api/ura/consultacliente/", {
            cpfcnpj: cpfCnpj,
        });
        return resultado?.contratos ?? [];
    }

    // contratoStatus: 1=Ativo, 2=Inativo, 3=Cancelado, 4=Suspenso,
    // 5=Inviabilidade Técnica, 6=Novo, 7=Ativo V. Reduzida. Mesmo critério de
    // "contrato utilizável" que o IXC aplica (só status === 'A'), mas também
    // aceita Ativo V. Reduzida (linha ainda funcionando, só com velocidade
    // reduzida por atraso) — excluir isso faria o cliente "desaparecer" do
    // app assim que a promessa de pagamento expirasse.
    private contratoUsavel(c: any): boolean {
        return [1, 7].includes(Number(c.contratoStatus));
    }

    private async buscarFaturas(provedor: Provedor, idContrato: number): Promise<faturaDto[]> {
        const resultado = await this.requisitar(provedor, "/api/ura/titulos/", { contrato: idContrato });
        const titulos = resultado?.titulos ?? [];

        return titulos.map((t: any): faturaDto => ({
            id: Number(t.id),
            valor: Number(t.valor ?? 0),
            valorPago: Number(t.valorPago ?? 0),
            dataVencimento: t.dataVencimento ?? null,
            dataPagamento: t.dataPagamento || null,
            linkFatura: t.link ?? "",
            // SGP não tem endpoint separado de PDF — o link do título já serve
            // a página/arquivo da fatura, mesmo link usado em linkFatura.
            linkFaturaPdf: t.link ?? "",
            linkRecibo: "",
            // codigoPix é o "copia e cola" (payload EMV), não uma imagem — o
            // app já sabe desenhar o QR a partir do texto, por isso
            // qrCodeImg fica null (SGP não devolve imagem pronta).
            qrCode: t.codigoPix || null,
            qrCodeImg: null,
            linhaDigitavel: t.linhaDigitavel || t.codigoBarras || "",
        }));
    }

    async Token(provedor: Provedor, cpf?: string): Promise<any> {

        this.credenciais(provedor);

        // Login por CPF: falha rápido e com mensagem clara se o cliente não
        // existir no SGP, em vez de deixar isso estourar só na tela de dados.
        if (cpf) {
            const contratos = await this.buscarContratos(provedor, cpf);
            if (contratos.length < 1)
                throw new Error("Cliente não encontrado no SGP.");
        }

        const { app, token } = this.credenciais(provedor);
        // O SGP não tem conceito de sessão/token expirável (App+Token é
        // estático) — esse valor só circula como identificador opaco entre
        // app e API do Synk, igual o IXC faz com o Basic Auth encodado.
        return Buffer.from(`${app}:${token}`).toString("base64");
    }

    async TokenPorContrato(provedor: Provedor, cpf: string, idContrato: string): Promise<any> {

        const contratos = await this.buscarContratos(provedor, cpf);
        const existe = contratos.some((c: any) => Number(c.contratoId ?? c.contrato) === Number(idContrato));

        if (!existe)
            throw new Error("Contrato não encontrado para este cliente no SGP.");

        const { app, token } = this.credenciais(provedor);
        return Buffer.from(`${app}:${token}`).toString("base64");
    }

    async ObterDadosCliente(codigoProvedor: string, cpfCnpj: string, contratoId?: number): Promise<any> {

        const provedor = await this.obterProvedor(codigoProvedor);
        const contratos = await this.buscarContratos(provedor, cpfCnpj);

        let usaveis = contratos.filter((c: any) => this.contratoUsavel(c));

        if (contratoId !== undefined)
            usaveis = usaveis.filter((c: any) => Number(c.contratoId ?? c.contrato) === contratoId);

        if (usaveis.length < 1) return null;

        if (usaveis.length > 1) {
            const multiplos: multiplos = {
                multiploCadastro: true,
                contratos: usaveis.map((c: any): contrato => ({
                    id: Number(c.contratoId ?? c.contrato),
                    nome: c.razaoSocial ?? "",
                    login: c.servico_login ?? cpfCnpj,
                    endereco: `${c.endereco_logradouro ?? ""} - ${c.endereco_numero ?? ""}`,
                    complemento: c.endereco_complemento ?? "",
                    cidade: c.endereco_cidade ?? "",
                    bairro: c.endereco_bairro ?? "",
                    uf: c.endereco_uf ?? "",
                })),
            };
            return multiplos;
        }

        const c = usaveis[0];
        const idContratoResolvido = Number(c.contratoId ?? c.contrato);
        const faturas = await this.buscarFaturas(provedor, idContratoResolvido);

        const dto: clienteDto = {
            idContrato: idContratoResolvido,
            dadosCadastrais: {
                nome: c.razaoSocial ?? "",
                cpfCnpj: c.cpfCnpj ?? cpfCnpj,
                dataNascimento: c.dataNascimento ?? "",
                email: Array.isArray(c.emails) ? (c.emails[0] ?? "") : (c.email ?? ""),
                inscricao: null,
            },
            endereco: {
                logradouro: `${c.endereco_logradouro ?? ""} - ${c.endereco_numero ?? ""}`,
                complemento: c.endereco_complemento ?? "",
                bairro: c.endereco_bairro ?? "",
                cidade: c.endereco_cidade ?? "",
                uf: c.endereco_uf ?? "",
                cep: c.endereco_cep ?? null,
            },
            // SGP não devolve id/valor/qtd do plano via consultacliente — só o
            // nome. Mesmo "melhor esforço" que o MK-Auth faz pro próprio plano.
            plano: [{
                id: 0,
                descricao: c.planointernet ?? "",
                quantidade: 1,
                valor: 0,
                total: 0,
            }],
            ultimasFaturas: faturas,
        };

        return dto;
    }

    async ObterFaturas(codigoProvedor: string, identificador: string): Promise<any> {

        const provedor = await this.obterProvedor(codigoProvedor);

        // `identificador` vem como CPF/CNPJ (SgpFaturaProvider) na maioria dos
        // casos, mas pode chegar como o próprio ID do contrato em string —
        // tenta resolver via CPF primeiro e cai pra "é um ID" se não achar.
        const contratos = await this.buscarContratos(provedor, identificador).catch(() => []);
        const usavel = contratos.find((c: any) => this.contratoUsavel(c)) ?? contratos[0];

        let idContrato: number | null = usavel ? Number(usavel.contratoId ?? usavel.contrato) : null;
        if (!idContrato && /^\d+$/.test(identificador))
            idContrato = Number(identificador);

        if (!idContrato)
            throw new Error("Contrato não encontrado no SGP para consultar as faturas.");

        const faturas = await this.buscarFaturas(provedor, idContrato);
        const resultado: boletos = { boletos: faturas };
        return resultado;
    }

    // Visualização/impressão do contrato (PDF). `identificador` é o CPF/CNPJ
    // do cliente — resolve pro contrato usável e imprime o PDF via
    // /api/contratos/print/contrato, devolvendo como data URI (mesmo padrão
    // usado pro IXC em ObterContratoPdf).
    async ObterContrato(codigoProvedor: string, identificador: string): Promise<any> {

        const provedor = await this.obterProvedor(codigoProvedor);
        const service = new RequestService(this.urlBase(provedor));

        const configReques: configRequest = {
            method: emethodHttp.POST,
            resource: "/api/contratos/print/contrato",
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
            },
            body: { ...this.credenciais(provedor), cpfcnpj: identificador },
        };

        const response = await service.Requst(configReques);
        const buffer = Buffer.from(await response.arrayBuffer());
        return `data:application/pdf;base64,${buffer.toString("base64")}`;
    }

    // "Chamado" = Ordem de Serviço do SGP (/api/ura/ordemservico/list/) — tem
    // id numérico próprio, diferente da ocorrência (só tem "numero"/protocolo
    // textual). Um CPF pode ter mais de um contrato, então lista OS de todos.
    async ObterChamados(codigoProvedor: string, identificador: string): Promise<any> {

        const provedor = await this.obterProvedor(codigoProvedor);
        const contratos = await this.buscarContratos(provedor, identificador);

        if (contratos.length < 1) return [];

        const idsContratos = contratos.map((c: any) => Number(c.contratoId ?? c.contrato));

        const listas = await Promise.all(idsContratos.map((idContrato) =>
            this.requisitar(provedor, "/api/ura/ordemservico/list/", { contrato: idContrato })
                .catch(() => ({ ordens_servicos: [] }))
        ));

        const ordens = listas.flatMap((r: any) => r?.ordens_servicos ?? []);

        return ordens.map((os: any): chamadoDto => ({
            id: Number(os.id),
            protocolo: os.ocorrencia ?? String(os.id),
            descricao: os.conteudo ?? "",
            // status_id: 0=Aberta, 1=Encerrada, 2=Em execução, 3=Pendente — só
            // Encerrada conta como "Fechado" pro cliente, igual convenção do IXC.
            status: Number(os.status_id) === 1 ? "Fechado" : "Aberto",
            // não busca o detalhe de cada OS aqui (custaria 1 chamada extra por
            // item da lista) — "nova resposta" só é checado ao abrir o chamado.
            respostasStatus: 0,
        }));
    }

    // Cria ocorrência + OS via /api/ura/chamado/ (contrato é o único campo
    // realmente obrigatório; ocorrenciatipo/motivoos usam os padrões do SGP —
    // 5 e 40 — então não precisa de nenhuma config extra por provedor, ao
    // contrário do IXC que exige id_filial/setor configurados antes).
    async AbrirChamado(codigoProvedor: string, identificador: string, dados: { assunto: string; descricao: string; categoria?: string }): Promise<number> {

        const provedor = await this.obterProvedor(codigoProvedor);
        const contratos = await this.buscarContratos(provedor, identificador);
        const contratoUsavel = contratos.find((c: any) => this.contratoUsavel(c)) ?? contratos[0];

        if (!contratoUsavel)
            throw new Error("Cliente/contrato não encontrado no SGP.");

        const idContrato = Number(contratoUsavel.contratoId ?? contratoUsavel.contrato);
        const conteudo = `Assunto: ${dados.assunto}\nDescrição: ${dados.descricao}`;

        const resultado = await this.requisitar(provedor, "/api/ura/chamado/", {
            contrato: idContrato,
            conteudo,
        });

        // status === 0 é "ocorrência criada" (sucesso) na doc do SGP — qualquer
        // outro valor (2,3,9...) é uma rejeição específica.
        if (resultado?.status !== 0)
            throw new Error(resultado?.msg || "Erro ao abrir o chamado no SGP.");

        const idChamado = resultado?.os_id ?? resultado?.ocorrencia_id;
        if (!idChamado)
            throw new Error("O SGP não retornou o identificador do chamado aberto.");

        return Number(idChamado);
    }

    // Anotação em cima de uma OS existente — /api/central/chamado/{os_id}/anotacao
    // é o único endpoint de "adicionar comentário" que aceita App+Token
    // (os demais, em /api/os/..., exigem Basic Auth do painel SGP).
    async EnviarRespostaChamado(codigoProvedor: string, idChamado: number, mensagem: string): Promise<any> {

        const provedor = await this.obterProvedor(codigoProvedor);

        const resultado = await this.requisitar(provedor, `/api/central/chamado/${idChamado}/anotacao`, {
            anotacao: mensagem,
        });

        if (resultado?.msg === "OS já foi encerrada")
            throw new Error("Esse chamado já foi encerrado e não aceita novas mensagens.");

        return resultado;
    }

    async RespostasDoChamado(codigoProvedor: string, idChamado: number): Promise<any> {
        // A API pública do SGP não expõe leitura do histórico de anotações de
        // uma OS via App+Token — só /api/os/{id}/comentario/list/, que exige
        // Basic Auth com usuário/senha do painel SGP (fora do escopo de
        // credenciais do provedor usadas pelo resto desta integração).
        // Devolve vazio em vez de quebrar a tela de chamado no app.
        return [];
    }
}
