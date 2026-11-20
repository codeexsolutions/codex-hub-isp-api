import { inject, injectable } from "tsyringe";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/IAuthRequest";
import IContaTvServices from "../../application/interfaces/IContaTvServices";

// Monta o objeto de credenciais IPTV que o app salva de forma transparente
// (nunca expõe senha_hash nem id interno de pagamento sensível).
function paraResposta(resultado: { token: string; conta: any }) {
    const { token, conta } = resultado;
    return {
        token,
        iptv: { usuario: conta.iptv_usuario, senha: conta.iptv_senha, dns: conta.iptv_dns },
        vencimento: conta.iptv_vencimento,
        statusPagamento: conta.status_pagamento,
        linkPagamento: conta.link_pagamento,
    };
}

@injectable()
export default class ContaTvController {

    private readonly _contaTvService: IContaTvServices;

    constructor(@inject("IContaTvServices") contaTvService: IContaTvServices) {
        this._contaTvService = contaTvService;
    }

    async Cadastrar(req: Request, res: Response) {
        const { nome, email, senha } = req.body || {};

        try {
            const resultado = await this._contaTvService.Cadastrar(nome, email, senha);
            return res.status(201).json({ data: paraResposta(resultado) });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async Login(req: Request, res: Response) {
        const { email, senha } = req.body || {};

        try {
            const resultado = await this._contaTvService.Login(email, senha);
            return res.json({ data: paraResposta(resultado) });
        } catch (error: any) {
            return res.status(401).json({ message: error.message });
        }
    }

    async Me(req: AuthRequest, res: Response) {
        const contaId = Number.parseInt(req.usuario?.contaTvId as string);

        try {
            const conta = await this._contaTvService.ObterMinhaConta(contaId);
            return res.json({
                data: {
                    iptv: { usuario: conta.iptv_usuario, senha: conta.iptv_senha, dns: conta.iptv_dns },
                    vencimento: conta.iptv_vencimento,
                    statusPagamento: conta.status_pagamento,
                    linkPagamento: conta.link_pagamento,
                },
            });
        } catch (error: any) {
            return res.status(404).json({ message: error.message });
        }
    }

    // --- Admin (painel) ---

    async Listar(req: Request, res: Response) {
        const contas = await this._contaTvService.Listar();
        return res.json({ data: contas.map(({ senha_hash, ...resto }) => resto) });
    }

    async DefinirStatusPagamento(req: Request, res: Response) {
        const id = Number.parseInt(req.params.id as string);
        const { status } = req.body || {};

        try {
            const conta = await this._contaTvService.DefinirStatusPagamento(id, status);
            return res.json({ data: conta });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async DefinirIptv(req: Request, res: Response) {
        const id = Number.parseInt(req.params.id as string);
        const { usuario, senha, dns, vencimento } = req.body || {};

        try {
            const conta = await this._contaTvService.DefinirIptv(id, usuario, senha, dns, vencimento ?? null);
            return res.json({ data: conta });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async ContarNaoNotificadas(req: Request, res: Response) {
        const total = await this._contaTvService.ContarNaoNotificadas();
        return res.json({ data: { total } });
    }

    async MarcarNotificada(req: Request, res: Response) {
        const id = Number.parseInt(req.params.id as string);
        await this._contaTvService.MarcarNotificada(id);
        return res.json({ data: { ok: true } });
    }
}
