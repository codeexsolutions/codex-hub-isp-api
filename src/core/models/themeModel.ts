import { ThemeFiles } from "../../application/Dtos/temaFiles.dto";

export type themeModel = {
    nome_fantasia:string;
    tag?:string;
    accent?:string;
    accent2?:string;
    glyph?:string;
    codigo:number;
    logo?:string;
    favicon?:string;
    icone192:string;
    icone512:string;
    maskable:string;
}