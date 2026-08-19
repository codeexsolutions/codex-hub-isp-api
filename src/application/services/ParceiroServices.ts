import { inject, injectable } from "tsyringe";
import IParceiroRepository from "../../core/interfaces/IParceiroRepository";
import IParceiroServices from "../interfaces/IParceiroServices";
import { compraModel } from "../../core/models/compraModel";
import JwtService from "./JwtServices";

@injectable()
export default class ParceiroServices implements IParceiroServices {

    private readonly _parceiroRepository:IParceiroRepository;
    private readonly _jwtService:JwtService;

    constructor(@inject("IParceiroRepository") parceiroRepository:IParceiroRepository){
        this._parceiroRepository = parceiroRepository;
        this._jwtService = new JwtService();
    }

    async Login(usuario:string, senha:string) : Promise<string> {
        const parceiro = await this._parceiroRepository.ObterPorUsuarioSenha(usuario, senha);
        if (!parceiro)
            throw new Error("Usuário ou senha inválido");

        return this._jwtService.GerarToken({ id: parceiro.id.toString(), codigoProvedor: "", parceiroId: parceiro.id.toString(), role: "parceiro" });
    }

    async ObterFinanceiro(parceiroId:number) {
        const [linhas, compras] = await Promise.all([
            this._parceiroRepository.ObterResumoFinanceiro(parceiroId),
            this._parceiroRepository.ObterComprasParceiro(parceiroId),
        ]);

        const resumo: Record<string, { qtd:number; total:number; synk:number; provedor:number }> = {
            pendente: { qtd: 0, total: 0, synk: 0, provedor: 0 },
            utilizado: { qtd: 0, total: 0, synk: 0, provedor: 0 },
            cancelado: { qtd: 0, total: 0, synk: 0, provedor: 0 },
        };
        for (const linha of linhas) {
            resumo[linha.status] = { qtd: linha.qtd, total: linha.total, synk: linha.synk, provedor: linha.provedor };
        }

        return { resumo, compras };
    }

    async ObterCupom(cupom:string, parceiroId:number) : Promise<compraModel> {
        const compra = await this._parceiroRepository.ObterCompraPorCupom(cupom, parceiroId);
        if (!compra)
            throw new Error("Cupom não encontrado para este parceiro.");
        return compra;
    }

    async ValidarCupom(cupom:string, parceiroId:number) : Promise<compraModel> {
        const compra = await this._parceiroRepository.ObterCompraPorCupom(cupom, parceiroId);
        if (!compra)
            throw new Error("Cupom não encontrado para este parceiro.");
        if (compra.status !== "pendente")
            throw new Error(`Este cupom já está com status "${compra.status}".`);

        const validada = await this._parceiroRepository.ValidarCupom(cupom);

        try {
            const config = await this._parceiroRepository.ObterConfigPontos();
            const pontos = Math.round(Number(compra.valor) * Number(config.pontos_por_real));
            if (pontos > 0)
                await this._parceiroRepository.RegistrarPontosGanhos(compra.codigo_provedor_fk, compra.cliente_cpf_cnpj, compra.cliente_nome, pontos, compra.id);
        } catch { /* pontos são bônus — não bloqueia a validação */ }

        return validada;
    }

    async CancelarCupom(cupom:string, parceiroId:number) : Promise<compraModel> {
        const compra = await this._parceiroRepository.ObterCompraPorCupom(cupom, parceiroId);
        if (!compra)
            throw new Error("Cupom não encontrado para este parceiro.");
        if (compra.status !== "pendente")
            throw new Error(`Este cupom já está com status "${compra.status}".`);

        return await this._parceiroRepository.CancelarCupom(cupom);
    }
}
