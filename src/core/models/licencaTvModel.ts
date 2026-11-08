export type licencaTvModel = {
    id: number;
    chave: string;
    nome: string;
    telefone: string;
    status: "pendente" | "teste" | "ativa" | "vencida" | "cancelada";
    tier: "normal" | "pro";
    valor: number;
    vencimento: string | null;
    criado_em: string;
    ativado_em: string | null;
    link_pagamento_lista?: string | null;
};

export type configLicencaTvModel = {
    valor_anual: number;
    valor_anual_pro: number;
    chave_pix: string;
    nome_recebedor: string;
    cidade: string;
};

// Sync de histórico/perfil entre aparelhos — só pra licença tier "pro".
export type perfilTvSyncModel = {
    historico_filmes: unknown[];
    historico_series: unknown[];
    interacoes: unknown[];
    atualizado_em: string;
};
