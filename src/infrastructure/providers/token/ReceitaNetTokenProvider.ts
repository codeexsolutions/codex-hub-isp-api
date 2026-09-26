import { inject, injectable } from "tsyringe";
import ITokenProvider from "../../../core/contracts/token/ITokenProvider";
import Provedor from "../../../core/domains/Provedor";
import { contratoLoginDto, tokenDto } from "../../../application/Dtos/tokenDto";
import IApiReceitanetServices from "../../apis/receitanet/interface/IApiReceitanetServices";
import { contratoLogin } from "../../apis/receitanet/Token";

@injectable()
export default class ReceitaNetTokenProvider implements ITokenProvider {

    private readonly _apiReceitaNet: IApiReceitanetServices;

    constructor(@inject("IApiReceitanetServices") apiReceitaNet: IApiReceitanetServices) {
        this._apiReceitaNet = apiReceitaNet;
    }

    async obterToken(provedor: Provedor, codigoProvedor: string, cpf: string | undefined, base: tokenDto): Promise<tokenDto> {

        const token = await this._apiReceitaNet.ObterToken(codigoProvedor, cpf);

        if ("access_token" in token) {
            base.token = token.access_token;
            base.nome = token.name;
            base.isContrassenha = token.isContrassenha;
            base.multiploCadastro = false;
            return base;
        }

        base.multiploCadastro = token.multiploCadastro;
        base.contratos = token.contratos.map((contrato: contratoLogin) => {
            const ctr: contratoLoginDto = {
                id: contrato.id,
                nome: contrato.nome,
                login: contrato.login,
                endereco: contrato.endereco,
                complemento: contrato.complemento,
                bairro: contrato.bairro,
                cidade: contrato.cidade,
                uf: contrato.uf
            }
            return ctr;
        });
        return base;
    }

    async tokenPorContrato(provedor: Provedor, codigoProvedor: string, cpf: string, idContrato: string, base: tokenDto): Promise<tokenDto> {

        const token = await this._apiReceitaNet.ObterTokenPorContrato(codigoProvedor, cpf, idContrato);
        base.token = token.access_token;
        base.nome = token.name;
        base.isContrassenha = token.isContrassenha;
        base.multiploCadastro = false;
        return base;
    }
}
