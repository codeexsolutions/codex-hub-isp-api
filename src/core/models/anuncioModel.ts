export type anuncioModel = {
    id:string;
    titulo:string;
    subtitulo:string;
    descricao:string;
    imagem:string;
    link:string;
    codigo_provedor_fk:number;
    tipo:string;
    ativo:boolean;
    file?:  Express.Multer.File;
}