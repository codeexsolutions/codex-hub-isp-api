import { inject, injectable } from "tsyringe";
import DBContext from "../database/DBContext";
import IDBContext from "../interfaces/IDbContext";
import { anuncioModel } from "../../core/models/anuncioModel";
import IPainelRepository from "../../core/interfaces/IPainelRepository";
import { bannerModel } from "../../core/models/bannerModel";
import { beneficioModel } from "../../core/models/beneficioModel";
import { compraModel } from "../../core/models/compraModel";
import { configComissaoModel } from "../../core/models/configComissaoModel";
import { recompensaModel } from "../../core/models/recompensaModel";
import { planoMovelModel } from "../../core/models/planoMovelModel";
import { solicitacaoPlanoMovelModel } from "../../core/models/solicitacaoPlanoMovelModel";
import { configPontosModel } from "../../core/models/configPontosModel";
import { parceiroModel } from "../../core/models/parceiroModel";
import { extratoPontosModel } from "../../core/models/extratoPontosModel";
import { assinaturaModel } from "../../core/models/assinaturaModel";
import { planoModel } from "../../core/models/planoModel";
import { faturaModel } from "../../core/models/faturaModel";
import { pixConfigModel } from "../../core/models/pixConfigModel";
import { iptvConfigModel } from "../../core/models/iptvConfigModel";
import { homeConfigModel } from "../../core/models/homeConfigModel";
import { atendimentoModel } from "../../core/models/atendimentoModel";
import { comissaoFaturaModel } from "../../core/models/comissaoFaturaModel";
import { ixcOsConfigModel } from "../../core/models/ixcOsConfigModel";
import { ixcContratoConfigModel } from "../../core/models/ixcContratoConfigModel";
import { ixcAssuntoModel } from "../../core/models/ixcAssuntoModel";
import { clubeBeneficiosModel } from "../../core/models/clubeBeneficiosModel";
import { licencaTvModel, configLicencaTvModel } from "../../core/models/licencaTvModel";
import { estatus } from "../../common/enuns/estatus";

@injectable()
export default class PainelRepository implements IPainelRepository {

    private readonly _db:IDBContext;
    constructor(@inject("IDBContext") db:IDBContext){
        this._db = db;
    }

    // ANUNCIOS
    async  GravarAnuncio(anuncio:anuncioModel) : Promise<anuncioModel>{

        const quantidadeAnunciosSalvos = await this.QuantidadeAnuncios(anuncio.codigo_provedor_fk);
        
        if(quantidadeAnunciosSalvos < 5){

            const insert =  `INSERT INTO marketing_anuncios 
            (titulo, subtitulo, descricao, link_imagem, link_acao, codigo_provedor_fk, tipo, ativo) 
            VALUES ($1,$2,$3,$4,$5,$6,$7, $8) RETURNING id`;
    
            const id = await this._db.Execulte<any>(insert, [anuncio.titulo, anuncio.subtitulo, anuncio.descricao, anuncio.link_imagem, anuncio.link_acao, anuncio.codigo_provedor_fk, anuncio.tipo, anuncio.ativo]);
            
            return this.ObterAnuncioPorId(id[0].id, anuncio.codigo_provedor_fk)
        }

        throw new Error("Quantidade de Anuncios excede o limite.")
        


    }

    async ObterAnuncios(codigoProvedor: number) : Promise<anuncioModel[]>{

        const select = `SELECT * FROM marketing_anuncios WHERE codigo_provedor_fk = $1;`
        const anuncios = await this._db.Execulte<anuncioModel>(select, [codigoProvedor]);
        return anuncios;
    }

    async QuantidadeAnuncios(codigoProvedor: number) : Promise<number> {

        const select = `SELECT * FROM marketing_anuncios WHERE codigo_provedor_fk = $1;`
        const anuncios = await this._db.Execulte<anuncioModel>(select, [codigoProvedor]);
        return anuncios.length;
    }

    async ObterAnuncioPorId(idAnuncio:number, codigoProvedor: number) : Promise<anuncioModel>{
        const select = `SELECT * FROM marketing_anuncios WHERE codigo_provedor_fk = $1 AND id = $2;`
        const anuncios = await this._db.Execulte<anuncioModel>(select, [codigoProvedor, idAnuncio]);
        return anuncios[0];
    }

    async EditarAnuncio(anuncio:anuncioModel) : Promise<anuncioModel> {

        const update = `UPDATE marketing_anuncios SET 
                            titulo = $1, 
                            subtitulo = $2, 
                            descricao = $3, 
                            link_imagem = $4, 
                            link_acao = $5, 
                            tipo = $6, 
                            ativo = $7
                        WHERE codigo_provedor_fk = $8 and id = $9 RETURNING id; 
                        `;


        const result = await this._db.Execulte<any>(update, [anuncio.titulo, anuncio.subtitulo, anuncio.descricao, anuncio.link_imagem, anuncio.link_acao, anuncio.tipo, anuncio.ativo, anuncio.codigo_provedor_fk, anuncio.id])

        const id = result[0].id
        return await this.ObterAnuncioPorId(id, anuncio.codigo_provedor_fk)
    }

    async ExcluiAnuncio(idAnuncio:string, codigoProvedor:number) : Promise<any> {

        const exclui = `DELETE FROM marketing_anuncios WHERE id = $1 AND codigo_provedor_fk = $2`;
        return await this._db.Execulte<any>(exclui, [idAnuncio, codigoProvedor])
    }

    // BANNER

    async  GravarBanner(banner:bannerModel) : Promise<bannerModel>{

        const insert =  `INSERT INTO marketing_banners
            (selo, titulo, subtitulo, cta, cor1, cor2, emoji, link, ativo, codigo_provedor_fk) 
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`;

        const id = await this._db.Execulte<any>(insert, [banner.selo, banner.titulo, banner.subtitulo, banner.cta, banner.cor1, banner.cor2, banner.emoji, banner.link, banner.ativo, banner.codigo_provedor_fk]);

        return this.ObterBannerPorId(id[0].id, banner.codigo_provedor_fk)

    }

    async ObterBanners(codigoProvedor: number) : Promise<bannerModel[]>{

        const select = `SELECT * FROM marketing_banners WHERE codigo_provedor_fk = $1;`;
        const anuncios = await this._db.Execulte<bannerModel>(select, [codigoProvedor]);
        return anuncios;
    }

    async ObterBannerPorId(idBanner:number, codigoProvedor: number) : Promise<bannerModel>{
        const select = `SELECT * FROM marketing_banners WHERE codigo_provedor_fk = $1 AND id = $2;`;
        const anuncios = await this._db.Execulte<any>(select, [codigoProvedor, idBanner]);
        return anuncios[0];
    }

    async EditarBanner(banner:bannerModel) : Promise<bannerModel> {

        const update = `UPDATE marketing_banners SET 
                        selo = $1, titulo = $2, subtitulo = $3, cta = $4, cor1 = $5, cor2 = $6, emoji = $7, link = $8, ativo = $9
                        WHERE codigo_provedor_fk = $10 and id = $11
                        RETURNING id; 
                        `;


        const result = await this._db.Execulte<any>(update, [banner.selo, banner.titulo, banner.subtitulo, banner.cta, banner.cor1, banner.cor2, banner.emoji, banner.link, banner.ativo, banner.codigo_provedor_fk, banner.id])

        const id = result[0].id
        return await this.ObterBannerPorId(id, banner.codigo_provedor_fk)
    }

