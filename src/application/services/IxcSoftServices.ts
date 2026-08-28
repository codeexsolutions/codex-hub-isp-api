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
        const cliente = await responseCliente.registros.filter((s:any) => s.ativo === 'S');

        const responseCidade = await this._apiIxcSoft.ObterCidade(cliente.cidade, codigoProvedor);
        const cidade = await responseCidade.registros[0];
        
        const responseUf = await this._apiIxcSoft.ObterUf(cliente.uf, codigoProvedor);
        const uf = await responseUf.registros[0]
        
        let responseContrato: any = null
        
        if(idContrato === undefined)
            responseContrato = await this._apiIxcSoft.ObterContratoPorIdCliente(cliente.id, codigoProvedor);
        else
            responseContrato = await this._apiIxcSoft.ObterContratoPorId(idContrato, codigoProvedor);        
        
        const contratos = await responseContrato.registros.filter((s:any) => s.status === 'A');

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
        const consumos = await this._apiIxcSoft.ObterConsumo(loginUsuario.registros[0].id, codigoProvedor);
        const agora = new Date();
        const consumoMes = consumos.registros.filter((c: any) => {
                const data = new Date(c.data);

                return (
                    data.getMonth() === agora.getMonth() &&
                    data.getFullYear() === agora.getFullYear()
                );
            });
       
        const download = (Number(consumoMes[0].consumo) / (1024 ** 3)).toFixed(1); 
        const upload = (Number(consumoMes[0].consumo_upload) / (1024 ** 3)).toFixed(1); 
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
                consumoMensalLabels :  [`${new Date(consumoMes[0].data).getMonth()}/${new Date(consumoMes[0].data).getFullYear()}`],
                consumoMensalDown :  [Number.parseFloat(download)],
                consumoMensalUp : [Number.parseFloat(upload)]
            },
            ultimasFaturas: await Promise.all((faturas.registros ?? []).map(async (fat:any) => {
                const pix = await this.ObterPixSeAberta(fat, codigoProvedor);
                const fatura:faturaDto = {
                    id: fat.id,
                    dataPagamento: fat.pagamento_data === '' ? null : fat.pagamento_data,
                    dataVencimento: fat.data_vencimento,
                    linhaDigitavel: fat.linha_digitavel,
                    linkFatura: fat.gateway_link,
                    linkFaturaPdf: fat.gateway_link,
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
                linkFaturaPdf: fat.gateway_link,
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

    async ObterContratos(cpf:string, codigoProvedor: string ) : Promise<string | multiplos> {
        
        const responseCliente = await this._apiIxcSoft.ObterClientePorCpfCnpj(cpf, codigoProvedor);
        const cliente = await responseCliente.registros[0]

        const responseContrato = await this._apiIxcSoft.ObterContratoPorId(cliente.id, codigoProvedor);
        const contratos = await responseContrato.registros.filter((s:any) => s.status === 'A');   
        
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

    async ObterContratoPdf(idContrato: number, codigoProvedor: string): Promise<Buffer> {

        const config = await this._painelRepository.ObterIxcContratoConfig(Number.parseInt(codigoProvedor));
        if (!config.resource_imprimir)
            throw new Error("Visualização de contrato ainda não foi configurada pra este provedor.");

        const base64 = await this._apiIxcSoft.ImprimirContrato(idContrato, config.resource_imprimir, codigoProvedor);
        return Buffer.from(base64, "base64");
    }

}