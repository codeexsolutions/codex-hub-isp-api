import { notificacaoClienteModel } from "../models/notificacaoClienteModel";

export default interface INotificacaoClienteRepository {
    Salvar(cpf:string, codigoProvedor:string, titulo:string, corpo:string) : Promise<void>;
    Listar(cpf:string, codigoProvedor:string) : Promise<notificacaoClienteModel[]>;
    ContarNaoLidas(cpf:string, codigoProvedor:string) : Promise<number>;
    MarcarLida(id:number, cpf:string, codigoProvedor:string) : Promise<void>;
    Excluir(id:number, cpf:string, codigoProvedor:string) : Promise<void>;
}