    async ExcluiBanner(idAnuncio:string, codigoProvedor:number) : Promise<any> {
        const exclui = `DELETE FROM marketing_banners WHERE id = $1 AND codigo_provedor_fk = $2`;
        return await this._db.Execulte<any>(exclui, [idAnuncio, codigoProvedor])
    }

    // OFERTAS (o parceiro cria — ver parceiro.repository.ts — o provedor só ativa)

    async ObterCatalogoOfertas(codigoProvedor: number) : Promise<beneficioModel[]>{
        const select = `
            SELECT mb.*, COALESCE(bp.ativo, false) AS ativo_para_mim,
                   pa.cidade AS parceiro_cidade, pa.uf AS parceiro_uf,
                   pa.endereco AS parceiro_endereco, pa.contato AS parceiro_contato
            FROM marketing_beneficios mb
            LEFT JOIN beneficio_provedores bp
                ON bp.beneficio_id = mb.id AND bp.codigo_provedor_fk = $1
            LEFT JOIN parceiros pa ON pa.id = mb.parceiro_id_fk
            WHERE mb.ativo = true AND mb.parceiro_id_fk IS NOT NULL
            ORDER BY mb.id DESC;
        `;
        return await this._db.Execulte<beneficioModel>(select, [codigoProvedor]);
    }

    async AtivarOferta(idBeneficio:number, codigoProvedor:number, ativo:boolean) : Promise<void> {
        const upsert = `
            INSERT INTO beneficio_provedores (beneficio_id, codigo_provedor_fk, ativo)
            VALUES ($1, $2, $3)
            ON CONFLICT (beneficio_id, codigo_provedor_fk)
            DO UPDATE SET ativo = EXCLUDED.ativo;
        `;
        await this._db.Execulte<any>(upsert, [idBeneficio, codigoProvedor, ativo]);
    }

    // METRICAS

    async ContarCliquesBeneficios(codigoProvedor:number) : Promise<number> {
        const select = `SELECT COUNT(*) AS total FROM beneficio_cliques WHERE codigo_provedor_fk = $1;`;
        const result = await this._db.Execulte<{ total:string }>(select, [codigoProvedor]);
        return Number.parseInt(result[0]?.total ?? "0");
    }

    async ObterResumoCompras(codigoProvedor:number) : Promise<{ compras:number; vendasGeradas:number; comissao:number }> {
        const select = `
            SELECT COUNT(*) AS compras,
                   COALESCE(SUM(valor), 0) AS vendas_geradas,
                   COALESCE(SUM(valor_provedor), 0) AS comissao
            FROM beneficio_compras
            WHERE codigo_provedor_fk = $1 AND status = 'utilizado';
        `;
        const result = await this._db.Execulte<{ compras:string; vendas_geradas:string; comissao:string }>(select, [codigoProvedor]);
        const linha = result[0];
        return {
            compras: Number.parseInt(linha?.compras ?? "0"),
            vendasGeradas: Number.parseFloat(linha?.vendas_geradas ?? "0"),
            comissao: Number.parseFloat(linha?.comissao ?? "0"),
        };
    }

    async ContarUsuariosAtivos(codigoProvedor:number) : Promise<number> {
        const select = `
            SELECT COUNT(*) AS total FROM cliente_atividade
            WHERE codigo_provedor_fk = $1 AND ultimo_login > now() - interval '30 days';
        `;
        const result = await this._db.Execulte<{ total:string }>(select, [codigoProvedor]);
        return Number.parseInt(result[0]?.total ?? "0");
    }

    // COMPRAS

    async ObterCompras(codigoProvedor:number) : Promise<compraModel[]> {
        const select = `
            SELECT c.*, b.titulo AS beneficio_titulo, b.parceiro AS beneficio_parceiro
            FROM beneficio_compras c
            JOIN marketing_beneficios b ON b.id = c.beneficio_id
            WHERE c.codigo_provedor_fk = $1
            ORDER BY c.criado_em DESC;
        `;
        return await this._db.Execulte<any>(select, [codigoProvedor]);
    }

    async ObterConfigComissao() : Promise<configComissaoModel> {
        const select = `SELECT percentual_parceiro, percentual_synk, percentual_provedor, dia_pagamento FROM config_comissao WHERE id = 1;`;
        const result = await this._db.Execulte<configComissaoModel>(select, []);
        return result[0];
    }

    async ObterComprasTodos() : Promise<compraModel[]> {
        const select = `
            SELECT c.*, b.titulo AS beneficio_titulo, b.parceiro AS beneficio_parceiro,
                   p.nome_fantasia AS provedor_nome, p.empresa AS provedor_empresa
            FROM beneficio_compras c
            JOIN marketing_beneficios b ON b.id = c.beneficio_id
            JOIN provedores p ON p.codigo_provedor = c.codigo_provedor_fk
            ORDER BY c.criado_em DESC;
        `;
        return await this._db.Execulte<any>(select, []);
    }

    async ObterResumoComprasGlobal() : Promise<{ compras:number; totalVendas:number; totalParceiro:number; totalSynk:number; totalProvedor:number }> {
        const select = `
            SELECT COUNT(*) AS compras,
                   COALESCE(SUM(valor), 0) AS total_vendas,
                   COALESCE(SUM(valor_parceiro), 0) AS total_parceiro,
                   COALESCE(SUM(valor_synk), 0) AS total_synk,
                   COALESCE(SUM(valor_provedor), 0) AS total_provedor
            FROM beneficio_compras
            WHERE status = 'utilizado';
        `;
        const result = await this._db.Execulte<{ compras:string; total_vendas:string; total_parceiro:string; total_synk:string; total_provedor:string }>(select, []);
        const linha = result[0];
        return {
            compras: Number.parseInt(linha?.compras ?? "0"),
            totalVendas: Number.parseFloat(linha?.total_vendas ?? "0"),
            totalParceiro: Number.parseFloat(linha?.total_parceiro ?? "0"),
            totalSynk: Number.parseFloat(linha?.total_synk ?? "0"),
            totalProvedor: Number.parseFloat(linha?.total_provedor ?? "0"),
        };
    }

    async AtualizarConfigComissao(config:configComissaoModel) : Promise<configComissaoModel> {
        const update = `
            UPDATE config_comissao SET
                percentual_parceiro = $1,
                percentual_synk = $2,
                percentual_provedor = $3,
                dia_pagamento = $4,
                atualizado_em = now()
            WHERE id = 1
            RETURNING percentual_parceiro, percentual_synk, percentual_provedor, dia_pagamento;
        `;
        const result = await this._db.Execulte<configComissaoModel>(update, [
            config.percentual_parceiro, config.percentual_synk, config.percentual_provedor, config.dia_pagamento ?? 5,
        ]);
        return result[0];
    }

    // RECOMPENSAS (pontos)

