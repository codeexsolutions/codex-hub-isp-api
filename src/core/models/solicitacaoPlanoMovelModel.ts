export type solicitacaoPlanoMovelModel = {
    id: number;
    codigo_provedor_fk: number;
    plano_id_fk: number | null;
    plano_nome: string;
    plano_valor: number;
    cliente_cpf_cnpj: string;
    cliente_nome: string | null;
    status: "pendente" | "atendida" | "cancelada";
    criado_em: string;
}
