import { injectable, inject } from "tsyringe";
import { abrirChamadoRequest, chamadoDto } from "../../application/Dtos/chamadoDto";
import { retornoPadrao } from "../../application/Dtos/retornoPadrao";
import { Request, Response } from "express";
import INotificacaoPainelServices from "../../application/interfaces/INotificacaoPainelServices";
import ChamadoProviderFactory from "../../infrastructure/providers/chamado/ChamadoProviderFactory";
import { sessaoChamado } from "../../core/contracts/chamado/IChamadoProvider";

@injectable()
export default class ChamadoController{

    private readonly _notificacaoPainelService:INotificacaoPainelServices;
    private readonly _chamadoProviderFactory:ChamadoProviderFactory;

    constructor(
        @inject("INotificacaoPainelServices")notificacaoPainelService:INotificacaoPainelServices,
        @inject(ChamadoProviderFactory) chamadoProviderFactory:ChamadoProviderFactory
    ){
        this._notificacaoPainelService = notificacaoPainelService;
        this._chamadoProviderFactory = chamadoProviderFactory;
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
            const sessao:sessaoChamado = {
                gerenciador: data.gerenciador,
                token: data.token,
                cpfCnpj: data.cpfCnpj,
                codigoProvedor: data.codigoProvedor,
            };
            const provider = this._chamadoProviderFactory.criar(data.gerenciador);
            const idOuProtocolo = await provider.abrir(sessao, data.payload as any);

            this.avisarProvedorNovoChamado(data.codigoProvedor, (data.payload as any)?.assunto);

            const retorno: retornoPadrao<number> = {
                statusCode: 200,
                message: "OS aberta com sucesso.",
                data: idOuProtocolo
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
            const sessao:sessaoChamado = {
                gerenciador: data.gerenciador,
                token: data.token,
                cpfCnpj: data.cpfCnpj,
                codigoProvedor: data.codigoProvedor,
            };
            const provider = this._chamadoProviderFactory.criar(data.gerenciador);
            const chamados = await provider.listar(sessao);

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
            const sessao:sessaoChamado = {
                gerenciador: data.token?.gerenciador,
                token: data.token?.token,
                cpfCnpj: data.token?.cpfCnpj,
                codigoProvedor: data.token?.codigoProvedor,
            };
            const provider = this._chamadoProviderFactory.criar(sessao.gerenciador);
            await provider.enviarMensagem(sessao, data.idChamado, data.mensagem);

            const retorno: retornoPadrao<string> = {
                statusCode:200,
                message:"Mensagem enviada",
                data: "ok"
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
            const sessao:sessaoChamado = {
                gerenciador: data.token?.gerenciador,
                token: data.token?.token,
                cpfCnpj: data.token?.cpfCnpj,
                codigoProvedor: data.token?.codigoProvedor,
            };
            const provider = this._chamadoProviderFactory.criar(sessao.gerenciador);
            const respostas = await provider.obterMensagens(sessao, data.idChamado);

            const retorno: retornoPadrao<any[]> = {
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
