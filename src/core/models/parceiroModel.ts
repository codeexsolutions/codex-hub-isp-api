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
    criado_em?:string;
}
