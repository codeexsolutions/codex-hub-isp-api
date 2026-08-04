import { anuncioModel } from "../../core/models/anuncioModel";
import { bannerModel } from "../../core/models/bannerModel";
import { anuncioEditeDto } from "../Dtos/anuncioEditeDto";

export default interface IPainelServices {
    
    GravarAnuncio(anuncio:anuncioModel) : Promise<anuncioModel>
    ExcluirAnuncio(id:string, codigoProvedor:number) : Promise<any> 
    EditarAnuncio(id:number, anuncio:anuncioEditeDto) : Promise<anuncioModel> 

    // BANNERS
    GravarBanner(banner:bannerModel) : Promise<bannerModel>
    ObterBanners(codigoProvedor: number) : Promise<bannerModel[]>
    EditarBanner(id:number, banner:bannerModel) : Promise<bannerModel>
    ExcluiBanner(idAnuncio:string, codigoProvedor:number) : Promise<any>
}