    async GravarRecompensa(recompensa:recompensaModel) : Promise<recompensaModel> {
        const insert = `INSERT INTO pontos_recompensas
            (codigo_provedor_fk, titulo, descricao, pontos_necessarios, ativo)
            VALUES ($1,$2,$3,$4,$5) RETURNING id`;
        const id = await this._db.Execulte<any>(insert, [recompensa.codigo_provedor_fk, recompensa.titulo, recompensa.descricao, recompensa.pontos_necessarios, recompensa.ativo]);
        return this.ObterRecompensaPorId(id[0].id, recompensa.codigo_provedor_fk);
    }

    async ObterRecompensas(codigoProvedor:number) : Promise<recompensaModel[]> {
        const select = `SELECT * FROM pontos_recompensas WHERE codigo_provedor_fk = $1 ORDER BY pontos_necessarios ASC;`;
        return await this._db.Execulte<recompensaModel>(select, [codigoProvedor]);
    }

    async ObterRecompensaPorId(idRecompensa:number, codigoProvedor:number) : Promise<recompensaModel> {
        const select = `SELECT * FROM pontos_recompensas WHERE id = $1 AND codigo_provedor_fk = $2;`;
        const result = await this._db.Execulte<recompensaModel>(select, [idRecompensa, codigoProvedor]);
        return result[0];
    }

    async EditarRecompensa(recompensa:recompensaModel) : Promise<recompensaModel> {
        const update = `UPDATE pontos_recompensas SET
                titulo = $1, descricao = $2, pontos_necessarios = $3, ativo = $4
            WHERE codigo_provedor_fk = $5 AND id = $6 RETURNING id;`;
        const result = await this._db.Execulte<any>(update, [recompensa.titulo, recompensa.descricao, recompensa.pontos_necessarios, recompensa.ativo, recompensa.codigo_provedor_fk, recompensa.id]);
        return this.ObterRecompensaPorId(result[0].id, recompensa.codigo_provedor_fk);
    }

    async ExcluiRecompensa(idRecompensa:string, codigoProvedor:number) : Promise<any> {
        const exclui = `DELETE FROM pontos_recompensas WHERE id = $1 AND codigo_provedor_fk = $2`;
        return await this._db.Execulte<any>(exclui, [idRecompensa, codigoProvedor]);
    }

    // PLANOS DE INTERNET MÓVEL

    async GravarPlanoMovel(plano:planoMovelModel) : Promise<planoMovelModel> {
        const insert = `INSERT INTO planos_moveis
            (codigo_provedor_fk, nome, gb_plano, gb_bonus, valor, ativo, ordem)
            VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`;
        const id = await this._db.Execulte<any>(insert, [
            plano.codigo_provedor_fk, plano.nome, plano.gb_plano, plano.gb_bonus, plano.valor, plano.ativo, plano.ordem ?? 0,
        ]);
        return this.ObterPlanoMovelPorId(id[0].id, plano.codigo_provedor_fk);
    }

    async ObterPlanosMoveis(codigoProvedor:number) : Promise<planoMovelModel[]> {
        const select = `SELECT * FROM planos_moveis WHERE codigo_provedor_fk = $1 ORDER BY ordem ASC, valor ASC;`;
        return await this._db.Execulte<planoMovelModel>(select, [codigoProvedor]);
    }

    async ObterPlanoMovelPorId(idPlano:number, codigoProvedor:number) : Promise<planoMovelModel> {
        const select = `SELECT * FROM planos_moveis WHERE id = $1 AND codigo_provedor_fk = $2;`;
        const result = await this._db.Execulte<planoMovelModel>(select, [idPlano, codigoProvedor]);
        return result[0];
    }

    async EditarPlanoMovel(plano:planoMovelModel) : Promise<planoMovelModel> {
        const update = `UPDATE planos_moveis SET
                nome = $1, gb_plano = $2, gb_bonus = $3, valor = $4, ativo = $5, ordem = $6
            WHERE codigo_provedor_fk = $7 AND id = $8 RETURNING id;`;
        const result = await this._db.Execulte<any>(update, [
            plano.nome, plano.gb_plano, plano.gb_bonus, plano.valor, plano.ativo, plano.ordem ?? 0, plano.codigo_provedor_fk, plano.id,
        ]);
        return this.ObterPlanoMovelPorId(result[0].id, plano.codigo_provedor_fk);
    }

    async ExcluiPlanoMovel(idPlano:string, codigoProvedor:number) : Promise<any> {
        const exclui = `DELETE FROM planos_moveis WHERE id = $1 AND codigo_provedor_fk = $2`;
        return await this._db.Execulte<any>(exclui, [idPlano, codigoProvedor]);
    }

    async ListarSolicitacoesPlanoMovel(codigoProvedor:number) : Promise<solicitacaoPlanoMovelModel[]> {
        const select = `SELECT * FROM solicitacoes_planos_moveis WHERE codigo_provedor_fk = $1 ORDER BY criado_em DESC LIMIT 100;`;
        return await this._db.Execulte<solicitacaoPlanoMovelModel>(select, [codigoProvedor]);
    }

    async AtualizarStatusSolicitacaoPlanoMovel(id:number, codigoProvedor:number, status:string) : Promise<solicitacaoPlanoMovelModel> {
        const update = `UPDATE solicitacoes_planos_moveis SET status = $1 WHERE id = $2 AND codigo_provedor_fk = $3 RETURNING *;`;
        const result = await this._db.Execulte<solicitacaoPlanoMovelModel>(update, [status, id, codigoProvedor]);
        return result[0];
    }

    async ObterConfigPontos() : Promise<configPontosModel> {
        const select = `SELECT pontos_por_real, pontos_indicacao_efetivada FROM config_pontos WHERE id = 1;`;
        const result = await this._db.Execulte<configPontosModel>(select, []);
        return result[0];
    }

    async AtualizarConfigPontos(config:configPontosModel) : Promise<configPontosModel> {
        const update = `UPDATE config_pontos SET pontos_por_real = $1, pontos_indicacao_efetivada = $2, atualizado_em = now()
            WHERE id = 1 RETURNING pontos_por_real, pontos_indicacao_efetivada;`;
        const result = await this._db.Execulte<configPontosModel>(update, [config.pontos_por_real, config.pontos_indicacao_efetivada ?? 50]);
        return result[0];
    }

    // PONTOS MANUAIS (pagamento em dia / indicação efetivada)

    async ConcederPontosManual(codigoProvedor:number, clienteCpfCnpj:string, clienteNome:string, pontos:number, motivo:string) : Promise<extratoPontosModel> {
        const insert = `INSERT INTO pontos_extrato
            (codigo_provedor_fk, cliente_cpf_cnpj, cliente_nome, tipo, pontos, motivo)
            VALUES ($1,$2,$3,'ganho',$4,$5) RETURNING *;`;
        const result = await this._db.Execulte<extratoPontosModel>(insert, [codigoProvedor, clienteCpfCnpj, clienteNome, pontos, motivo]);
        return result[0];
    }

