import { inject, injectable } from "tsyringe";
import { Request, Response } from "express";
import IReceitanetServices from "../../application/interfaces/IReceitanetServicest";
import { reqBodyDadosClienteDto } from "../../application/Dtos/reqBodyDadosClienteDto";
import { eGerenciador } from "../../common/enuns/egerenciador";
import { retornoPadrao } from "../../application/Dtos/retornoPadrao";
import { clienteDto } from "../../application/Dtos/clienteDto";
import IIxcSoftServices from "../../application/interfaces/IIxcSoftServices";
import { multiplos } from "../../infrastructure/apis/receitanet/responseModels/responseMultiContratos";
import IProvedorServices from "../../application/interfaces/IProvedorServices";

@injectable()
export default class ClienteController {

    private readonly _receitaNetService:IReceitanetServices;
    private readonly _ixcSoftService:IIxcSoftServices;
    private readonly _provedorService:IProvedorServices;

    constructor(
        @inject("IReceitanetServices")receitaNetService:IReceitanetServices,
        @inject("IIxcSoftServices")ixcSoftService:IIxcSoftServices,
        @inject("IProvedorServices")provedorService:IProvedorServices
    ){
        this._receitaNetService = receitaNetService;
        this._ixcSoftService = ixcSoftService;
        this._provedorService = provedorService;
    }

    async ObterDadosCliente(req:Request, res:Response){

        const data:reqBodyDadosClienteDto = req.body;
        try {
            
            if(data.gerenciador === eGerenciador.RECEITANET){
                const result = await this._receitaNetService.ObterDadosCliente(data.token);

                this._provedorService.RegistrarLoginCliente(data.codigoProvedor, data.cpfCnpj, result.dadosCadastrais?.nome ?? "").catch(() => {});

                const retorno: retornoPadrao<clienteDto> = {
                    statusCode:200,
                    message:"Dados Cliente "+ data.gerenciador,
                    data: result
                }

                return res.json(retorno);
            }

            if(data.gerenciador === eGerenciador.IXCSOFT){
                const result = await this._ixcSoftService.ObterDadosCliente(data.cpfCnpj, data.codigoProvedor, data.contratoId as number)

                if(result === null){
                    const retorno: retornoPadrao<any> = {
                        statusCode:400,
                        message:"Dados Cliente "+ data.gerenciador,
                        data: "Cliente com contrato inativo"
                }

                return res.status(400).json(retorno);
                }

                this._provedorService.RegistrarLoginCliente(data.codigoProvedor, data.cpfCnpj, (result as any).dadosCadastrais?.nome ?? "").catch(() => {});

                const retorno: retornoPadrao<clienteDto|multiplos> = {
                    statusCode:200,
                    message:"Dados Cliente "+ data.gerenciador,
                    data: result
                }

                return res.json(retorno);
            }
        } catch (error:any) {

            const retorno: retornoPadrao<any> = {
                statusCode:500,
                message:"Dados Cliente "+ data.gerenciador,
                data: error.message
            }
            
            return res.status(500).json(retorno);
        }
    }

    // Sempre devolve { link }, pro app abrir numa nova aba (visualizar/baixar), igual
    // já é feito hoje com fatura.linkFaturaPdf. Se o ReceitaNet devolver o PDF em
    // binário (em vez de um link), aponta pra rota de streaming abaixo em vez de
    // mandar o binário direto — assim o front não precisa tratar os dois casos.
    async ObterContrato(req:Request, res:Response){

        const data = req.body;

        if (data.gerenciador === eGerenciador.IXCSOFT.toString()) {
            if (!data.idContrato) {
                const retorno: retornoPadrao<string> = {
                    statusCode: 400,
                    message: "Contrato indisponível",
                    data: "Contrato não identificado."
                }
                return res.status(400).json(retorno);
            }

            const link = `${req.protocol}://${req.get("host")}/v1/cliente/contrato/pdf?gerenciador=${eGerenciador.IXCSOFT}&codigoProvedor=${encodeURIComponent(data.codigoProvedor)}&idContrato=${encodeURIComponent(data.idContrato)}`;
            const retorno: retornoPadrao<{ link:string }> = {
                statusCode: 200,
                message: "Contrato "+ data.gerenciador,
                data: { link }
            }
            return res.json(retorno);
        }

        if(data.gerenciador !== eGerenciador.RECEITANET){
            const retorno: retornoPadrao<string> = {
                statusCode: 400,
                message: "Contrato indisponível",
                data: "Visualização de contrato ainda não disponível para este gerenciador."
            }
            return res.status(400).json(retorno);
        }

        try {
            const contrato = await this._receitaNetService.ObterContrato(data.token);

            const link = contrato.link ?? `${req.protocol}://${req.get("host")}/v1/cliente/contrato/pdf?token=${encodeURIComponent(data.token)}`;
            console.log(link)
            const retorno: retornoPadrao<{ link:string }> = {
                statusCode: 200,
                message: "Contrato "+ data.gerenciador,
                data: { link }
            }
            return res.json(retorno);

        } catch (error:any) {
            const retorno: retornoPadrao<string> = {
                statusCode: 500,
                message: "Contrato "+ data.gerenciador,
                data: error.message
            }
            return res.status(500).json(retorno);
        }
    }

