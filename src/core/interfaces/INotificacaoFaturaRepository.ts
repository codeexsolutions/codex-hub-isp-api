export type assinanteComPush = {
    cpf:string;
    codigoProvedor:string;
}

export default interface INotificacaoFaturaRepository {
    ListarAssinantesComPush() : Promise<assinanteComPush[]>;
    JaNotificado(cpf:string, codigoProvedor:string, faturaId:string, tipo:string) : Promise<boolean>;
    RegistrarNotificacao(cpf:string, codigoProvedor:string, faturaId:string, tipo:string) : Promise<void>;
}
