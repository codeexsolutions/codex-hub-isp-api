export type faturaModel = {
    id:number;
    codigo_provedor_fk:number;
    competencia:string;
    vencimento:string;
    valor:number;
    status:"pendente"|"pago"|"cancelado";
    pago_em?:string|null;
    criado_em?:string;
    // presentes só na listagem do admin (JOIN com provedores/provedor_assinaturas).
    provedor_nome?:string;
    provedor_cnpj?:string;
}
