export type ofertaEditeDto = {
    id:string;
    categoria:string;
    parceiro:string;
    titulo:string;
    subtitulo:string;
    descricao:string;
    link:string;
    ativo:boolean;
    valor?:number|null;
    valor_original?:number|null;
    validade_fim?:string|null;
    regras?:string|null;
    parceiroId:number;
    file?:  Express.Multer.File;
}
