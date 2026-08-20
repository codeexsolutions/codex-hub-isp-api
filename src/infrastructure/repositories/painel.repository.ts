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
import { configPontosModel } from "../../core/models/configPontosModel";
import { parceiroModel } from "../../core/models/parceiroModel";
import { extratoPontosModel } from "../../core/models/extratoPontosModel";

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
        const select = `SELECT percentual_parceiro, percentual_synk, percentual_provedor FROM config_comissao WHERE id = 1;`;
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
                atualizado_em = now()
            WHERE id = 1
            RETURNING percentual_parceiro, percentual_synk, percentual_provedor;
        `;
        const result = await this._db.Execulte<configComissaoModel>(update, [config.percentual_parceiro, config.percentual_synk, config.percentual_provedor]);
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
                   pa.cidade, pa.uf, pa.endereco, pa.contato, pa.created_at AS criado_em, COALESCE(p.nome_fantasia, p.empresa) AS provedor_nome
            FROM parceiros pa
            LEFT JOIN provedores p ON p.codigo_provedor = pa.codigo_provedor_fk
            ORDER BY pa.nome_parceiro ASC;`;
        return await this._db.Execulte<parceiroModel>(select, []);
    }

    async DefinirStatusParceiro(id:number, ativo:boolean) : Promise<void> {
        const update = `UPDATE parceiros SET ativo = $1 WHERE id = $2;`;
        await this._db.Execulte<any>(update, [ativo, id]);
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
}