import { container, inject, injectable } from "tsyringe";
import IApiIxcSoftService from "../../infrastructure/apis/ixcsoft/interfaces/IApiIxcSoftService";
import { clienteDto, consumosDto, faturaDto } from "../Dtos/clienteDto";
import IIxcSoftServices from "../interfaces/IIxcSoftServices";
import IProvedorRepository from "../../core/interfaces/IProvedorRepository";
import { boletos } from "../Dtos/boletosDto";
import { contrato, multiplos } from "../../infrastructure/apis/receitanet/responseModels/responseMultiContratos";
import { chamadoDto } from "../Dtos/chamadoDto";
import IPainelRepository from "../../core/interfaces/IPainelRepository";

@injectable()
export default class IxcSoftServices implements IIxcSoftServices{

    private readonly _apiIxcSoft:IApiIxcSoftService;
    private readonly _provedroRepository:IProvedorRepository;
    private readonly _painelRepository:IPainelRepository;
    constructor(
        @inject("IApiIxcSoftService")apiIxcSofit:IApiIxcSoftService,
        @inject("IProvedorRepository")provedorRepository:IProvedorRepository,
        @inject("IPainelRepository")painelRepository:IPainelRepository
    ){
        this._apiIxcSoft = apiIxcSofit;
        this._provedroRepository = provedorRepository;
        this._painelRepository = painelRepository;
    }