    async MarcarIndicacaoEfetivada(idIndicacao:number, codigoProvedor:number) : Promise<{ indicacao:any; extrato:extratoPontosModel }> {
        const selectIndicacao = `SELECT * FROM indicacoes WHERE id = $1 AND codigo_provedor_fk = $2;`;
        const rows = await this._db.Execulte<any>(selectIndicacao, [idIndicacao, codigoProvedor]);
        const indicacao = rows[0];

        if (!indicacao)
            throw new Error("Indicação não encontrada.");
        if (indicacao.status === "efetivada")
            throw new Error("Essa indicação já foi marcada como efetivada.");
        if (!indicacao.cliente_cpf_cnpj)
            throw new Error("Essa indicação é antiga e não tem o CPF/CNPJ de quem indicou — conceda os pontos manualmente em vez de efetivar.");

        const configPontos = await this.ObterConfigPontos();
        const pontos = configPontos?.pontos_indicacao_efetivada ?? 50;

        const update = `UPDATE indicacoes SET status = 'efetivada', pontos_creditados = true WHERE id = $1 RETURNING *;`;
        const atualizada = await this._db.Execulte<any>(update, [idIndicacao]);

        const insertExtrato = `INSERT INTO pontos_extrato
            (codigo_provedor_fk, cliente_cpf_cnpj, cliente_nome, tipo, pontos, origem_indicacao_id, motivo)
            VALUES ($1,$2,$3,'ganho',$4,$5,'Indicação de amigo efetivada') RETURNING *;`;
        const extrato = await this._db.Execulte<extratoPontosModel>(insertExtrato, [
            codigoProvedor, indicacao.cliente_cpf_cnpj, indicacao.nome_cliente, pontos, idIndicacao,
        ]);

        return { indicacao: atualizada[0], extrato: extrato[0] };
    }

    // MODULOS

    async ObterModulosAtivos(codigoProvedor:number) : Promise<string[]> {
        const select = `SELECT modulo FROM provedor_modulos WHERE codigo_provedor_fk = $1 AND ativo = true;`;
        const result = await this._db.Execulte<{ modulo:string }>(select, [codigoProvedor]);
        return result.map((r) => r.modulo);
    }

    async PossuiModulo(codigoProvedor:number, modulo:string) : Promise<boolean> {
        const select = `SELECT 1 FROM provedor_modulos WHERE codigo_provedor_fk = $1 AND modulo = $2 AND ativo = true;`;
        const result = await this._db.Execulte<any>(select, [codigoProvedor, modulo]);
        return result.length > 0;
    }

    async ListarProvedoresComModulos() : Promise<any[]> {
        const select = `
            SELECT p.codigo_provedor, p.empresa, p.nome_fantasia, p.status,
                   COALESCE(array_agg(pm.modulo) FILTER (WHERE pm.ativo = true), '{}') AS modulos
            FROM provedores p
            LEFT JOIN provedor_modulos pm ON pm.codigo_provedor_fk = p.codigo_provedor
            GROUP BY p.codigo_provedor, p.empresa, p.nome_fantasia, p.status
            ORDER BY p.empresa;
        `;
        return await this._db.Execulte<any>(select, []);
    }

    async DefinirModulo(codigoProvedor:number, modulo:string, ativo:boolean) : Promise<void> {
        const upsert = `
            INSERT INTO provedor_modulos (codigo_provedor_fk, modulo, ativo)
            VALUES ($1, $2, $3)
            ON CONFLICT (codigo_provedor_fk, modulo)
            DO UPDATE SET ativo = EXCLUDED.ativo;
        `;
        await this._db.Execulte<any>(upsert, [codigoProvedor, modulo, ativo]);
    }

    async DefinirStatusProvedor(codigoProvedor:number, status:string) : Promise<void> {
        const update = `UPDATE provedores SET status = $1 WHERE codigo_provedor = $2;`;
        await this._db.Execulte<any>(update, [status, codigoProvedor]);
    }

    // PARCEIROS (admin)

    async CriarParceiro(parceiro:parceiroModel) : Promise<parceiroModel> {
        const insert = `INSERT INTO parceiros (nome_parceiro, usuario, senha, ativo, codigo_provedor_fk, cidade, uf, endereco, contato)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, nome_parceiro AS nome, usuario, ativo, codigo_provedor_fk, cidade, uf, endereco, contato, created_at AS criado_em;`;
        const result = await this._db.Execulte<parceiroModel>(insert, [
            parceiro.nome, parceiro.usuario, parceiro.senha, parceiro.ativo, parceiro.codigo_provedor_fk ?? null,
            parceiro.cidade ?? null, parceiro.uf ?? null, parceiro.endereco ?? null, parceiro.contato ?? null,
        ]);
        return result[0];
    }

    async ListarParceiros() : Promise<parceiroModel[]> {
        const select = `SELECT pa.id, pa.nome_parceiro AS nome, pa.usuario, pa.ativo, pa.codigo_provedor_fk,
                   pa.cidade, pa.uf, pa.endereco, pa.contato, pa.observacoes, pa.status,
                   pa.created_at AS criado_em, COALESCE(p.nome_fantasia, p.empresa) AS provedor_nome
            FROM parceiros pa
            LEFT JOIN provedores p ON p.codigo_provedor = pa.codigo_provedor_fk
            ORDER BY (pa.status = 'pendente') DESC, pa.nome_parceiro ASC;`;
        return await this._db.Execulte<parceiroModel>(select, []);
    }

    async DefinirStatusParceiro(id:number, ativo:boolean) : Promise<void> {
        const update = `UPDATE parceiros SET ativo = $1 WHERE id = $2;`;
        await this._db.Execulte<any>(update, [ativo, id]);

        if (!ativo) {
            // ao desativar o parceiro, as ofertas dele saem do catálogo de todo provedor e
            // do app (mesmo filtro mb.ativo=true já usado hoje) — sem isso, o parceiro
            // desativado continuava aparecendo/vendável normalmente. Reativar o parceiro
            // NÃO reativa as ofertas sozinho — ele reabre cada uma pelo próprio portal,
            // evitando reativar algo que ele mesmo já tinha desligado antes.
            await this._db.Execulte<any>(
                `UPDATE marketing_beneficios SET ativo = false WHERE parceiro_id_fk = $1 AND ativo = true;`,
                [id]
            );
        }
    }

    async DefinirProvedorParceiro(id:number, codigoProvedorFk:number|null) : Promise<void> {
        const update = `UPDATE parceiros SET codigo_provedor_fk = $1 WHERE id = $2;`;
        await this._db.Execulte<any>(update, [codigoProvedorFk, id]);
    }

    async DefinirLocalizacaoParceiro(id:number, cidade:string|null, uf:string|null) : Promise<void> {
        const update = `UPDATE parceiros SET cidade = $1, uf = $2 WHERE id = $3;`;
        await this._db.Execulte<any>(update, [cidade, uf, id]);
    }

    async DefinirContatoParceiro(id:number, endereco:string|null, contato:string|null) : Promise<void> {
        const update = `UPDATE parceiros SET endereco = $1, contato = $2 WHERE id = $3;`;
        await this._db.Execulte<any>(update, [endereco, contato, id]);
    }