    // Streaming direto do PDF (fallback pro caso do ReceitaNet devolver o
    // binário em vez de um link) — usada como href quando ObterContrato não
    // recebe um link pronto do gerenciador.
    async ObterContratoPdf(req:Request, res:Response){

        if (req.query.gerenciador === eGerenciador.IXCSOFT.toString()) {
            const codigoProvedor = req.query.codigoProvedor as string;
            const idContrato = Number.parseInt(req.query.idContrato as string);

            try {
                const buffer = await this._ixcSoftService.ObterContratoPdf(idContrato, codigoProvedor);
                res.set("Content-Type", "application/pdf");
                res.set("Content-Disposition", "inline; filename=contrato.pdf");
                return res.status(200).send(buffer);
            } catch (error:any) {
                return res.status(500).json({ statusCode: 500, message: "Contrato", data: error.message });
            }
        }

        const token = req.query.token as string;

        try {
            const contrato = await this._receitaNetService.ObterContrato(token);

            if (!contrato.buffer) {
                if (contrato.link)
                    return res.redirect(contrato.link);
                return res.status(404).json({ statusCode: 404, message: "Contrato não encontrado", data: null });
            }

            res.set("Content-Type", contrato.contentType || "application/pdf");
            res.set("Content-Disposition", "inline; filename=contrato.pdf");
            return res.status(200).send(contrato.buffer);

        } catch (error:any) {
            return res.status(500).json({ statusCode: 500, message: "Contrato", data: error.message });
        }
    }

    // "Desbloqueio de confiança" — módulo vendável (ativação pela tela de admin,
    // igual "beneficios"). Cliente avisa que já pagou pra liberar o acesso antes
    // da baixa automática do gerenciador confirmar o pagamento.
    async NotificarPagamento(req:Request, res:Response){

        const data = req.body;

        if(data.gerenciador !== eGerenciador.RECEITANET){
            const retorno: retornoPadrao<string> = {
                statusCode: 400,
                message: "Desbloqueio indisponível",
                data: "Desbloqueio de confiança ainda não disponível para este gerenciador."
            }
            return res.status(400).json(retorno);
        }

        try {
            const modulos = await this._provedorService.ObterModulosAtivos(data.codigoProvedor);
            if(!modulos.includes("desbloqueio_confianca")){
                const retorno: retornoPadrao<string> = {
                    statusCode: 403,
                    message: "Módulo não ativo",
                    data: "Desbloqueio de confiança não está ativo para este provedor."
                }
                return res.status(403).json(retorno);
            }

            const resultado = await this._receitaNetService.NotificarPagamento(data.token);

            const retorno: retornoPadrao<{ success:boolean; date:string }> = {
                statusCode: 200,
                message: "Pagamento notificado",
                data: resultado
            }
            return res.json(retorno);

        } catch (error:any) {
            const retorno: retornoPadrao<string> = {
                statusCode: 500,
                message: "Desbloqueio de confiança",
                data: error.message
            }
            return res.status(500).json(retorno);
        }
    }

    async ObterFaturas(req:Request, res:Response){

        const data = req.body;
        if(data.gerenciador === eGerenciador.RECEITANET){

            const faturas = await this._receitaNetService.ObterFaturas(data.data.token)
            const retorno: retornoPadrao<any> = {
                    statusCode:200,
                    message:"Faturas "+ data.gerenciador,
                    data: faturas 
                }
    
                return res.json(retorno);
        }

        if(data.token.gerenciador === eGerenciador.IXCSOFT){

            const faturas = await this._ixcSoftService.ObterFaturas(data.idContrato, data.token.codigoProvedor);
            const retorno: retornoPadrao<any> = {
                    statusCode:200,
                    message:"Faturas "+ data.gerenciador,
                    data: faturas 
                }
    
            return res.json(retorno);
        }
    }
}