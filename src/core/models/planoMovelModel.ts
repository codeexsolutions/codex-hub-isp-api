export type planoMovelModel = {
    id: number;
    codigo_provedor_fk: number;
    nome: string;
    tipo: "movel" | "combo";
    gb_plano: number;
    gb_bonus: number;
    mega_fibra: number | null;
    beneficios: string | null;
    valor: number;
    ativo: boolean;
    ordem: number;
}
