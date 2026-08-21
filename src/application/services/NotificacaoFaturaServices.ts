import { inject, injectable } from "tsyringe";
import INotificacaoFaturaServices from "../interfaces/INotificacaoFaturaServices";
import INotificacaoFaturaRepository from "../../core/interfaces/INotificacaoFaturaRepository";
import IProvedorRepository from "../../core/interfaces/IProvedorRepository";
import IIxcSoftServices from "../interfaces/IIxcSoftServices";
import IReceitanetServices from "../interfaces/IReceitanetServicest";
import ITokenService from "../interfaces/ITokenService";
import IPushNotificationServices from "../interfaces/IPushNotificationServices";
import { eGerenciador } from "../../common/enuns/egerenciador";
import { faturaDto } from "../Dtos/clienteDto";
import { notificacaoDto } from "../Dtos/pushSubscriptionDto";

type tipoAviso = "D3" | "HOJE" | "D1";

@injectable()
export default class NotificacaoFaturaServices implements INotificacaoFaturaServices {

    private readonly _notificacaoFaturaRepository:INotificacaoFaturaRepository;
    private readonly _provedorRepository:IProvedorRepository;
    private readonly _ixcSoftServices:IIxcSoftServices;
    private readonly _receitanetServices:IReceitanetServices;
    private readonly _tokenService:ITokenService;
    private readonly _pushNotificationServices:IPushNotificationServices;

    constructor(
        @inject("INotificacaoFaturaRepository") notificacaoFaturaRepository:INotificacaoFaturaRepository,
        @inject("IProvedorRepository") provedorRepository:IProvedorRepository,
        @inject("IIxcSoftServices") ixcSoftServices:IIxcSoftServices,
        @inject("IReceitanetServices") receitanetServices:IReceitanetServices,
        @inject("ITokenService") tokenService:ITokenService,
        @inject("IPushNotificationServices") pushNotificationServices:IPushNotificationServices
    ){
        this._notificacaoFaturaRepository = notificacaoFaturaRepository;
        this._provedorRepository = provedorRepository;
        this._ixcSoftServices = ixcSoftServices;
        this._receitanetServices = receitanetServices;
        this._tokenService = tokenService;
        this._pushNotificationServices = pushNotificationServices;
    }

    async VerificarFaturasTodos(): Promise<number> {

        const assinantes = await this._notificacaoFaturaRepository.ListarAssinantesComPush();
        let enviadas = 0;

        for (const assinante of assinantes) {

            try {

                const provedor = await this._provedorRepository.ObterProvedor(assinante.codigoProvedor);
                if (!provedor) continue;

                const faturas = await this.ObterFaturasDoCliente(assinante.cpf, assinante.codigoProvedor, provedor.Gerenciador);

                for (const fatura of faturas) {

                    const aviso = this.ObterTipoAviso(fatura);
                    if (!aviso) continue;

                    const faturaId = String(fatura.id);
                    const jaNotificado = await this._notificacaoFaturaRepository.JaNotificado(assinante.cpf, assinante.codigoProvedor, faturaId, aviso);
                    if (jaNotificado) continue;

                    await this._pushNotificationServices.NotificarCliente(assinante.cpf, assinante.codigoProvedor, this.MontarPayload(aviso, fatura));
                    await this._notificacaoFaturaRepository.RegistrarNotificacao(assinante.cpf, assinante.codigoProvedor, faturaId, aviso);
                    enviadas++;
                }

            } catch (error) {
                console.error(`Erro ao verificar faturas de ${assinante.cpf} (provedor ${assinante.codigoProvedor}):`, error);
            }
        }

        return enviadas;
    }

    private async ObterFaturasDoCliente(cpf:string, codigoProvedor:string, gerenciador:eGerenciador) : Promise<faturaDto[]> {

        if (gerenciador === eGerenciador.IXCSOFT) {

            const dados = await this._ixcSoftServices.ObterDadosCliente(cpf, codigoProvedor, undefined as any);
            if (!dados) return [];

            if (!("dadosCadastrais" in dados) && dados.multiploCadastro) {
                const todas:faturaDto[] = [];
                for (const contrato of dados.contratos) {
                    const boletos = await this._ixcSoftServices.ObterFaturas(String(contrato.id), codigoProvedor);
                    todas.push(...boletos.boletos);
                }
                return todas;
            }

            return ("dadosCadastrais" in dados ? dados.ultimasFaturas : undefined) ?? [];
        }

        const tokenDto = await this._tokenService.ObterToken(codigoProvedor, cpf);
        if (!tokenDto.provedorAtivo) return [];

        if (tokenDto.multiploCadastro && tokenDto.contratos?.length) {
            const todas:faturaDto[] = [];
            for (const contrato of tokenDto.contratos) {
                const tokenContrato = await this._tokenService.TokenPorContrato(codigoProvedor, cpf, String(contrato.id));
                if (!tokenContrato.token) continue;
                const boletos = await this._receitanetServices.ObterFaturas(tokenContrato.token);
                todas.push(...boletos.boletos);
            }
            return todas;
        }

        if (!tokenDto.token) return [];
        const boletos = await this._receitanetServices.ObterFaturas(tokenDto.token);
        return boletos.boletos;
    }

    private ObterTipoAviso(fatura:faturaDto) : tipoAviso | null {

        if (fatura.dataPagamento || !fatura.dataVencimento) return null;

        const [ano, mes, dia] = fatura.dataVencimento.split("-").map(Number);
        const vencimentoUTC = Date.UTC(ano, mes - 1, dia);

        const agora = new Date();
        const hojeUTC = Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate());

        const diasParaVencer = Math.round((vencimentoUTC - hojeUTC) / 86400000);

        if (diasParaVencer === 3) return "D3";
        if (diasParaVencer === 0) return "HOJE";
        if (diasParaVencer === -1) return "D1";
        return null;
    }

    private MontarPayload(aviso:tipoAviso, fatura:faturaDto) : notificacaoDto {

        const valor = `R$ ${Number(fatura.valor).toFixed(2).replace(".", ",")}`;
        const [ano, mes, dia] = String(fatura.dataVencimento).split("-");
        const dataBR = `${dia}/${mes}/${ano}`;

        const textos: Record<tipoAviso, { title:string; body:string }> = {
            D3: { title: "Fatura próxima do vencimento", body: `Sua fatura de ${valor} vence em 3 dias (${dataBR}).` },
            HOJE: { title: "Fatura vence hoje", body: `Sua fatura de ${valor} vence hoje (${dataBR}).` },
            D1: { title: "Fatura em atraso", body: `Sua fatura de ${valor} venceu ontem (${dataBR}). Evite a suspensão do serviço.` },
        };

        const texto = textos[aviso];

        return {
            title: texto.title,
            body: texto.body,
            icon: "",
        };
    }
}
