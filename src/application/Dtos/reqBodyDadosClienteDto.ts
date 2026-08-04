export type reqBodyDadosClienteDto = {
    cpfCnpj:string;
    gerenciador:string;
    token:string,
    name:string,
    isContrassenha:boolean,
    codigoProvedor:string,
    contratoId?:number
}