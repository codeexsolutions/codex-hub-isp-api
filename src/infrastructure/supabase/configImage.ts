import sharp from "sharp";
import { ETipoArquivo } from "./ETipoArquivo";

export type configImage = {
    width?: number,
    height?: number,
    quality:number,
    fit:keyof sharp.FitEnum,
    tipo?:ETipoArquivo,
    path:string
    position?:string,
    contentType:string;
}

export type upload = {
    buffer:Buffer;
    path:string;
    contentType:string;
}

