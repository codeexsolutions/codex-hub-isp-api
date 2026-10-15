import { licencaTvModel } from "../../core/models/licencaTvModel";

export default interface IRevendedorServices {
    Login(usuario:string, senha:string) : Promise<string>;
    ListarMinhasLicencas(revendedorId:number) : Promise<licencaTvModel[]>;
    CriarLicenca(revendedorId:number, nome:string, telefone:string) : Promise<licencaTvModel>;
    AprovarLicenca(id:number, revendedorId:number) : Promise<licencaTvModel>;
    CancelarLicenca(id:number, revendedorId:number) : Promise<licencaTvModel>;
    DefinirLinkPagamentoLista(id:number, revendedorId:number, link:string|null) : Promise<licencaTvModel>;
}
