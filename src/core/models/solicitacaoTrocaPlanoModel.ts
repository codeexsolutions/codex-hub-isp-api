// Mesmo formato de solicitacaoPlanoMovelModel — solicitação de troca do plano
// de INTERNET (fibra), sobre o catálogo planos_internet (Vitrine de Planos),
// não sobre planos_moveis. Tabela própria pra não misturar os dois fluxos.
export type solicitacaoTrocaPlanoModel = {
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