    async ObterDadosCliente(cpf:string, codigoProvedor: string, idContrato:number): Promise<clienteDto | multiplos | null> {

        const responseCliente = await this._apiIxcSoft.ObterClientePorCpfCnpj(cpf, codigoProvedor);
        // Cliente não encontrado no IXC pra esse CPF: a resposta vem sem
        // "registros" (não uma lista vazia), então sem essa defesa isso
        // quebrava com "Cannot read properties of undefined" em vez de
        // devolver null (que o controller já trata como "contrato inativo").
        const clientesAtivos = (responseCliente.registros ?? []).filter((s:any) => s.ativo === 'S');
        const cliente = clientesAtivos[0];

        if (!cliente) return null;

        const responseCidade = await this._apiIxcSoft.ObterCidade(cliente.cidade, codigoProvedor);
        const cidade = await responseCidade.registros[0];
        
        const responseUf = await this._apiIxcSoft.ObterUf(cliente.uf, codigoProvedor);
        const uf = await responseUf.registros[0]
        
        let responseContrato: any = null
        
        if(idContrato === undefined)
            responseContrato = await this._apiIxcSoft.ObterContratoPorIdCliente(cliente.id, codigoProvedor);
        else
            responseContrato = await this._apiIxcSoft.ObterContratoPorId(idContrato, codigoProvedor);        
        
        // Sem contrato encontrado, a resposta vem sem "registros" em vez de
        // lista vazia — sem essa defesa quebrava com "Cannot read properties
        // of undefined" em vez de devolver null/lista vazia.
        const contratos = (responseContrato.registros ?? []).filter((s:any) => s.status === 'A');

        if(contratos.length < 1)
            return null;

        if(contratos.length > 1){

            const multiplos:multiplos = {
                multiploCadastro:true,
                contratos: contratos.map((c:any) : contrato => {
                    return {
                       id: c.id,
                       nome: cliente.razao,
                       endereco: `${cliente.endereco} - ${cliente.numero}`,
                       bairro: cliente.bairro,
                       complemento: cliente.complemento,
                       cidade: cidade.nome,
                       uf: uf.sigla,
                       login: cpf
                       
                    }
                } )
            }

            return multiplos
        }

        const produto = await this._apiIxcSoft.ObterProdutoContrato(contratos[0].id_vd_contrato, codigoProvedor);
        const faturas = await this._apiIxcSoft.ObterFaturas(contratos[0].id, codigoProvedor);
        const loginUsuario = await this._apiIxcSoft.ObterLogin(codigoProvedor, contratos[0].id);
        const idLogin = loginUsuario.registros?.[0]?.id;
        const consumos = idLogin ? await this._apiIxcSoft.ObterConsumo(idLogin, codigoProvedor) : { registros: [] };
        const agora = new Date();

        // radusuarios_consumo_m devolve um registro por mês (às vezes mais de
        // um por causa de reprocessamento do IXC) — agrupa por mês/ano somando
        // os bytes, em vez de olhar só o mês atual, senão o gráfico do app
        // nunca mostra histórico (fica sempre um ponto só), diferente do
        // ReceitaNet que já devolve vários meses prontos.
        const porMes = new Map<string, { ano: number; mes: number; download: number; upload: number }>();
        for (const c of (consumos.registros ?? [])) {
            const data = new Date(c.data);
            if (Number.isNaN(data.getTime())) continue;
            const chave = `${data.getFullYear()}-${data.getMonth()}`;
            const acumulado = porMes.get(chave) ?? { ano: data.getFullYear(), mes: data.getMonth(), download: 0, upload: 0 };
            acumulado.download += Number(c.consumo) || 0;
            acumulado.upload += Number(c.consumo_upload) || 0;
            porMes.set(chave, acumulado);
        }

        // Últimos 4 meses (mesma quantidade do demo do ReceitaNet), mais
        // antigo primeiro — é a ordem que o gráfico do app espera.
        const historico = [...porMes.values()]
            .sort((a, b) => (a.ano - b.ano) || (a.mes - b.mes))
            .slice(-4);

        // Cliente sem consumo sincronizado ainda (contrato novo, IXC não
        // gerou registro do mês, etc.) — mostra 0 no mês atual em vez de
        // quebrar a tela inteira de dados do cliente por causa disso.
        if (historico.length === 0) historico.push({ ano: agora.getFullYear(), mes: agora.getMonth(), download: 0, upload: 0 });
        const clienteDto:clienteDto = {
            idContrato : contratos[0].id,
            dadosCadastrais :{
                nome: cliente.razao,
                cpfCnpj: cliente.cnpj_cpf,
                dataNascimento: cliente.data_nascimento,
                email: cliente.email,
                inscricao: cliente.ie_identidade,
        
            },
            endereco:{
                logradouro: `${cliente.endereco} - ${cliente.numero}`,
                complemento: cliente.complemento,
                bairro: cliente.bairro,
                cidade: cidade.nome,
                uf: uf.sigla,
                cep: cliente.cep                
            },
            plano: [{
                id: produto.id,
                descricao: produto.descricao,
                quantidade: produto.quantidade,
                valor: produto.valor.replace('R$', ''),
                total: produto.total,
            }],
            consumos: {
                consumoMensalLabels: historico.map((h) => `${h.mes + 1}/${h.ano}`),
                consumoMensalDown: historico.map((h) => Number.parseFloat((h.download / (1024 ** 3)).toFixed(1))),
                consumoMensalUp: historico.map((h) => Number.parseFloat((h.upload / (1024 ** 3)).toFixed(1))),
            },
            ultimasFaturas: await Promise.all((faturas.registros ?? []).map(async (fat:any) => {
                const pix = await this.ObterPixSeAberta(fat, codigoProvedor);
                const fatura:faturaDto = {
                    id: fat.id,
                    dataPagamento: fat.pagamento_data === '' ? null : fat.pagamento_data,
                    dataVencimento: fat.data_vencimento,
                    linhaDigitavel: fat.linha_digitavel,
                    linkFatura: fat.gateway_link,
                    linkFaturaPdf: await this.ObterLinkFaturaPdf(fat, codigoProvedor),
                    linkRecibo: "",
                    qrCode: pix.qrCode,
                    qrCodeImg: pix.qrCodeImg,
                    valor: fat.valor,
                    valorPago: fat.valor_recebido,
                }
                return fatura;
            }))
        }

        return clienteDto;
    }

