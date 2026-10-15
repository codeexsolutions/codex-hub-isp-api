import { inject, injectable } from "tsyringe";
import IRevendedorServices from "../interfaces/IRevendedorServices";
import IRevendedorRepository from "../../core/interfaces/IRevendedorRepository";
import IPainelRepository from "../../core/interfaces/IPainelRepository";
import { licencaTvModel } from "../../core/models/licencaTvModel";
import { gerarChaveLicenca } from "../../common/utilities/chaveLicenca";
import JwtService from "./JwtServices";

@injectable()
export default class RevendedorServices implements IRevendedorServices {

    private readonly _revendedorRepository:IRevendedorRepository;
    private readonly _painelRepository:IPainelRepository;
    private readonly _jwtService:JwtService;

    constructor(
        @inject("IRevendedorRepository") revendedorRepository:IRevendedorRepository,
        @inject("IPainelRepository") painelRepository:IPainelRepository
    ){
        this._revendedorRepository = revendedorRepository;
        this._painelRepository = painelRepository;
        this._jwtService = new JwtService();
    }

    async Login(usuario: string, senha: string): Promise<string> {
        const revendedor = await this._revendedorRepository.ObterPorUsuarioSenha(usuario, senha);
        if (!revendedor)
            throw new Error("Usuário ou senha inválido");

        return this._jwtService.GerarToken({ id: revendedor.id.toString(), codigoProvedor: "", revendedorId: revendedor.id.toString(), role: "revendedor" });
    }

    async ListarMinhasLicencas(revendedorId: number): Promise<licencaTvModel[]> {
        return await this._revendedorRepository.ListarLicencasTv(revendedorId);
    }

    // Mesma licença anual do Synk TV que o admin cria pro cliente avulso —
    // usa o mesmo valor global configurado em config_licenca_tv (decisão:
    // valor/Pix da licença continuam únicos pra todo mundo, não por
    // revendedor). O que é individual por revendedor é só o link de
    // renovação da LISTA (Mercado Pago), definido depois via
    // DefinirLinkPagamentoLista.
    async CriarLicenca(revendedorId: number, nome: string, telefone: string): Promise<licencaTvModel> {
        if (!nome?.trim() || !telefone?.trim())
            throw new Error("Informe nome e telefone.");

        const config = await this._painelRepository.ObterConfigLicencaTv();
        const chave = gerarChaveLicenca();
        return await this._revendedorRepository.CriarLicencaTv(revendedorId, chave, nome.trim(), telefone.trim(), Number(config.valor_anual));
    }

    async AprovarLicenca(id: number, revendedorId: number): Promise<licencaTvModel> {
        const atual = await this._revendedorRepository.ObterLicencaTvPorId(id, revendedorId);
        if (!atual)
            throw new Error("Licença não encontrada.");

        return await this._revendedorRepository.AprovarLicencaTv(id, revendedorId);
    }

    async CancelarLicenca(id: number, revendedorId: number): Promise<licencaTvModel> {
        const atual = await this._revendedorRepository.ObterLicencaTvPorId(id, revendedorId);
        if (!atual)
            throw new Error("Licença não encontrada.");

        return await this._revendedorRepository.CancelarLicencaTv(id, revendedorId);
    }

    async DefinirLinkPagamentoLista(id: number, revendedorId: number, link: string | null): Promise<licencaTvModel> {
        const atual = await this._revendedorRepository.ObterLicencaTvPorId(id, revendedorId);
        if (!atual)
            throw new Error("Licença não encontrada.");

        return await this._revendedorRepository.DefinirLinkPagamentoListaLicencaTv(id, revendedorId, link?.trim() || null);
    }
}
