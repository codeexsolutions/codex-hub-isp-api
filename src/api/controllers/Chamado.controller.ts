import { inject, injectable } from "tsyringe";
import IReceitanetServices from "../../application/interfaces/IReceitanetServicest";
import IIxcSoftServices from "../../application/interfaces/IIxcSoftServices";
import { abrirChamadoRequest, chamadoDto } from "../../application/Dtos/chamadoDto";
import { retornoPadrao } from "../../application/Dtos/retornoPadrao";
import { Request, Response } from "express";
import { boletos } from "../../application/Dtos/boletosDto";
import { eGerenciador } from "../../common/enuns/egerenciador";
@injectable()
export default class ChamadoController{

    private readonly _receitaNetService:IReceitanetServices;
    private readonly _ixcSoftService:IIxcSoftServices;

    constructor(@inject("IReceitanetServices")receitaNetService:IReceitanetServices, @inject("IIxcSoftServices")ixcSoftService:IIxcSoftServices){
        this._receitaNetService = receitaNetService;
        this._ixcSoftService = ixcSoftService;
    }

    async AbrirNovoChamados(req:Request, res: Response){

        const data:abrirChamadoRequest = req.body;

        try {

            if (data.gerenciador === eGerenciador.IXCSOFT.toString()) {

                const payload = data.payload as any;
                const mensagem = `Assunto: ${payload.assunto}\nDescrição: ${payload.descricao}`;
                const idOs = await this._ixcSoftService.AbrirNovoChamado(
                    data.cpfCnpj as string,
                    data.codigoProvedor as string,
                    Number.parseInt(payload.idAssunto),
                    mensagem
                );

                const retorno: retornoPadrao<number> = {
                    statusCode: 200,
                    message: "OS aberta com sucesso.",
                    data: idOs
                }
                return res.json(retorno);
            }

            const protocolo = await this._receitaNetService.AbrirNovoChamado(data.token, data.payload);

            const retorno: retornoPadrao<number> = {
                                statusCode:200,
                                message:"Dados Cliente ",
                                data: protocolo
                            }

            return res.json(retorno);

        } catch (error:any) {
            const retorno: retornoPadrao<string> = {
                statusCode: 400,
                message: error.message,
                data: error.message
            }
            return res.status(400).json(retorno);
        }

    }
    async ObterChamados(req:Request, res: Response){

        const data = req.body;

        const chamados = data.gerenciador === eGerenciador.IXCSOFT.toString()
            ? await this._ixcSoftService.ObterChamados(data.cpfCnpj, data.codigoProvedor)
            : await this._receitaNetService.ObterChamados(data.token);

        const retorno: retornoPadrao<chamadoDto[]> = {
            statusCode:200,
            message:"Chamados",
            data: chamados
        }

        return res.json(retorno);

    }

    async EnviarMensagmChamado(req: Request, res: Response){
        const data = req.body;

        try {

            if (data.token?.gerenciador === eGerenciador.IXCSOFT.toString()) {
                await this._ixcSoftService.EnviarMensagemChamado(data.idChamado, data.token.codigoProvedor, data.mensagem);

                const retorno: retornoPadrao<string> = {
                    statusCode: 200,
                    message: "Mensagem enviada",
                    data: "ok"
                }
                return res.json(retorno);
            }

            const mensagemEnviada = await this._receitaNetService.EnviarRespostaChamado(data.token.token, data.idChamado, data.mensagem);

            const retorno: retornoPadrao<string> = {
                statusCode:200,
                message:"Mensagem enviada",
                data: mensagemEnviada
            }

            return res.json(retorno);

        } catch (error:any) {
            const retorno: retornoPadrao<string> = {
                statusCode: 400,
                message: error.message,
                data: error.message
            }
            return res.status(400).json(retorno);
        }
    }

    async ReceberRespostasChamado(req:Request, res:Response){
        const data = req.body;

        try {

            if (data.token?.gerenciador === eGerenciador.IXCSOFT.toString()) {
                const respostas = await this._ixcSoftService.ObterMensagensChamado(data.idChamado, data.token.codigoProvedor);

                const retorno: retornoPadrao<any[]> = {
                    statusCode: 200,
                    message: "Respostas",
                    data: respostas
                }
                return res.json(retorno);
            }

            const respostas = await this._receitaNetService.RespostasDoChamado(data.token.token, data.idChamado);

            const retorno: retornoPadrao<string> = {
                statusCode:200,
                message:"Respostas",
                data: respostas
            }

            return res.json(retorno);

        } catch (error:any) {
            const retorno: retornoPadrao<string> = {
                statusCode: 400,
                message: error.message,
                data: error.message
            }
            return res.status(400).json(retorno);
        }
    }
}