import { inject, injectable } from "tsyringe";
import IPushNotificationServices from "../../application/interfaces/IPushNotificationServices";
import { AuthRequest } from "../middleware/IAuthRequest";
import { Response } from "express";
import { notificacaoDto, pushSubscriptionDto } from "../../application/Dtos/pushSubscriptionDto";
import { retornoPadrao } from "../../application/Dtos/retornoPadrao";

@injectable()
export default class NotificationsController {
    
    private readonly _service:IPushNotificationServices;

    constructor(@inject("IPushNotificationServices")notificationService:IPushNotificationServices){
        this._service = notificationService;
    }

    async Salvar(req: AuthRequest, res: Response){

        const data = req.body as pushSubscriptionDto;

        const result = await this._service.Salvar(data);

         const retorno: retornoPadrao<null> = {
            statusCode: 200,
            message: "subscription salva.",
            data: null
        }
        return res.json(retorno);
    }

    async ObterPublicKey(req: AuthRequest, res: Response){

        const data = req.body as pushSubscriptionDto;

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

        const data = req.body as any;

        this._service.Notificar(data.subs, data.payload);

        return res.status(201)

    }
}