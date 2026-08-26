export type ativacaoTvModel = {
    id: number;
    codigo: string;
    codigo_provedor_fk: number;
    cliente_nome: string | null;
    status: "ativo" | "revogado";
    criado_em: string;
    usado_em: string | null;
};
