import { revendedorModel } from "../models/revendedorModel";
import { licencaTvModel } from "../models/licencaTvModel";

export default interface IRevendedorRepository {
    ObterPorUsuarioSenha(usuario:string, senha:string) : Promise<revendedorModel|null>;
    ObterPorId(id:number) : Promise<revendedorModel|null>;

    ListarLicencasTv(revendedorId:number) : Promise<licencaTvModel[]>;
    CriarLicencaTv(revendedorId:number, chave:string, nome:string, telefone:string, valor:number) : Promise<licencaTvModel>;
    ObterLicencaTvPorId(id:number, revendedorId:number) : Promise<licencaTvModel|null>;
    AprovarLicencaTv(id:number, revendedorId:number) : Promise<licencaTvModel>;
    CancelarLicencaTv(id:number, revendedorId:number) : Promise<licencaTvModel>;
    DefinirLinkPagamentoListaLicencaTv(id:number, revendedorId:number, link:string|null) : Promise<licencaTvModel>;
}
