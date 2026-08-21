import { inject, injectable } from "tsyringe";
import IPushNotificationServices from "../../application/interfaces/IPushNotificationServices";
import { AuthRequest } from "../middleware/IAuthRequest";
import {Request, Response } from "express";
import { notificacaoDto, pushSubscriptionDto } from "../../application/Dtos/pushSubscriptionDto";
import { retornoPadrao } from "../../application/Dtos/retornoPadrao";

@injectable()
export default class NotificationsController {
    
    private readonly _service:IPushNotificationServices;

    constructor(@inject("IPushNotificationServices")notificationService:IPushNotificationServices){
        this._service = notificationService;
    }

    async Salvar(req: Request, res: Response){

        const data = req.body as pushSubscriptionDto;

        const result = await this._service.Salvar(data);

         const retorno: retornoPadrao<null> = {
            statusCode: 200,
            message: "subscription salva.",
            data: null
        }
        return res.json(retorno);
    }

    async ObterPublicKey(req: Request, res: Response){

        const result = this._service.ObterChavePublica();

         const retorno: retornoPadrao<string> = {
            statusCode: 200,
            message: "chave publica.",
            data: result
        }

        return res.json(retorno);
    }

    async OberTodos(req: AuthRequest, res: Response){

        const codigoProvedor = req.usuario?.codigoProvedor as string;
        const noti = await this._service.BuscarTodos(codigoProvedor)
        return res.json(noti)

        
    }

    async OberPorCpf(req: AuthRequest, res: Response){

        const cpf = req.params.cpf as string;
        const codigoProvedor = req.usuario?.codigoProvedor as string;
        const noti = await this._service.BuscarPorCpf(cpf, codigoProvedor)
        return res.json(noti)

    }
    async EnviarNotificacao(req: AuthRequest, res: Response){

        const codigoProvedor = req.usuario?.codigoProvedor as string;
        const data = req.body as notificacaoDto

        await this._service.Notificar(codigoProvedor, data);

        return res.status(201).json({})

    }

    // CENTRAL DE NOTIFICAÇÕES DO CLIENTE (sino do app)

    async ListarMinhasNotificacoes(req: Request, res: Response){

        const { cpf, codigoProvedor } = req.body;
        const notificacoes = await this._service.ListarNotificacoesCliente(cpf, codigoProvedor);
        return res.json({ data: notificacoes });
    }

    async ContarNaoLidas(req: Request, res: Response){

        const { cpf, codigoProvedor } = req.body;
        const total = await this._service.ContarNotificacoesNaoLidas(cpf, codigoProvedor);
        return res.json({ data: total });
    }

    async MarcarLida(req: Request, res: Response){

        const id = Number.parseInt(req.params.id as string);
        const { cpf, codigoProvedor } = req.body;
        await this._service.MarcarNotificacaoLida(id, cpf, codigoProvedor);
        return res.json({});
    }

    async ExcluirNotificacao(req: Request, res: Response){

        const id = Number.parseInt(req.params.id as string);
        const cpf = req.query.cpf as string;
        const codigoProvedor = req.query.codigoProvedor as string;
        await this._service.ExcluirNotificacaoCliente(id, cpf, codigoProvedor);
        return res.json({});
    }
}