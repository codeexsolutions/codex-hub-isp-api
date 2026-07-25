import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { ETipoArquivo } from "./ETipoArquivo";
import { UUIDTypes, v4 as uuidv4} from "uuid";
import { configImage } from "./configImage";
import { buffer } from "node:stream/consumers";

export default class Storage {

    
    private readonly client;

    constructor() {

        this.client = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

    }

    public async Upload(buffer:Buffer, path:string, contentType:string): Promise<string> {


        const { error } = await this.client.storage
            .from("provedores")
            .upload(path, buffer, {
                contentType: contentType,
                upsert:true
            }
        );

        if (error)
            throw error;

        const { data } = this.client.storage
            .from("provedores")
            .getPublicUrl(path);

        return data.publicUrl;  
    }

    public async Optimize(buffer:Buffer, config:configImage): Promise<Buffer> {
       
        const image = sharp(buffer)
            .resize(config.width, config.height, {
                fit:config.fit,
                position: config.position
            })
    
        return config.tipo === 5 
            ? await image.webp({quality: config.quality}).toBuffer() 
            : await image.png({quality: config.quality}).toBuffer() ;

    } 

}