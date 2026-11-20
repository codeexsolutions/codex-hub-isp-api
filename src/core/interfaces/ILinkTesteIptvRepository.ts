import { linkTesteIptvModel } from "../models/linkTesteIptvModel";

export default interface ILinkTesteIptvRepository {
    Listar(): Promise<linkTesteIptvModel[]>;
    ObterPadrao(): Promise<linkTesteIptvModel | null>;
    Criar(rotulo: string, url: string): Promise<linkTesteIptvModel>;
    DefinirPadrao(id: number): Promise<linkTesteIptvModel>;
}
