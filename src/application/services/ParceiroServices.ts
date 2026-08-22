import { inject, injectable } from "tsyringe";
import IParceiroRepository from "../../core/interfaces/IParceiroRepository";
import IParceiroServices from "../interfaces/IParceiroServices";
import IPainelRepository from "../../core/interfaces/IPainelRepository";
import { compraModel } from "../../core/models/compraModel";
import { beneficioModel } from "../../core/models/beneficioModel";
import { ofertaEditeDto } from "../Dtos/ofertaEditeDto";
import JwtService from "./JwtServices";
import UploadService from "./UploadServices";
import { ETipoArquivo } from "../../infrastructure/supabase/ETipoArquivo";
import { gerarPixCopiaCola } from "../../infrastructure/pix/gerarPixCopiaCola";
import * as QRCode from "qrcode";

@injectable()
export default class ParceiroServices implements IParceiroServices {

    private readonly _parceiroRepository:IParceiroRepository;
    private readonly _painelRepository:IPainelRepository;
    private readonly _jwtService:JwtService;

    constructor(
        @inject("IParceiroRepository") parceiroRepository:IParceiroRepository,
        @inject("IPainelRepository") painelRepository:IPainelRepository
    ){
        this._parceiroRepository = parceiroRepository;
        this._painelRepository = painelRepository;
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

    async ObterFaturamentoComissao(parceiroId:number) {

        await this._painelRepository.GarantirFaturaComissaoParceiro(parceiroId);

        const [faturas, pixConfig] = await Promise.all([
            this._painelRepository.ObterFaturasComissaoParceiro(parceiroId),
            this._painelRepository.ObterConfigPix(),
        ]);

        const faturaAberta = faturas.find((f) => f.status === "pendente");
        let pixCopiaCola: string | null = null;
        let pixQrCode: string | null = null;

        if (faturaAberta && pixConfig?.chave_pix) {
            pixCopiaCola = gerarPixCopiaCola({
                chave: pixConfig.chave_pix,
                nomeRecebedor: pixConfig.nome_recebedor,
                cidade: pixConfig.cidade,
                valor: Number(faturaAberta.valor),
                txid: `COM${faturaAberta.id}`,
            });
            pixQrCode = await QRCode.toDataURL(pixCopiaCola, { margin: 1, width: 280 });
        }

        return { faturas, pixCopiaCola, pixQrCode };
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

    // OFERTAS

    async CriarOferta(oferta:beneficioModel) : Promise<beneficioModel> {
        if(!oferta.titulo?.trim() || !oferta.categoria?.trim())
            throw new Error("Informe pelo menos a categoria e o título da oferta.");

        if(oferta.file !== undefined){
            const _upload = new UploadService();
            oferta.link_imagem = await _upload.UploadArquivo({
                codigoProvedor: `parceiro-${oferta.parceiro_id_fk}`,
                file: oferta.file.buffer,
                nomeArquivo: "oferta"+oferta.file.originalname,
                tipo: ETipoArquivo.BENEFICIO,
            });
        }

        return await this._parceiroRepository.CriarOferta(oferta);
    }

    async ObterMinhasOfertas(parceiroId:number) : Promise<beneficioModel[]> {
        return await this._parceiroRepository.ObterMinhasOfertas(parceiroId);
    }

    async EditarOferta(id:number, ofertaEdite:ofertaEditeDto) : Promise<beneficioModel> {
        const oferta = await this._parceiroRepository.ObterOfertaPorId(id, ofertaEdite.parceiroId);
        if (!oferta)
            throw new Error("Oferta não encontrada.");

        if(ofertaEdite.categoria !== undefined) oferta.categoria = ofertaEdite.categoria;
        if(ofertaEdite.parceiro !== undefined) oferta.parceiro = ofertaEdite.parceiro;
        if(ofertaEdite.titulo !== undefined) oferta.titulo = ofertaEdite.titulo;
        if(ofertaEdite.subtitulo !== undefined) oferta.subtitulo = ofertaEdite.subtitulo;
        if(ofertaEdite.descricao !== undefined) oferta.descricao = ofertaEdite.descricao;
        if(ofertaEdite.valor !== undefined) oferta.valor = ofertaEdite.valor;
        if(ofertaEdite.valor_original !== undefined) oferta.valor_original = ofertaEdite.valor_original;
        if(ofertaEdite.validade_fim !== undefined) oferta.validade_fim = ofertaEdite.validade_fim;
        if(ofertaEdite.regras !== undefined) oferta.regras = ofertaEdite.regras;

        if(ofertaEdite.file !== undefined){
            const imagemAnterior = oferta.link_imagem;
            const _upload = new UploadService();
            oferta.link_imagem = await _upload.UploadArquivo({
                codigoProvedor: `parceiro-${ofertaEdite.parceiroId}`,
                file: ofertaEdite.file.buffer,
                nomeArquivo: "oferta",
                tipo: ETipoArquivo.BENEFICIO,
            });
            // só remove a antiga depois que a nova subiu com sucesso.
            await _upload.RemoverArquivo(imagemAnterior);
        }

        if(ofertaEdite.link !== undefined) oferta.link_acao = ofertaEdite.link;
        oferta.ativo = ofertaEdite.ativo;

        return await this._parceiroRepository.EditarOferta(oferta);
    }

    async ExcluirOferta(id:string, parceiroId:number) : Promise<{ removido:boolean }> {
        return await this._parceiroRepository.ExcluirOferta(id, parceiroId);
    }
}
