export type assinaturaModel = {
    id:number;
    codigo_provedor_fk:number;
    valor_mensalidade:number;
    data_adesao:string;
    plano_id?:number|null;
    somar_ativacao_tv:boolean;
    ativo:boolean;
    criado_em?:string;
}