    // Aprova um pré-cadastro (ver Parceiro.repository.PreCadastrar): define as
    // credenciais de acesso ao portal do parceiro e libera (ativo=true).
    async AprovarParceiro(id:number, usuario:string, senha:string) : Promise<parceiroModel> {
        const update = `UPDATE parceiros SET usuario = $1, senha = $2, status = 'aprovado', ativo = true
            WHERE id = $3 RETURNING id, nome_parceiro AS nome, usuario, ativo, status, created_at AS criado_em;`;
        const result = await this._db.Execulte<parceiroModel>(update, [usuario, senha, id]);
        if (!result[0])
            throw new Error("Parceiro não encontrado.");
        return result[0];
    }

    async RejeitarParceiro(id:number) : Promise<parceiroModel> {
        const update = `UPDATE parceiros SET status = 'rejeitado', ativo = false
            WHERE id = $1 RETURNING id, nome_parceiro AS nome, usuario, ativo, status, created_at AS criado_em;`;
        const result = await this._db.Execulte<parceiroModel>(update, [id]);
        if (!result[0])
            throw new Error("Parceiro não encontrado.");
        return result[0];
    }

    async ValidarCompraAdmin(idCompra:number) : Promise<compraModel> {
        const update = `UPDATE beneficio_compras SET status = 'utilizado', validado_em = now()
            WHERE id = $1 AND status = 'pendente' RETURNING *;`;
        const result = await this._db.Execulte<compraModel>(update, [idCompra]);
        const compra = result[0];
        if (!compra) return compra;

        try {
            const configPontos = await this.ObterConfigPontos();
            const pontos = Math.round(Number(compra.valor) * Number(configPontos.pontos_por_real));
            if (pontos > 0) {
                const insertPontos = `INSERT INTO pontos_extrato
                    (codigo_provedor_fk, cliente_cpf_cnpj, cliente_nome, tipo, pontos, origem_compra_id)
                    VALUES ($1,$2,$3,'ganho',$4,$5);`;
                await this._db.Execulte<any>(insertPontos, [compra.codigo_provedor_fk, compra.cliente_cpf_cnpj, compra.cliente_nome, pontos, compra.id]);
            }
        } catch { /* pontos são bônus — não bloqueia a validação */ }

        return compra;
    }

    // FATURAMENTO SYNK (mensalidade que o provedor paga pra Synk — não confundir com
    // a comissão de vendas de benefícios, que é outro fluxo já existente).

    async ObterAssinatura(codigoProvedor:number) : Promise<assinaturaModel|null> {
        const select = `SELECT * FROM provedor_assinaturas WHERE codigo_provedor_fk = $1;`;
        const result = await this._db.Execulte<assinaturaModel>(select, [codigoProvedor]);
        return result[0] ?? null;
    }

    async CriarOuEditarAssinatura(codigoProvedor:number, valorMensalidade:number, dataAdesao:string, planoId:number|null) : Promise<assinaturaModel> {
        const upsert = `INSERT INTO provedor_assinaturas (codigo_provedor_fk, valor_mensalidade, data_adesao, plano_id, ativo)
            VALUES ($1, $2, $3, $4, true)
            ON CONFLICT (codigo_provedor_fk)
            DO UPDATE SET valor_mensalidade = EXCLUDED.valor_mensalidade, data_adesao = EXCLUDED.data_adesao, plano_id = EXCLUDED.plano_id
            RETURNING *;`;
        const result = await this._db.Execulte<assinaturaModel>(upsert, [codigoProvedor, valorMensalidade, dataAdesao, planoId]);
        return result[0];
    }

    async ListarPlanos() : Promise<planoModel[]> {
        const select = `SELECT id, nome, valor_mensalidade, modulos, ordem, ativo FROM planos_synk ORDER BY ordem ASC, id ASC;`;
        return await this._db.Execulte<planoModel>(select, []);
    }

    async ObterPlano(id:number) : Promise<planoModel|null> {
        const select = `SELECT id, nome, valor_mensalidade, modulos, ordem, ativo FROM planos_synk WHERE id = $1;`;
        const result = await this._db.Execulte<planoModel>(select, [id]);
        return result[0] ?? null;
    }

    async CriarPlano(nome:string, valorMensalidade:number, modulos:string[], ordem:number) : Promise<planoModel> {
        const insert = `INSERT INTO planos_synk (nome, valor_mensalidade, modulos, ordem)
            VALUES ($1,$2,$3,$4) RETURNING id, nome, valor_mensalidade, modulos, ordem, ativo;`;
        const result = await this._db.Execulte<planoModel>(insert, [nome, valorMensalidade, modulos, ordem]);
        return result[0];
    }

    async EditarPlano(id:number, nome:string, valorMensalidade:number, modulos:string[], ordem:number) : Promise<planoModel> {
        const update = `UPDATE planos_synk SET nome = $1, valor_mensalidade = $2, modulos = $3, ordem = $4
            WHERE id = $5 RETURNING id, nome, valor_mensalidade, modulos, ordem, ativo;`;
        const result = await this._db.Execulte<planoModel>(update, [nome, valorMensalidade, modulos, ordem, id]);
        return result[0];
    }

    async DefinirStatusPlano(id:number, ativo:boolean) : Promise<void> {
        await this._db.Execulte<any>(`UPDATE planos_synk SET ativo = $1 WHERE id = $2;`, [ativo, id]);
    }

    // PAGAMENTO DE COMISSÃO DO PARCEIRO (mês fechado, cobrado no dia combinado do mês seguinte)

    private calcularCompetenciaVencimentoComissao(diaPagamento:number) : { competencia:string; vencimento:string } {
        const hoje = new Date();
        const ano = hoje.getUTCFullYear();
        const mes = hoje.getUTCMonth();
        // competência = mês fechado anterior; vencimento = dia combinado do mês corrente
        const competencia = new Date(Date.UTC(ano, mes - 1, 1)).toISOString().slice(0, 10);
        const dia = Math.min(diaPagamento, 28);
        const vencimento = new Date(Date.UTC(ano, mes, dia)).toISOString().slice(0, 10);
        return { competencia, vencimento };
    }

    async GarantirFaturaComissaoParceiro(parceiroId:number) : Promise<void> {

        const config = await this.ObterConfigComissao();
        const { competencia, vencimento } = this.calcularCompetenciaVencimentoComissao(config.dia_pagamento ?? 5);

        const existe = await this._db.Execulte<any>(
            `SELECT id FROM parceiro_comissao_faturas WHERE parceiro_id_fk = $1 AND competencia = $2;`,
            [parceiroId, competencia]
        );
        if (existe.length > 0) return;

        // soma o que foi validado (utilizado) dentro do mês fechado que está sendo cobrado
        const soma = await this._db.Execulte<{ total:string }>(
            `SELECT COALESCE(SUM(c.valor_synk + c.valor_provedor), 0) AS total
             FROM beneficio_compras c
             JOIN marketing_beneficios b ON b.id = c.beneficio_id
             WHERE b.parceiro_id_fk = $1 AND c.status = 'utilizado'
               AND c.validado_em >= $2::date AND c.validado_em < ($2::date + interval '1 month');`,
            [parceiroId, competencia]
        );
        const valor = Number.parseFloat(soma[0]?.total ?? "0");

        // não cria fatura de mês sem nada devido
        if (!(valor > 0)) return;

        await this._db.Execulte<any>(
            `INSERT INTO parceiro_comissao_faturas (parceiro_id_fk, competencia, vencimento, valor)
             VALUES ($1,$2,$3,$4) ON CONFLICT (parceiro_id_fk, competencia) DO NOTHING;`,
            [parceiroId, competencia, vencimento, valor]
        );
    }

