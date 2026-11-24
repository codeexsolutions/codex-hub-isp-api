import { contaTvModel } from "../../core/models/contaTvModel";

export type CadastroContaTvResultado = {
    token: string;
    conta: contaTvModel;
};

export default interface IContaTvServices {
    Cadastrar(nome: string, email: string, senha: string): Promise<CadastroContaTvResultado>;
    Login(email: string, senha: string): Promise<CadastroContaTvResultado>;
    ObterMinhaConta(contaId: number): Promise<contaTvModel>;

    Listar(): Promise<contaTvModel[]>;
    DefinirStatusPagamento(id: number, status: string): Promise<contaTvModel>;
    DefinirIptv(id: number, usuario: string, senha: string, dns: string, vencimento: string | null): Promise<contaTvModel>;
    ContarNaoNotificadas(): Promise<number>;
    MarcarNotificada(id: number): Promise<void>;
    Excluir(id: number): Promise<void>;
}
