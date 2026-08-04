export type tokenDto = {
    gerenciador:string;
    codigoProvedor:number;
    token?:string;
    nome?:string;
    cpfCnpj?:string;
    isContrassenha?:boolean
    contratos?: contratoLoginDto[]
    multiploCadastro?:boolean;
    provedorAtivo?:boolean;
    contratoId?:number
}

export type contratoLoginDto = {
    id:number;
    nome:string;
    login:string;
    endereco:string;
    complemento:string;
    cidade:string;
    bairro:string;
    uf:string;
}

export type loginPainel = {
    usuario:string;
    senha:string;
    codigoProvedor?:string;
}