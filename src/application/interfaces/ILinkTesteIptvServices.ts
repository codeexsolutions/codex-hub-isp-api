import { linkTesteIptvModel } from "../../core/models/linkTesteIptvModel";

export default interface ILinkTesteIptvServices {
    Listar(): Promise<linkTesteIptvModel[]>;
    Criar(rotulo: string, url: string): Promise<linkTesteIptvModel>;
    DefinirPadrao(id: number): Promise<linkTesteIptvModel>;
}
