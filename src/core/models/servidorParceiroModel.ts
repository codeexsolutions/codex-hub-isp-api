export type servidorParceiroModel = {
    id: number;
    nome_servidor: string;
    codigo_parceiro: string;
    url_servidor: string;
    valor_mensal: number;
    status: "ativo" | "inativo" | "pendente" | "cancelado";
    criado_em: string;
};
