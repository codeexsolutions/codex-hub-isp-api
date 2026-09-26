import { UUIDTypes } from "uuid";
import { estatus } from "../../common/enuns/estatus";
import { eGerenciador } from "../../common/enuns/egerenciador";

export type provedorModel = {
    
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
    dominio_mkauth?:string;
    mkauth_client_id?:string;
    usuario:string;
    senha:string;
}