import { UUIDTypes } from "uuid";
import { eGerenciador } from "../../common/enuns/egerenciador";
import { estatus } from "../../common/enuns/estatus";

export type provedorDto = {
    gerenciador:string;
    status:string;
    nomeFantasia:string;
    codigoApiGerenciador:number;
    chaveApiGerenciador:string;
}

export type temaDto = {
    codigo: string;
    nome:string;
    tag: string;
    accent:string;
    accent2: string;
    glyph: string;
    logo_url: string;
    logo:string;
    favicon:string;
    icon192:string;
    icon512:string;
    masckable:string;
}

export type provedorPainelDto = {
    id:UUIDTypes;
    created_at?:Date;
    codigo_provedor:number;
    empresa:string;
    nome_fantasia:string;
    gerenciador:eGerenciador;
    status:estatus;
    codigo_api_gerenciador:number;
    chave_api_gerenciador:string;
    nome_administrador:string;
    cnpj:string;
    dominio_ixc?:string;
    usuario:string;
    senha?: string;
}