    async ObterFaturas(idContrato:string, codigoProvedor:string) : Promise<boletos> {

        const faturasResponse = await this._apiIxcSoft.ObterFaturas(Number.parseInt(idContrato), codigoProvedor);

        const faturas = await Promise.all((faturasResponse.registros ?? []).map(async (fat:any) => {
            const pix = await this.ObterPixSeAberta(fat, codigoProvedor);
            const fatura:faturaDto = {
                id: fat.id,
                dataPagamento: fat.pagamento_data === '' ? null : fat.pagamento_data,
                dataVencimento: fat.data_vencimento,
                linhaDigitavel: fat.linha_digitavel,
                linkFatura: fat.gateway_link,
                linkFaturaPdf: await this.ObterLinkFaturaPdf(fat, codigoProvedor),
                linkRecibo: "",
                qrCode: pix.qrCode,
                qrCodeImg: pix.qrCodeImg,
                valor: Number.parseFloat(fat.valor),
                valorPago: Number.parseFloat(fat.valor_recebido),
            }
            return fatura;
        }));

        const boletos:boletos = {
            boletos: faturas
        };

        return boletos;
    }

    // PIX é buscado à parte (chamada extra na API do IXC) e só faz sentido pra fatura
    // realmente em aberto — evita gastar chamada em boleto já pago/cancelado.
    private async ObterPixSeAberta(fat:any, codigoProvedor:string) : Promise<{ qrCode:string|null; qrCodeImg:string|null }> {

        const aberta = fat.status === "A" && Number.parseFloat(fat.valor_aberto ?? fat.valor ?? "0") > 0;
        if (!aberta) return { qrCode: null, qrCodeImg: null };

        try {
            const resposta = await this._apiIxcSoft.ObterPix(Number.parseInt(fat.id), codigoProvedor);
            const qrCode = resposta?.pix?.qrCode?.qrcode ?? null;
            const imagem = resposta?.pix?.qrCode?.imagemQrcode ?? null;

            return {
                qrCode,
                qrCodeImg: imagem ? `data:image/svg+xml;base64,${imagem}` : null,
            };
        } catch {
            // PIX é um adicional sobre o boleto — se a chamada falhar, o cliente ainda
            // paga normalmente pela linha digitável.
            return { qrCode: null, qrCodeImg: null };
        }
    }

    // Fallback pra quando o boleto não tem gateway_link preenchido (alguns
    // gateways/configurações não geram esse link) — busca a 2ª via em PDF
    // (base64) via get_boleto e devolve como data URI, que o app já sabe
    // abrir do mesmo jeito que um link normal.
    private async ObterLinkFaturaPdf(fat:any, codigoProvedor:string) : Promise<string> {
        if (fat.gateway_link) return fat.gateway_link;

        try {
            const base64 = await this._apiIxcSoft.ObterBoletoArquivo(Number.parseInt(fat.id), codigoProvedor);
            return `data:application/pdf;base64,${base64}`;
        } catch {
            // Sem gateway_link e sem conseguir gerar a 2ª via — devolve vazio em
            // vez de quebrar a fatura inteira; a tela trata como "sem link".
            return "";
        }
    }

    async ObterContratos(cpf:string, codigoProvedor: string ) : Promise<string | multiplos> {
        
        const responseCliente = await this._apiIxcSoft.ObterClientePorCpfCnpj(cpf, codigoProvedor);
        const cliente = await responseCliente.registros[0]

        const responseContrato = await this._apiIxcSoft.ObterContratoPorId(cliente.id, codigoProvedor);
        // Sem contrato encontrado, a resposta vem sem "registros" em vez de
        // lista vazia — sem essa defesa quebrava com "Cannot read properties
        // of undefined" em vez de devolver null/lista vazia.
        const contratos = (responseContrato.registros ?? []).filter((s:any) => s.status === 'A');   
        
        if(contratos.length > 1){

            const multiplos:multiplos = {
                multiploCadastro: true,
                contratos: contratos
            }

            return multiplos
        }        

        return cpf;
        
    }
    
    async ObterToken(codigoProvedor: string): Promise<string> {
        const provedor = await this._provedroRepository.ObterProvedor(codigoProvedor);
        return this._apiIxcSoft.Token(provedor);
    }

