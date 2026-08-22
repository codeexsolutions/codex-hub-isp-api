export type chamadoDto = {
    id: number,
    protocolo: string,
    descricao: string,
    status: string,
    respostasStatus: number,
    solucao?: string
}

export type abrirChamadoRequest = {
    gerenciador:string;
    token:string;
    cpfCnpj?:string;
    codigoProvedor?:string;
    payload:object;
}

export type payload = {
    assunto:string;
    categoria:string;
    descricao:string;
    dataAbertura: string;
    idAssunto?:number;
}