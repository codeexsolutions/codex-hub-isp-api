import { inject, injectable } from "tsyringe";
import IReceitanetServices from "../../application/interfaces/IReceitanetServicest";
import IIxcSoftServices from "../../application/interfaces/IIxcSoftServices";
import { abrirChamadoRequest, chamadoDto } from "../../application/Dtos/chamadoDto";
import { retornoPadrao } from "../../application/Dtos/retornoPadrao";
import { Request, Response } from "express";
import { boletos } from "../../application/Dtos/boletosDto";
import { eGerenciador } from "../../common/enuns/egerenciador";
import INotificacaoPainelServices from "../../application/interfaces/INotificacaoPainelServices";
@injectable()
export default class ChamadoController{

    private readonly _receitaNetService:IReceitanetServices;
    private readonly _ixcSoftService:IIxcSoftServices;
    private readonly _notificacaoPainelService:INotificacaoPainelServices;

    constructor(
        @inject("IReceitanetServices")receitaNetService:IReceitanetServices,
        @inject("IIxcSoftServices")ixcSoftService:IIxcSoftServices,
        @inject("INotificacaoPainelServices")notificacaoPainelService:INotificacaoPainelServices
    ){
        this._receitaNetService = receitaNetService;
        this._ixcSoftService = ixcSoftService;
        this._notificacaoPainelService = notificacaoPainelService;
    }

    // Avisa o provedor no painel — a abertura do chamado (IXC ou ReceitaNet)
    // sempre passa por aqui, então é o único lugar onde dá pra saber que um
    // cliente abriu um chamado assim que acontece (nenhum dos dois
    // gerenciadores avisa o provedor sozinho).
    private avisarProvedorNovoChamado(codigoProvedor:string|undefined, assunto:string) {
        if (!codigoProvedor) return;
        this._notificacaoPainelService
            .Avisar(codigoProvedor, "chamado_novo", "Novo chamado aberto", assunto || "Um cliente abriu um chamado novo.")
            .catch((error) => console.error("Erro ao avisar provedor sobre chamado novo:", error));
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

                this.avisarProvedorNovoChamado(data.codigoProvedor, payload.assunto);

                const retorno: retornoPadrao<number> = {
                    statusCode: 200,
                    message: "OS aberta com sucesso.",
                    data: idOs
                }
                return res.json(retorno);
            }

            const protocolo = await this._receitaNetService.AbrirNovoChamado(data.token, data.payload);

            this.avisarProvedorNovoChamado(data.codigoProvedor, (data.payload as any)?.assunto);

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

        try {
            const chamados = data.gerenciador === eGerenciador.IXCSOFT.toString()
                ? await this._ixcSoftService.ObterChamados(data.cpfCnpj, data.codigoProvedor)
                : await this._receitaNetService.ObterChamados(data.token);

            const retorno: retornoPadrao<chamadoDto[]> = {
                statusCode:200,
                message:"Chamados",
                data: chamados
            }

            return res.json(retorno);
        } catch (error) {
            // Gerenciador (ReceitaNet/IXC) fora do ar ou sessão expirada não pode
            // derrubar a tela de Suporte inteira — mostra "nenhum chamado" em vez
            // de erro genérico.
            console.error("Erro ao obter chamados:", error);
            const retorno: retornoPadrao<chamadoDto[]> = {
                statusCode:200,
                message:"Chamados",
                data: []
            }
            return res.json(retorno);
        }

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