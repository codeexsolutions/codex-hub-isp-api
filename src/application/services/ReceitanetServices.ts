import { inject, injectable } from "tsyringe";
import IReceitanetServices from "../interfaces/IReceitanetServicest";
import { clienteDto, faturaDto } from "../Dtos/clienteDto";
import IApiReceitanetServices from "../../infrastructure/apis/receitanet/interface/IApiReceitanetServices";
import { boletos } from "../Dtos/boletosDto";
import Chamado from "../../core/domains/Chamado";
import { chamadoDto, payload } from "../Dtos/chamadoDto";
import { requestParaClienteDtotMapper } from "../../api/shared/mapper";
import { chamado, responseChamados } from "../../infrastructure/apis/receitanet/responseModels/responseChamados";

@injectable()
export default class ReceitanetServices implements IReceitanetServices {
    
    private readonly _servicesReceitaNet:IApiReceitanetServices

    constructor(@inject("IApiReceitanetServices")serviceReceitaNet:IApiReceitanetServices){
        this._servicesReceitaNet = serviceReceitaNet;
    }

    async ObterDadosCliente(token: string): Promise<clienteDto> {
        
        const clienteResponse = await this._servicesReceitaNet.ObterResumoCliente(token);
        
        return requestParaClienteDtotMapper(clienteResponse)
    }

    async ObterFaturas(token:string) : Promise<boletos> {

        const response = await this._servicesReceitaNet.ObterFaturas(token);
        const boletos: boletos = {
            boletos: response.boletos.map( (fat:any ) => {
                const faturas:faturaDto = {
                    id: fat.id,
                    dataPagamento: fat.data_pagamento,
                    dataVencimento: fat.data_vencimento,
                    valor: fat.valor,
                    valorPago: fat.valor_pago,
                    linhaDigitavel: fat.linha_digitavel,
                    linkFatura: fat.link_fatura,
                    linkFaturaPdf: fat.link_fatura_pdf,
                    linkRecibo: fat.link_recibo,
                    qrCode: fat.qrcode,
                    qrCodeImg: fat.qrcode_img
                }
                return faturas;
            })
        }

        return boletos;
    
    }

    // O endpoint cliente/contrato do ReceitaNet pode devolver o PDF direto (binário)
    // ou um JSON com o link do arquivo — normaliza os dois formatos possíveis pra
    // sempre entregar algo que o app consiga abrir/baixar.
    async ObterContrato(token:string) : Promise<{ link?:string; buffer?:Buffer; contentType?:string }> {

        const resposta = await this._servicesReceitaNet.ObterContrato(token);

        if (resposta?.buffer) {
            return { buffer: resposta.buffer, contentType: resposta.contentType };
        }

        const link = resposta?.link_contrato ?? resposta?.link ?? resposta?.url
            ?? resposta?.contrato_pdf ?? resposta?.link_pdf ?? resposta?.arquivo;

        if (!link)
            throw new Error("Contrato não disponível para este cliente.");

        return { link };
    }

    async NotificarPagamento(token:string) : Promise<{ success:boolean; date:string }> {
        return await this._servicesReceitaNet.NotificarPagamento(token);
    }

    async ObterChamados(token:string) : Promise<chamadoDto[]> {

        const chamados = await this._servicesReceitaNet.ObterChamados(token);

        return chamados.chamados.map((chamado:chamado) => {
            const chamadoDto:chamadoDto = {
                id: chamado.id,
                descricao: chamado.descricao,
                protocolo: chamado.protocolo,
                status:  chamado.is_aberto ? "Aberto" : "Fechado",
                respostasStatus: chamado.respostas_status
            }
            return chamadoDto
        })
    }    

    async AbrirNovoChamado(token:string, payload:payload) : Promise<number> {
        payload.dataAbertura = new Date().toLocaleDateString("pt-BR")
        const descricaoChamado: string = `Assunto: ${payload.assunto}\nCategoria: ${payload.categoria}\nDescrição: ${payload.descricao}\nData Abertura: ${payload.dataAbertura}`
        const ok = await this._servicesReceitaNet.AbrirChamado(token, descricaoChamado);
        if(!ok) 
            throw new Error("Erro ao abrir o chamado");
        const chamados = await this.ObterChamados(token);
        const chamado = chamados.filter(ch => Math.max(ch.id))
        return chamado[0].id;
    }

    async EnviarRespostaChamado(token:string, idChamado:number, mensagem:string) : Promise<any>{
        const mensagemEnviada = await this._servicesReceitaNet.EnviarRespostaChamado(token, idChamado, mensagem);
        if(mensagemEnviada)
            return "Mensagem Enviada."
        throw new Error("Erro ao enviar a menssagem.")
    }
    
    async RespostasDoChamado(token: string, idChamado: number): Promise<any> {

        const respostas = await this._servicesReceitaNet.RespostasDoChamado(token, idChamado)
        return respostas;
    }
}