export type licencaTvModel = {
    id: number;
    chave: string;
    nome: string;
    telefone: string;
    status: "pendente" | "teste" | "ativa" | "vencida" | "cancelada";
    valor: number;
    vencimento: string | null;
    criado_em: string;
    ativado_em: string | null;
};

export type configLicencaTvModel = {
    valor_anual: number;
};
