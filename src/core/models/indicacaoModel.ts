export type indicacaoModel = {
    id?:number;
    cliente:string;
    cliente_cpf_cnpj?:string;
    nome:string;
    contato:string;
    mensagem:string;
    codigo_provedor:number;
    status?:"pendente"|"efetivada";
    pontos_creditados?:boolean;
    criado_em?:string;
}