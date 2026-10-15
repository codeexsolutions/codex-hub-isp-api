export type revendedorModel = {
    id: number;
    nome: string;
    usuario: string;
    senha?: string;
    status: "ATIVO" | "INATIVO";
    criado_em: string;
}
