export type extratoPontosModel = {
    id:number;
    codigo_provedor_fk:number;
    cliente_cpf_cnpj:string;
    cliente_nome:string;
    tipo:"ganho"|"resgate";
    pontos:number;
    origem_compra_id:number|null;
    origem_recompensa_id:number|null;
    origem_indicacao_id?:number|null;
    motivo?:string|null;
    cupom_codigo:string|null;
    criado_em?:string;
}
