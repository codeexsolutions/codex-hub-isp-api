import { ThemeFiles } from "../../application/Dtos/temaFiles.dto";

export type themeModel = {
    nome_fantasia:string;
    tag?:string;
    accent?:string;
    accent2?:string;
    glyph?:string;
    codigo_provedor_fk:number;
    logo_url?:string;
    favicon_url?:string;
    icone192_url:string;
    icone512_url:string;
    maskable_url:string;
}