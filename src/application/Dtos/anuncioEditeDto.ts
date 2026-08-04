export type anuncioEditeDto = {
    id:string;
    titulo:string;
    subtitulo:string;
    descricao:string;
    link:string;
    codigo_provedor_fk:number;
    tipo:string;
    ativo:boolean;
    file?:  Express.Multer.File;
}