    async ObterChamados(cpf: string, codigoProvedor: string): Promise<chamadoDto[]> {

        const responseCliente = await this._apiIxcSoft.ObterClientePorCpfCnpj(cpf, codigoProvedor);
        const cliente = responseCliente.registros[0];

        if (!cliente) return [];

        const responseOs = await this._apiIxcSoft.ObterOS(cliente.id, codigoProvedor);

        return (responseOs.registros ?? []).map((os: any): chamadoDto => ({
            id: Number.parseInt(os.id),
            protocolo: os.protocolo ?? "",
            descricao: os.mensagem ?? "",
            // F=Finalizado é o único status que a doc marca como "fechado" de fato —
            // os demais (aberto/análise/encaminhada/agendado/execução/reagendar) contam
            // como em aberto pro cliente.
            status: os.status === "F" ? "Fechado" : "Aberto",
            // não busca mensagens de cada OS aqui (custaria 1 chamada extra por item da
            // lista) — "nova resposta" só é checado quando o cliente abre o chamado.
            respostasStatus: 0,
            solucao: os.mensagem_resposta || undefined,
        }));
    }

    async AbrirNovoChamado(cpf: string, codigoProvedor: string, idAssunto: number, mensagem: string): Promise<number> {

        const config = await this._painelRepository.ObterIxcOsConfig(Number.parseInt(codigoProvedor));
        if (!config.id_filial || !config.setor)
            throw new Error("Abrir chamado ainda não foi configurado pra este provedor.");
        if (!idAssunto)
            throw new Error("Selecione o assunto do chamado.");

        const responseCliente = await this._apiIxcSoft.ObterClientePorCpfCnpj(cpf, codigoProvedor);
        const cliente = responseCliente.registros[0];
        if (!cliente)
            throw new Error("Cliente não encontrado.");

        const resultado = await this._apiIxcSoft.CriarOS({
            idCliente: cliente.id,
            idAssunto,
            idFilial: config.id_filial,
            setor: config.setor,
            mensagem,
        }, codigoProvedor);

        return Number.parseInt(resultado.id);
    }

    async ObterMensagensChamado(idChamado: number, codigoProvedor: string): Promise<any[]> {

        const response = await this._apiIxcSoft.ObterMensagensOS(idChamado, codigoProvedor);

        return (response.registros ?? []).map((m: any) => ({
            id: m.id,
            mensagem: m.mensagem ?? "",
            data: m.data ?? "",
            // sem campo explícito de autor na doc — usa a presença de id_tecnico como
            // sinal de que quem escreveu foi o suporte, não o cliente.
            // id_tecnico vem como string ("0" quando não há técnico), por isso o Number(...).
            origem: Number(m.id_tecnico) > 0 ? "suporte" : "cliente",
        }));
    }

    async EnviarMensagemChamado(idChamado: number, codigoProvedor: string, mensagem: string): Promise<void> {

        const config = await this._painelRepository.ObterIxcOsConfig(Number.parseInt(codigoProvedor));
        if (!config.id_evento_mensagem)
            throw new Error("Responder chamado ainda não foi configurado pra este provedor.");

        await this._apiIxcSoft.CriarMensagemOS({
            idChamado,
            idEvento: config.id_evento_mensagem,
            mensagem,
        }, codigoProvedor);
    }

    async ContarClientesAtivos(codigoProvedor: string): Promise<number> {
        return await this._apiIxcSoft.ContarClientesAtivos(codigoProvedor);
    }

    async ObterContratoPdf(idContrato: number, codigoProvedor: string): Promise<Buffer> {

        const config = await this._painelRepository.ObterIxcContratoConfig(Number.parseInt(codigoProvedor));
        if (!config.resource_imprimir)
            throw new Error("Visualização de contrato ainda não foi configurada pra este provedor.");

        const base64 = await this._apiIxcSoft.ImprimirContrato(idContrato, config.resource_imprimir, codigoProvedor);
        return Buffer.from(base64, "base64");
    }

