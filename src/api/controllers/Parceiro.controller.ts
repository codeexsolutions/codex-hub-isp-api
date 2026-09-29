import { inject, injectable } from "tsyringe";
import { Request, Response } from "express";
import { AuthRequest } from "../middleware/IAuthRequest";
import IParceiroServices from "../../application/interfaces/IParceiroServices";
import { beneficioModel } from "../../core/models/beneficioModel";
import { ofertaEditeDto } from "../../application/Dtos/ofertaEditeDto";
import { parceiroModel } from "../../core/models/parceiroModel";
import INotificacaoParceiroServices from "../../application/interfaces/INotificacaoParceiroServices";
import { pushSubscriptionParceiroDto } from "../../application/Dtos/pushSubscriptionParceiroDto";

@injectable()
export default class ParceiroController {

    private readonly _parceiroService:IParceiroServices;
    private readonly _notificacaoParceiroService:INotificacaoParceiroServices;

    constructor(@inject("IParceiroServices") parceiroService:IParceiroServices,
                @inject("INotificacaoParceiroServices") notificacaoParceiroService:INotificacaoParceiroServices){
        this._parceiroService = parceiroService;
        this._notificacaoParceiroService = notificacaoParceiroService;
    }

    // CENTRAL DE NOTIFICAÇÕES DO PARCEIRO (sino do painel do parceiro) —
    // separada da central de notificações do provedor. Avisa sobre novas
    // compras de benefícios (ver ProvedorServices.ComprarBeneficio).
    async InscreverNotificacaoParceiro(req:AuthRequest, res:Response){
        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        const data = req.body as pushSubscriptionParceiroDto;
        data.parceiroId = parceiroId;
        await this._notificacaoParceiroService.Inscrever(data);
        return res.json({ data: null });
    }

    async DesinscreverNotificacaoParceiro(req:AuthRequest, res:Response){
        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        const { endpoint } = req.body;
        await this._notificacaoParceiroService.Desinscrever(endpoint, parceiroId);
        return res.json({ data: null });
    }

    async ListarNotificacoesParceiro(req:AuthRequest, res:Response){
        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        const notificacoes = await this._notificacaoParceiroService.Listar(parceiroId);
        return res.json({ data: notificacoes });
    }

    async ContarNotificacoesParceiroNaoLidas(req:AuthRequest, res:Response){
        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        const total = await this._notificacaoParceiroService.ContarNaoLidas(parceiroId);
        return res.json({ data: total });
    }

    async MarcarNotificacaoParceiroLida(req:AuthRequest, res:Response){
        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        const id = Number.parseInt(req.params.id as string);
        await this._notificacaoParceiroService.MarcarLida(id, parceiroId);
        return res.json({ data: null });
    }

    async Login(req:Request, res:Response){

        const { usuario, senha } = req.body || {};

        try {
            const token = await this._parceiroService.Login(usuario, senha);
            return res.json({ data: { token } });
        } catch (error: any) {
            return res.status(401).json({ message: error.message || "Usuário ou senha inválido" });
        }
    }

    // Público — formulário de "Parcerias" no synk-lp. Cria com status pendente;
    // aprovação (com definição de usuário/senha de acesso) é feita pelo admin.
    async PreCadastrar(req:Request, res:Response){

        const data = req.body as parceiroModel;

        try {
            const parceiro = await this._parceiroService.PreCadastrar(data);
            return res.status(201).json({ data: parceiro });
        } catch (error: any) {
            return res.status(400).json({ statusCode: 400, message: error.message });
        }
    }

    async ObterFinanceiro(req:AuthRequest, res:Response){

        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        const financeiro = await this._parceiroService.ObterFinanceiro(parceiroId);
        return res.json({ data: financeiro });
    }

    async ObterFaturamentoComissao(req:AuthRequest, res:Response){

        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        const faturamento = await this._parceiroService.ObterFaturamentoComissao(parceiroId);
        return res.json({ data: faturamento });
    }

    async ObterCupom(req:AuthRequest, res:Response){

        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        const cupom = req.params.codigo as string;

        try {
            const compra = await this._parceiroService.ObterCupom(cupom, parceiroId);
            return res.json({ data: compra });
        } catch (error: any) {
            return res.status(404).json({ message: error.message });
        }
    }

    async ValidarCupom(req:AuthRequest, res:Response){

        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        const cupom = req.params.codigo as string;

        try {
            const compra = await this._parceiroService.ValidarCupom(cupom, parceiroId);
            return res.json({ data: compra });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async CancelarCupom(req:AuthRequest, res:Response){

        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        const cupom = req.params.codigo as string;

        try {
            const compra = await this._parceiroService.CancelarCupom(cupom, parceiroId);
            return res.json({ data: compra });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    // OFERTAS

    async CriarOferta(req:AuthRequest, res:Response){

        const data = req.body as beneficioModel;
        data.file = req.file;
        data.parceiro_id_fk = Number.parseInt(req.usuario?.parceiroId as string);
        data.valor = req.body.valor ? Number.parseFloat(req.body.valor) : null;
        data.valor_original = req.body.valor_original ? Number.parseFloat(req.body.valor_original) : null;
        data.validade_fim = req.body.validade_fim || null;
        data.ativo = req.body.ativo === "false" ? false : true;

        try {
            const oferta = await this._parceiroService.CriarOferta(data);
            return res.status(201).json({ data: oferta });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async ObterMinhasOfertas(req:AuthRequest, res:Response){

        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        const ofertas = await this._parceiroService.ObterMinhasOfertas(parceiroId);
        return res.json({ data: ofertas });
    }

    async EditarOferta(req:AuthRequest, res:Response){

        const id = Number.parseInt(req.params.id as string);
        const data = req.body as ofertaEditeDto;
        data.file = req.file;
        data.parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        data.valor = req.body.valor !== undefined ? (req.body.valor ? Number.parseFloat(req.body.valor) : null) : undefined;
        data.valor_original = req.body.valor_original !== undefined ? (req.body.valor_original ? Number.parseFloat(req.body.valor_original) : null) : undefined;
        data.ativo = req.body.ativo === "false" ? false : true;

        try {
            const oferta = await this._parceiroService.EditarOferta(id, data);
            return res.status(200).json({ data: oferta });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    // PERFIL

    async ObterMeuPerfil(req:AuthRequest, res:Response){

        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        try {
            const perfil = await this._parceiroService.ObterMeuPerfil(parceiroId);
            return res.json({ data: perfil });
        } catch (error: any) {
            return res.status(404).json({ message: error.message });
        }
    }

    async AtualizarMeuPerfil(req:AuthRequest, res:Response){

        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        const { nome, cidade, uf, endereco, contato, pix_chave } = req.body || {};

        try {
            const perfil = await this._parceiroService.AtualizarMeuPerfil(parceiroId, { nome, cidade, uf, endereco, contato, pix_chave });
            return res.json({ data: perfil });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async AlterarSenha(req:AuthRequest, res:Response){

        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);
        const { senhaAtual, senhaNova } = req.body || {};

        try {
            await this._parceiroService.AlterarSenha(parceiroId, senhaAtual, senhaNova);
            return res.json({ data: null });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async ExcluirOferta(req:AuthRequest, res:Response){

        const id = req.params.id as string;
        const parceiroId = Number.parseInt(req.usuario?.parceiroId as string);

        try {
            const resultado = await this._parceiroService.ExcluirOferta(id, parceiroId);
            return res.status(200).json({ data: resultado });
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }
}
