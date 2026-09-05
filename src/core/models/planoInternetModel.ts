export type planoInternetModel = {
    id: number;
    codigo_provedor_fk: number;
    nome: string;
    velocidade_mega: number;
    valor: number;
    beneficios: string | null;
    destaque: boolean;
    ativo: boolean;
    ordem: number;
}
