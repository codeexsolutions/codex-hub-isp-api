import { inject, injectable } from "tsyringe";
import IPainelRepository from "../../core/interfaces/IPainelRepository";
import { anuncioModel } from "../../core/models/anuncioModel";
import IPainelServices from "../interfaces/IPainelService";
import { bannerModel } from "../../core/models/bannerModel";
import UploadService from "./UploadServices";
import { ETipoArquivo } from "../../infrastructure/supabase/ETipoArquivo";

@injectable()
export default class PainelService implements IPainelServices {

    private readonly _painelRepository:IPainelRepository;

    constructor(@inject("IPainelRepository")painelRepository:IPainelRepository){
        this._painelRepository = painelRepository;
    }
    
    async GravarAnuncio(anuncio:anuncioModel) : Promise<anuncioModel> {

        const _upload = new UploadService()
        anuncio.imagem =  await _upload.UploadArquivo({
                       codigoProvedor: anuncio.codigo_provedor_fk.toString(),
                       file: anuncio.file?.buffer,
                       nomeArquivo: "anuncio"+anuncio.file?.originalname,
                       tipo: ETipoArquivo.ANUNCIO
                   })
        return await this._painelRepository.GravarAnuncio(anuncio);
    }

    async ExcluirAnuncio(id:string, codigoProvedor:number) : Promise<any> {
        await this._painelRepository.ExcluiAnuncio(id, codigoProvedor)

    }

    async EditarAnuncio(id:number, anuncioEdite:anuncioModel) : Promise<anuncioModel>  {
        const anuncio = await this._painelRepository.ObterAnuncioPorId(id, anuncioEdite.codigo_provedor_fk);
        
        if(anuncioEdite.titulo)
            anuncio.titulo = anuncioEdite.titulo;
        if(anuncioEdite.subtitulo)
            anuncio.subtitulo = anuncioEdite.subtitulo;
        if(anuncioEdite.descricao)
            anuncio.descricao = anuncioEdite.descricao;
        if(anuncioEdite.file ){
            
            const _upload = new UploadService();
            anuncio.imagem = await _upload.UploadArquivo({
               codigoProvedor: anuncioEdite.codigo_provedor_fk.toString(),
               file: anuncioEdite.file.buffer,
               nomeArquivo: "anuncio",
               tipo: ETipoArquivo.ANUNCIO
           });
        }
        if(anuncioEdite.link)
            anuncio.link = anuncioEdite.link;

        anuncio.ativo = anuncioEdite.ativo;

        const novoAnuncio = await this._painelRepository.EditarAnuncio(anuncio);

        return novoAnuncio;
    }

    async GravarBanner(anuncio: bannerModel): Promise<bannerModel> {
        return await this._painelRepository.GravarBanner(anuncio);
    }

    async ObterBanners(codigoProvedor: number): Promise<bannerModel[]> {
        const banners =  await this._painelRepository.ObterBanners(codigoProvedor);
        if(banners)
            return banners;
        return [];
    }

    async EditarBanner(id:number, bannerEdite: bannerModel): Promise<bannerModel> {
        const banner = await this._painelRepository.ObterBannerPorId(id, bannerEdite.codigo_provedor_fk);

        if(bannerEdite.selo)
            banner.selo = bannerEdite.selo;
        if(bannerEdite.titulo)
            banner.titulo = bannerEdite.titulo;
        if(bannerEdite.subtitulo)
            banner.subtitulo = bannerEdite.subtitulo;
        if(bannerEdite.cta)
            banner.cta = bannerEdite.cta;
        if(bannerEdite.cor1)
            banner.cor1 = bannerEdite.cor1;
        if(bannerEdite.cor2)
            banner.cor2 = bannerEdite.cor2;        
        if(bannerEdite.emoji)
            banner.emoji = bannerEdite.emoji;        
        if(bannerEdite.link)
            banner.link = bannerEdite.link;        
        //if(bannerEdite.ativo)     
        banner.ativo = true;

        const novoBanner = await this._painelRepository.EditarBanner(banner);

        return novoBanner;
    }

    async ExcluiBanner(idBanner: string, codigoProvedor: number): Promise<any> {
        return await this._painelRepository.ExcluiBanner(idBanner, codigoProvedor)
    }

}
