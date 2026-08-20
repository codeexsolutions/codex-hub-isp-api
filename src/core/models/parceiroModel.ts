export type parceiroModel = {
    id:number;
    nome:string;
    usuario:string;
    senha?:string;
    ativo:boolean;
    // null/undefined = parceiro nacional (visível pra todos os provedores);
    // preenchido = só o provedor dono enxerga esse parceiro.
    codigo_provedor_fk?:number|null;
    provedor_nome?:string;
    // cidade/UF do parceiro — mostrado no card da oferta pro provedor avaliar se faz
    // sentido ativar (evita ativar oferta de parceiro de outra região).
    cidade?:string|null;
    uf?:string|null;
    // endereço/contato completos — mostrados pro cliente no app junto da oferta,
    // pra ele já saber onde/como usar o cupom.
    endereco?:string|null;
    contato?:string|null;
    criado_em?:string;
}
