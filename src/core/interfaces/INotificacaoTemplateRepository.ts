import { notificacaoTemplateModel } from "../models/notificacaoTemplateModel";

export default interface INotificacaoTemplateRepository {
    Listar(codigoProvedor:number) : Promise<notificacaoTemplateModel[]>;
    Criar(codigoProvedor:number, nome:string, titulo:string, corpo:string) : Promise<notificacaoTemplateModel>;
    Excluir(id:number, codigoProvedor:number) : Promise<void>;
}
