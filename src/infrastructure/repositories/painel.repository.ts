import { inject, injectable } from "tsyringe";
import DBContext from "../database/DBContext";
import IDBContext from "../interfaces/IDbContext";
import { anuncioModel } from "../../core/models/anuncioModel";
import IPainelRepository from "../../core/interfaces/IPainelRepository";
import { bannerModel } from "../../core/models/bannerModel";

@injectable()
export default class PainelRepository implements IPainelRepository {

    private readonly _db:IDBContext;
    constructor(@inject("IDBContext") db:IDBContext){
        this._db = db;
    }

    // ANUNCIOS
    async  GravarAnuncio(anuncio:anuncioModel) : Promise<anuncioModel>{

        const insert =  `INSERT INTO marketing_anuncios 
            (titulo, subtitulo, descricao, link_imagem, link_acao, codigo_provedor_fk, tipo, ativo) 
            VALUES ($1,$2,$3,$4,$5,$6,$7, $8) RETURNING id`;

        const id = await this._db.Execulte<any>(insert, [anuncio.titulo, anuncio.subtitulo, anuncio.descricao, anuncio.link_imagem, anuncio.link_acao, anuncio.codigo_provedor_fk, anuncio.tipo, anuncio.ativo]);

        return this.ObterAnuncioPorId(id[0].id, anuncio.codigo_provedor_fk)

    }

    async ObterAnuncios(codigoProvedor: number) : Promise<anuncioModel[]>{

        const select = `SELECT * FROM marketing_anuncios WHERE codigo_provedor_fk = $1;`
        const anuncios = await this._db.Execulte<anuncioModel>(select, [codigoProvedor]);
        return anuncios;
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





    
}