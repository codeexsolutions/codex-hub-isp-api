export type assinaturaModel = {
    id:number;
    codigo_provedor_fk:number;
    valor_mensalidade:number;
    data_adesao:string;
    plano_id?:number|null;
    valor_lista?:number|null;
    desconto?:number|null;
    ativo:boolean;
    criado_em?:string;
}
