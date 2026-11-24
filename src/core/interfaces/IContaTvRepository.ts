import { contaTvModel } from "../models/contaTvModel";

export type DadosIptvTeste = {
    usuario: string;
    senha: string;
    dns: string;
    pacote: string;
    vencimento: Date;
    linkPagamento: string;
};

export default interface IContaTvRepository {
    ObterPorEmail(email: string): Promise<contaTvModel | null>;
    ObterPorId(id: number): Promise<contaTvModel | null>;
    Criar(nome: string, email: string, senhaHash: string, iptv: DadosIptvTeste): Promise<contaTvModel>;
    Listar(): Promise<contaTvModel[]>;
    DefinirStatusPagamento(id: number, status: string): Promise<contaTvModel>;
    DefinirIptv(id: number, usuario: string, senha: string, dns: string, vencimento: Date | null): Promise<contaTvModel>;
    ContarNaoNotificadas(): Promise<number>;
    MarcarNotificada(id: number): Promise<void>;
    Excluir(id: number): Promise<void>;
}