    async GarantirFaturasComissaoTodos() : Promise<void> {
        const parceiros = await this._db.Execulte<{ id:number }>(`SELECT id FROM parceiros;`, []);
        for (const p of parceiros) {
            await this.GarantirFaturaComissaoParceiro(p.id);
        }
    }

    async ObterFaturasComissaoParceiro(parceiroId:number) : Promise<comissaoFaturaModel[]> {
        const select = `SELECT * FROM parceiro_comissao_faturas WHERE parceiro_id_fk = $1 ORDER BY competencia DESC;`;
        return await this._db.Execulte<comissaoFaturaModel>(select, [parceiroId]);
    }

    async ListarFaturasComissaoTodos() : Promise<any[]> {
        const select = `
            SELECT pa.id AS parceiro_id, pa.nome_parceiro AS parceiro_nome,
                   cf.id AS fatura_id, cf.competencia, cf.vencimento, cf.valor, cf.status, cf.pago_em
            FROM parceiros pa
            LEFT JOIN LATERAL (
                SELECT * FROM parceiro_comissao_faturas pcf
                WHERE pcf.parceiro_id_fk = pa.id
                ORDER BY pcf.competencia DESC
                LIMIT 1
            ) cf ON true
            ORDER BY pa.nome_parceiro ASC;
        `;
        return await this._db.Execulte<any>(select, []);
    }

    async MarcarFaturaComissaoPaga(id:number) : Promise<comissaoFaturaModel> {
        const update = `UPDATE parceiro_comissao_faturas SET status = 'pago', pago_em = now()
            WHERE id = $1 AND status = 'pendente' RETURNING *;`;
        const result = await this._db.Execulte<comissaoFaturaModel>(update, [id]);
        return result[0];
    }

    async MarcarFaturaComissaoCancelada(id:number) : Promise<comissaoFaturaModel> {
        const update = `UPDATE parceiro_comissao_faturas SET status = 'cancelado'
            WHERE id = $1 AND status = 'pendente' RETURNING *;`;
        const result = await this._db.Execulte<comissaoFaturaModel>(update, [id]);
        return result[0];
    }

    // dia de vencimento = dia da data de adesão, capado em 28 pra não ter problema com
    // meses curtos (fevereiro). Tudo em UTC pra não dar drift de fuso na conversão de data.
    private calcularCompetenciaEVencimento(dataAdesao:string) : { competencia:string; vencimento:string } {
        const hoje = new Date();
        const ano = hoje.getUTCFullYear();
        const mes = hoje.getUTCMonth();
        const diaAdesao = new Date(dataAdesao).getUTCDate();
        const diaVencimento = Math.min(diaAdesao, 28);
        const competencia = new Date(Date.UTC(ano, mes, 1)).toISOString().slice(0, 10);
        const vencimento = new Date(Date.UTC(ano, mes, diaVencimento)).toISOString().slice(0, 10);
        return { competencia, vencimento };
    }

    async GarantirFaturaDoMes(codigoProvedor:number) : Promise<void> {
        const assinatura = await this.ObterAssinatura(codigoProvedor);
        if (!assinatura || !assinatura.ativo) return;

        const { competencia, vencimento } = this.calcularCompetenciaEVencimento(assinatura.data_adesao);

        const insert = `INSERT INTO provedor_faturas (codigo_provedor_fk, competencia, vencimento, valor)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (codigo_provedor_fk, competencia) DO NOTHING;`;
        await this._db.Execulte<any>(insert, [codigoProvedor, competencia, vencimento, assinatura.valor_mensalidade]);
    }

    async GarantirFaturasTodos() : Promise<void> {
        const select = `SELECT codigo_provedor_fk FROM provedor_assinaturas WHERE ativo = true;`;
        const assinaturas = await this._db.Execulte<{ codigo_provedor_fk:number }>(select, []);
        for (const row of assinaturas) {
            await this.GarantirFaturaDoMes(row.codigo_provedor_fk);
        }
    }

    async ObterFaturasProvedor(codigoProvedor:number) : Promise<faturaModel[]> {
        const select = `SELECT * FROM provedor_faturas WHERE codigo_provedor_fk = $1 ORDER BY competencia DESC;`;
        return await this._db.Execulte<faturaModel>(select, [codigoProvedor]);
    }

    async ObterFaturaComProvedor(idFatura:number) : Promise<faturaModel|null> {
        const select = `
            SELECT pf.*, COALESCE(p.nome_fantasia, p.empresa) AS provedor_nome, p.cnpj AS provedor_cnpj
            FROM provedor_faturas pf
            JOIN provedores p ON p.codigo_provedor = pf.codigo_provedor_fk
            WHERE pf.id = $1;
        `;
        const result = await this._db.Execulte<faturaModel>(select, [idFatura]);
        return result[0] ?? null;
    }

    // só reativa se não sobrar nenhuma outra fatura vencida há 7+ dias — evita reverter
    // uma inativação manual do admin por outro motivo quando só uma de várias for paga.
    private async ReativarSeQuitado(codigoProvedor:number) : Promise<void> {
        const select = `SELECT 1 FROM provedor_faturas
            WHERE codigo_provedor_fk = $1 AND status = 'pendente' AND vencimento < (CURRENT_DATE - INTERVAL '7 days')
            LIMIT 1;`;
        const pendentes = await this._db.Execulte<any>(select, [codigoProvedor]);
        if (pendentes.length === 0) {
            await this.DefinirStatusProvedor(codigoProvedor, estatus.ATIVO);
        }
    }

    async MarcarFaturaPaga(idFatura:number) : Promise<faturaModel> {
        const update = `UPDATE provedor_faturas SET status = 'pago', pago_em = now() WHERE id = $1 RETURNING *;`;
        const result = await this._db.Execulte<faturaModel>(update, [idFatura]);
        const fatura = result[0];
        if (fatura) await this.ReativarSeQuitado(fatura.codigo_provedor_fk);
        return fatura;
    }

    async MarcarFaturaCancelada(idFatura:number) : Promise<faturaModel> {
        const update = `UPDATE provedor_faturas SET status = 'cancelado' WHERE id = $1 RETURNING *;`;
        const result = await this._db.Execulte<faturaModel>(update, [idFatura]);
        const fatura = result[0];
        if (fatura) await this.ReativarSeQuitado(fatura.codigo_provedor_fk);
        return fatura;
    }

    // Desfaz um "marcar como pago"/"cancelar" feito por engano — volta a fatura
    // pra pendente. Não reverte a reativação de acesso do provedor sozinha (se
    // ele já foi reativado, isso é uma decisão separada do admin).
    async ReabrirFatura(idFatura:number) : Promise<faturaModel> {
        const update = `UPDATE provedor_faturas SET status = 'pendente', pago_em = NULL WHERE id = $1 RETURNING *;`;
        const result = await this._db.Execulte<faturaModel>(update, [idFatura]);
        return result[0];
    }

