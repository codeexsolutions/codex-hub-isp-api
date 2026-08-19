export type beneficioModel = {
    id:string;
    categoria:string;
    parceiro:string;
    titulo:string;
    subtitulo:string;
    descricao:string;
    link_imagem:string;
    link_acao:string;
    codigo_provedor_fk:number;
    ativo:boolean;
    valor?:number|null;
    parceiro_id_fk?:number|null;
    file?:  Express.Multer.File;
}
