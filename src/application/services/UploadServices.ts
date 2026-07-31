import { configImage } from "../../infrastructure/supabase/configImage";
import { ETipoArquivo } from "../../infrastructure/supabase/ETipoArquivo";
import Storage from "../../infrastructure/supabase/Storage";
import { uploadoDto } from "../Dtos/upload.dto";
import { UUIDTypes, v4 as uuidv4} from "uuid";

export default class UploadService {

    private readonly _storage: Storage;
    constructor(){
        this._storage = new Storage();
    }

    async UploadArquivo(upload:uploadoDto) : Promise<string> {
        
        const CONFIG: Record<ETipoArquivo, configImage> = {
            
            [ETipoArquivo.LOGO]: {
                width:600,
                height:600,
                quality:90,
                fit:"inside",
                path:`${upload.codigoProvedor}/logo.webp`,
                contentType: "image/webp"
            },
            [ETipoArquivo.ICON192]:{
                width:192,
                height:192,
                quality:90,
                fit:"cover",
                path:`${upload.codigoProvedor}/icon192.png`,
                contentType: "image/png"
            },
            [ETipoArquivo.ICON512]:{
                width:512,
                height:512,
                quality:90,
                fit:"cover",
                path:`${upload.codigoProvedor}/icon512.png`,
                contentType: "image/png"
            },
            [ETipoArquivo.MASKABLE]:{
                width:512,
                height:512,
                quality:90,
                fit:"cover",
                path:`${upload.codigoProvedor}/maskable.png`,
                contentType: "image/png"
            },
            [ETipoArquivo.FAVICON]:{
                width:64,
                height:64,
                quality:90,
                fit:"cover",
                path:`${upload.codigoProvedor}/favicon.png`,
                contentType: "image/png"
            },
            [ETipoArquivo.ANUNCIO]:{
                width:1080,
                height:1920,
                quality:90,
                fit:"cover",
                position:"centre",
                path:`${upload.codigoProvedor}/anuncios/${uuidv4()}.webp`,
                contentType: "image/webp"
            },

        }
        
        const config = CONFIG[upload.tipo];
        
        const buffer = await this._storage.Optimize(upload.file as Buffer, config)

        const publicUrl = await this._storage.Upload(buffer, config.path , config.contentType )

        return publicUrl;
    }

}