    async VerificarInadimplenciaTodos() : Promise<number> {
        const select = `
            SELECT DISTINCT pf.codigo_provedor_fk
            FROM provedor_faturas pf
            JOIN provedores p ON p.codigo_provedor = pf.codigo_provedor_fk
            WHERE pf.status = 'pendente'
              AND pf.vencimento < (CURRENT_DATE - INTERVAL '7 days')
              AND p.status = $1;
        `;
        const inadimplentes = await this._db.Execulte<{ codigo_provedor_fk:number }>(select, [estatus.ATIVO]);
        for (const row of inadimplentes) {
            await this.DefinirStatusProvedor(row.codigo_provedor_fk, estatus.INATIVO);
        }
        return inadimplentes.length;
    }

    async ListarFaturamentoTodos() : Promise<any[]> {
        const select = `
            SELECT p.codigo_provedor, COALESCE(p.nome_fantasia, p.empresa) AS provedor_nome,
                   p.cnpj AS provedor_cnpj, p.status AS provedor_status,
                   pa.id AS assinatura_id, pa.valor_mensalidade, pa.data_adesao, pa.plano_id,
                   uf.id AS fatura_id, uf.competencia, uf.vencimento, uf.valor AS fatura_valor,
                   uf.status AS fatura_status, uf.pago_em,
                   (SELECT COUNT(*) FROM provedor_faturas WHERE codigo_provedor_fk = p.codigo_provedor AND status = 'pendente') AS faturas_pendentes
            FROM provedores p
            LEFT JOIN provedor_assinaturas pa ON pa.codigo_provedor_fk = p.codigo_provedor
            LEFT JOIN LATERAL (
                SELECT * FROM provedor_faturas pf
                WHERE pf.codigo_provedor_fk = p.codigo_provedor
                -- prioriza a fatura pendente mais antiga (a que realmente importa pro
                -- admin agir) — sem isso, uma fatura nova gerada automaticamente pro mês
                -- atual escondia uma parcela vencida de mês anterior ainda em aberto,
                -- e o admin podia acabar marcando como paga a fatura errada.
                ORDER BY (pf.status = 'pendente') DESC, CASE WHEN pf.status = 'pendente' THEN pf.competencia END ASC,
                         pf.competencia DESC
                LIMIT 1
            ) uf ON true
            ORDER BY provedor_nome ASC;
        `;
        return await this._db.Execulte<any>(select, []);
    }

    async ObterConfigPix() : Promise<pixConfigModel> {
        const select = `SELECT chave_pix, nome_recebedor, cidade FROM synk_pix_config WHERE id = 1;`;
        const result = await this._db.Execulte<pixConfigModel>(select, []);
        return result[0];
    }

    async DefinirConfigPix(config:pixConfigModel) : Promise<pixConfigModel> {
        const update = `UPDATE synk_pix_config SET chave_pix = $1, nome_recebedor = $2, cidade = $3, atualizado_em = now()
            WHERE id = 1 RETURNING chave_pix, nome_recebedor, cidade;`;
        const result = await this._db.Execulte<pixConfigModel>(update, [config.chave_pix, config.nome_recebedor, config.cidade]);
        return result[0];
    }

    async ObterConfigIptv() : Promise<iptvConfigModel> {
        const select = `SELECT url_padrao FROM iptv_config WHERE id = 1;`;
        const result = await this._db.Execulte<iptvConfigModel>(select, []);
        return result[0];
    }

    async DefinirConfigIptv(urlPadrao:string) : Promise<iptvConfigModel> {
        const update = `UPDATE iptv_config SET url_padrao = $1, atualizado_em = now()
            WHERE id = 1 RETURNING url_padrao;`;
        const result = await this._db.Execulte<iptvConfigModel>(update, [urlPadrao]);
        return result[0];
    }

    // LICENÇA ANUAL DO SYNK TV (venda avulsa, sem provedor) — PIX próprio,
    // separado do synk_pix_config usado em Faturamento/Comissão.
    async ObterConfigLicencaTv() : Promise<configLicencaTvModel> {
        const select = `SELECT valor_anual, chave_pix, nome_recebedor, cidade FROM config_licenca_tv WHERE id = 1;`;
        const result = await this._db.Execulte<configLicencaTvModel>(select, []);
        return result[0];
    }

    async DefinirConfigLicencaTv(config: configLicencaTvModel) : Promise<configLicencaTvModel> {
        const update = `UPDATE config_licenca_tv SET valor_anual = $1, chave_pix = $2, nome_recebedor = $3, cidade = $4
            WHERE id = 1 RETURNING valor_anual, chave_pix, nome_recebedor, cidade;`;
        const result = await this._db.Execulte<configLicencaTvModel>(update, [config.valor_anual, config.chave_pix, config.nome_recebedor, config.cidade]);
        return result[0];
    }

    // Já nasce em teste (7 dias liberados) — o cliente entra na hora, sem
    // esperar aprovação de pagamento; o PIX fica disponível durante o teste
    // pra converter em licença paga (ver AprovarLicencaTv).
    async CriarLicencaTv(chave:string, nome:string, telefone:string, valor:number) : Promise<licencaTvModel> {
        const insert = `INSERT INTO licencas_tv (chave, nome, telefone, valor, status, vencimento)
            VALUES ($1,$2,$3,$4,'teste',(CURRENT_DATE + INTERVAL '7 days')::date) RETURNING *;`;
        const result = await this._db.Execulte<licencaTvModel>(insert, [chave, nome, telefone, valor]);
        return result[0];
    }

    async ObterLicencaTvPorChave(chave:string) : Promise<licencaTvModel | null> {
        const select = `SELECT * FROM licencas_tv WHERE chave = $1;`;
        const result = await this._db.Execulte<licencaTvModel>(select, [chave]);
        return result[0] ?? null;
    }

    async ListarLicencasTv() : Promise<licencaTvModel[]> {
        const select = `SELECT * FROM licencas_tv ORDER BY criado_em DESC;`;
        return await this._db.Execulte<licencaTvModel>(select, []);
    }

    async AprovarLicencaTv(id:number) : Promise<licencaTvModel> {
        const update = `UPDATE licencas_tv SET status = 'ativa', vencimento = (CURRENT_DATE + INTERVAL '1 year')::date, ativado_em = now()
            WHERE id = $1 RETURNING *;`;
        const result = await this._db.Execulte<licencaTvModel>(update, [id]);
        return result[0];
    }

    async CancelarLicencaTv(id:number) : Promise<licencaTvModel> {
        const update = `UPDATE licencas_tv SET status = 'cancelada' WHERE id = $1 RETURNING *;`;
        const result = await this._db.Execulte<licencaTvModel>(update, [id]);
        return result[0];
    }

    async VencerLicencasTvExpiradas() : Promise<void> {
        const update = `UPDATE licencas_tv SET status = 'vencida' WHERE status IN ('ativa','teste') AND vencimento < CURRENT_DATE;`;
        await this._db.Execulte<any>(update, []);
    }

    async ObterHomeConfig(codigoProvedor: number): Promise<homeConfigModel> {

        const select = `SELECT banner, fatura, consumo, atalhos FROM provedor_home_config WHERE codigo_provedor_fk = $1;`;
        const result = await this._db.Execulte<homeConfigModel>(select, [codigoProvedor]);

        if (result.length > 0)
            return result[0];

        return { banner: true, fatura: true, consumo: true, atalhos: true };
    }

