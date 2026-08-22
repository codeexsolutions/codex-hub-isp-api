export type comissaoFaturaModel = {
    id: number;
    parceiro_id_fk: number;
    competencia: string;
    vencimento: string;
    valor: number;
    status: string;
    pago_em?: string|null;
    criado_em?: string;
}