    // Edita e-mail/telefone/celular do cadastro do cliente. Resolve cliente.id a
    // partir do CPF (mesma consulta usada em ObterDadosCliente) antes de editar,
    // já que a API do IXC exige o id, não o CPF, pra alterar.
    async AtualizarPerfil(cpf: string, codigoProvedor: string, dados: { email?: string; telefone?: string; celular?: string }): Promise<void> {

        const responseCliente = await this._apiIxcSoft.ObterClientePorCpfCnpj(cpf, codigoProvedor);
        const clientesAtivos = (responseCliente.registros ?? []).filter((s: any) => s.ativo === 'S');
        const cliente = clientesAtivos[0];

        if (!cliente)
            throw new Error("Cliente não encontrado no IXC.");

        await this._apiIxcSoft.AtualizarCliente(cliente.id, dados, codigoProvedor);
    }

    // Reinicia o roteador/ONU do cliente remotamente (Reboot ONU). Resolve
    // cliente -> contrato ativo -> registro da ONU (radpop_radio_cliente_fibra)
    // antes de chamar o botão configurado pelo provedor.
    async ReiniciarRoteador(cpf: string, codigoProvedor: string): Promise<void> {

        const config = await this._painelRepository.ObterIxcContratoConfig(Number.parseInt(codigoProvedor));
        if (!config.resource_reboot_onu)
            throw new Error("Reiniciar roteador ainda não foi configurado pra este provedor.");

        const responseCliente = await this._apiIxcSoft.ObterClientePorCpfCnpj(cpf, codigoProvedor);
        const clientesAtivos = (responseCliente.registros ?? []).filter((s: any) => s.ativo === 'S');
        const cliente = clientesAtivos[0];
        if (!cliente)
            throw new Error("Cliente não encontrado no IXC.");

        const responseContrato = await this._apiIxcSoft.ObterContratoPorIdCliente(cliente.id, codigoProvedor);
        const contratos = (responseContrato.registros ?? []).filter((c: any) => c.status === 'A');
        const contrato = contratos[0];
        if (!contrato)
            throw new Error("Contrato ativo não encontrado.");

        const responseFibra = await this._apiIxcSoft.ObterFibraPorContrato(contrato.id, codigoProvedor);
        const fibra = (responseFibra.registros ?? [])[0];
        if (!fibra)
            throw new Error("Equipamento (ONU) não encontrado pra este contrato.");

        await this._apiIxcSoft.ReiniciarOnu(fibra.id, config.resource_reboot_onu, codigoProvedor);
    }

    // Troca SSID/senha do WiFi (2.4GHz e/ou 5GHz). Resolve cliente -> contrato
    // ativo -> registro de Login (radusuarios) antes de editar.
    async AlterarSenhaWifi(cpf: string, codigoProvedor: string, dados: { ssidWifi?: string; senhaWifi?: string; ssidWifi5ghz?: string; senhaWifi5ghz?: string }): Promise<void> {

        const responseCliente = await this._apiIxcSoft.ObterClientePorCpfCnpj(cpf, codigoProvedor);
        const clientesAtivos = (responseCliente.registros ?? []).filter((s: any) => s.ativo === 'S');
        const cliente = clientesAtivos[0];
        if (!cliente)
            throw new Error("Cliente não encontrado no IXC.");

        const responseContrato = await this._apiIxcSoft.ObterContratoPorIdCliente(cliente.id, codigoProvedor);
        const contratos = (responseContrato.registros ?? []).filter((c: any) => c.status === 'A');
        const contrato = contratos[0];
        if (!contrato)
            throw new Error("Contrato ativo não encontrado.");

        const responseLogin = await this._apiIxcSoft.ObterLogin(codigoProvedor, contrato.id);
        const login = (responseLogin.registros ?? [])[0];
        if (!login)
            throw new Error("Login (conexão) não encontrado pra este contrato.");

        await this._apiIxcSoft.AtualizarLogin(login.id, dados, codigoProvedor);
    }

}