    async DefinirHomeConfig(codigoProvedor: number, config: homeConfigModel): Promise<homeConfigModel> {

        const upsert = `INSERT INTO provedor_home_config (codigo_provedor_fk, banner, fatura, consumo, atalhos)
            VALUES ($1,$2,$3,$4,$5)
            ON CONFLICT (codigo_provedor_fk) DO UPDATE SET
                banner = EXCLUDED.banner, fatura = EXCLUDED.fatura, consumo = EXCLUDED.consumo,
                atalhos = EXCLUDED.atalhos, atualizado_em = now()
            RETURNING banner, fatura, consumo, atalhos;`;

        const result = await this._db.Execulte<homeConfigModel>(
            upsert,
            [codigoProvedor, config.banner, config.fatura, config.consumo, config.atalhos]
        );

        return result[0];
    }

    async ObterAtendimento(codigoProvedor: number): Promise<atendimentoModel> {

        const select = `SELECT whatsapp, telefone, email, site, instagram FROM provedor_atendimento WHERE codigo_provedor_fk = $1;`;
        const result = await this._db.Execulte<atendimentoModel>(select, [codigoProvedor]);

        if (result.length > 0)
            return result[0];

        return { whatsapp: null, telefone: null, email: null, site: null, instagram: null };
    }

    async DefinirAtendimento(codigoProvedor: number, dados: atendimentoModel): Promise<atendimentoModel> {

        const upsert = `INSERT INTO provedor_atendimento (codigo_provedor_fk, whatsapp, telefone, email, site, instagram)
            VALUES ($1,$2,$3,$4,$5,$6)
            ON CONFLICT (codigo_provedor_fk) DO UPDATE SET
                whatsapp = EXCLUDED.whatsapp, telefone = EXCLUDED.telefone, email = EXCLUDED.email,
                site = EXCLUDED.site, instagram = EXCLUDED.instagram, atualizado_em = now()
            RETURNING whatsapp, telefone, email, site, instagram;`;

        const result = await this._db.Execulte<atendimentoModel>(
            upsert,
            [codigoProvedor, dados.whatsapp || null, dados.telefone || null, dados.email || null, dados.site || null, dados.instagram || null]
        );

        return result[0];
    }

    async ObterClubeBeneficios(codigoProvedor: number): Promise<clubeBeneficiosModel> {

        const select = `SELECT nome, mensagem FROM provedor_clube_beneficios WHERE codigo_provedor_fk = $1;`;
        const result = await this._db.Execulte<clubeBeneficiosModel>(select, [codigoProvedor]);

        if (result.length > 0)
            return result[0];

        return { nome: null, mensagem: null };
    }

    async DefinirClubeBeneficios(codigoProvedor: number, dados: clubeBeneficiosModel): Promise<clubeBeneficiosModel> {

        const upsert = `INSERT INTO provedor_clube_beneficios (codigo_provedor_fk, nome, mensagem)
            VALUES ($1,$2,$3)
            ON CONFLICT (codigo_provedor_fk) DO UPDATE SET
                nome = EXCLUDED.nome, mensagem = EXCLUDED.mensagem, atualizado_em = now()
            RETURNING nome, mensagem;`;

        const result = await this._db.Execulte<clubeBeneficiosModel>(
            upsert,
            [codigoProvedor, dados.nome || null, dados.mensagem || null]
        );

        return result[0];
    }

    async ObterIxcOsConfig(codigoProvedor: number): Promise<ixcOsConfigModel> {

        const select = `SELECT id_assunto, id_filial, setor, id_evento_mensagem FROM provedor_ixc_os_config WHERE codigo_provedor_fk = $1;`;
        const result = await this._db.Execulte<ixcOsConfigModel>(select, [codigoProvedor]);

        if (result.length > 0)
            return result[0];

        return { id_assunto: null, id_filial: null, setor: null, id_evento_mensagem: null };
    }

    async DefinirIxcOsConfig(codigoProvedor: number, dados: ixcOsConfigModel): Promise<ixcOsConfigModel> {

        const upsert = `INSERT INTO provedor_ixc_os_config (codigo_provedor_fk, id_assunto, id_filial, setor, id_evento_mensagem)
            VALUES ($1,$2,$3,$4,$5)
            ON CONFLICT (codigo_provedor_fk) DO UPDATE SET
                id_assunto = EXCLUDED.id_assunto, id_filial = EXCLUDED.id_filial, setor = EXCLUDED.setor,
                id_evento_mensagem = EXCLUDED.id_evento_mensagem, atualizado_em = now()
            RETURNING id_assunto, id_filial, setor, id_evento_mensagem;`;

        const result = await this._db.Execulte<ixcOsConfigModel>(
            upsert,
            [codigoProvedor, dados.id_assunto || null, dados.id_filial || null, dados.setor || null, dados.id_evento_mensagem || null]
        );

        return result[0];
    }

    async ObterIxcContratoConfig(codigoProvedor: number): Promise<ixcContratoConfigModel> {

        const select = `SELECT resource_imprimir FROM provedor_ixc_contrato_config WHERE codigo_provedor_fk = $1;`;
        const result = await this._db.Execulte<ixcContratoConfigModel>(select, [codigoProvedor]);

        if (result.length > 0)
            return result[0];

        return { resource_imprimir: null };
    }

    async DefinirIxcContratoConfig(codigoProvedor: number, resourceImprimir: string): Promise<ixcContratoConfigModel> {

        const upsert = `INSERT INTO provedor_ixc_contrato_config (codigo_provedor_fk, resource_imprimir)
            VALUES ($1,$2)
            ON CONFLICT (codigo_provedor_fk) DO UPDATE SET
                resource_imprimir = EXCLUDED.resource_imprimir, atualizado_em = now()
            RETURNING resource_imprimir;`;

        const result = await this._db.Execulte<ixcContratoConfigModel>(upsert, [codigoProvedor, resourceImprimir]);

        return result[0];
    }

    async ListarIxcAssuntos(codigoProvedor: number): Promise<ixcAssuntoModel[]> {
        const select = `SELECT id, nome, id_assunto_ixc FROM provedor_ixc_assuntos WHERE codigo_provedor_fk = $1 ORDER BY nome ASC;`;
        return await this._db.Execulte<ixcAssuntoModel>(select, [codigoProvedor]);
    }

    async CriarIxcAssunto(codigoProvedor: number, nome: string, idAssuntoIxc: number): Promise<ixcAssuntoModel> {
        const insert = `INSERT INTO provedor_ixc_assuntos (codigo_provedor_fk, nome, id_assunto_ixc)
            VALUES ($1,$2,$3) RETURNING id, nome, id_assunto_ixc;`;
        const result = await this._db.Execulte<ixcAssuntoModel>(insert, [codigoProvedor, nome, idAssuntoIxc]);
        return result[0];
    }

    async ExcluirIxcAssunto(id: number, codigoProvedor: number): Promise<void> {
        await this._db.Execulte<any>(
            `DELETE FROM provedor_ixc_assuntos WHERE id = $1 AND codigo_provedor_fk = $2;`,
            [id, codigoProvedor]
        );
    }
}