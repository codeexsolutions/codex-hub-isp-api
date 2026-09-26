import { inject, injectable } from "tsyringe";
import { loginPainel, tokenDto } from "../Dtos/tokenDto";
import IProvedorRepository from "../../core/interfaces/IProvedorRepository";
import { eGerenciador } from "../../common/enuns/egerenciador";
import ITokenService from "../interfaces/ITokenService";
import JwtService from "./JwtServices";
import { tokenPainelDto } from "../Dtos/tokenPainelDto";
import { estatus } from "../../common/enuns/estatus";
import { adminLoginDto } from "../Dtos/adminLoginDto";
import TokenProviderFactory from "../../infrastructure/providers/token/TokenProviderFactory";

@injectable()
export default class TokenService implements ITokenService {

    private readonly _provedorRepository:IProvedorRepository;
    private readonly _jwtService:JwtService;
    private readonly _tokenProviderFactory:TokenProviderFactory;
    constructor(
        @inject("IProvedorRepository")provedorRepository:IProvedorRepository,
        @inject(TokenProviderFactory)tokenProviderFactory:TokenProviderFactory
    ){
        this._provedorRepository = provedorRepository;
        this._jwtService = new JwtService();
        this._tokenProviderFactory = tokenProviderFactory;
    }

    async ObterToken(codigoProvedor: string, cpf?: string): Promise<tokenDto> {

        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);

        if(provedor === null)
            throw new Error("Provedor não encontrado.");

        if(provedor.Status === estatus.INATIVO.toString())
            return {
                gerenciador: provedor.Gerenciador,
                codigoProvedor: provedor.ObterCodigoProvedor(),
                token: "",
                provedorAtivo: false
            };

        const tokenDto: tokenDto = {
            gerenciador: provedor.Gerenciador,
            codigoProvedor: provedor.ObterCodigoProvedor(),
            token: "",
            provedorAtivo: provedor.Status === estatus.ATIVO.toString()
        };

        return this._tokenProviderFactory.criar(provedor.Gerenciador).obterToken(provedor, codigoProvedor, cpf, tokenDto);
    }

    async TokenPorContrato(codigoProvedor:string, cpf:string, idContrato:string) : Promise<tokenDto> {

        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);

        if(provedor === null)
            throw new Error("Provedor não encontrado.");

        const tokenDto: tokenDto = {
            gerenciador: provedor.Gerenciador,
            codigoProvedor: provedor.ObterCodigoProvedor(),
            token: ""
        };

        return this._tokenProviderFactory.criar(provedor.Gerenciador).tokenPorContrato(provedor, codigoProvedor, cpf, idContrato, tokenDto);
    }

    // TODO: falta confirmar com o provedor como validar login/senha contra o IXC (comparar
    // radusuarios.senha retornado pela API listar? endpoint de autenticação dedicado?).
    // Por ora sempre nega, pra não liberar acesso sem validação real.
    async ObterTokenPorUsuarioSenha(codigoProvedor:string, login:string, senha:string): Promise<tokenDto> {

        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);

        if(provedor === null)
            throw new Error("Provedor não encontrado.");

        if(provedor.Gerenciador !== eGerenciador.IXCSOFT)
            throw new Error("Login por usuário e senha só está disponível pra provedores IXC.");

        throw new Error("Login por usuário e senha ainda não está disponível — em breve.");
    }

    async TokenAcessoPainel(loginPainel:loginPainel): Promise<tokenPainelDto> {
        
        const provedor = await this._provedorRepository.Login(loginPainel);

        if(provedor) {

            const token = this._jwtService.GerarToken({codigoProvedor: provedor.CodigoProvedor, id: provedor.Id })
            
            return {
                token: token,
                provedor: provedor
            };
        }

        throw new Error("Usuario ou senha invalido")

    }

    async TokenAcessoAdmin(login:adminLoginDto): Promise<string> {

        const usuario = process.env.ADMIN_USUARIO;
        const senha = process.env.ADMIN_SENHA;

        if(!usuario || !senha)
            throw new Error("Admin não configurado no servidor.");

        if(login.usuario !== usuario || login.senha !== senha)
            throw new Error("Usuario ou senha invalido");

        return this._jwtService.GerarToken({ id: "admin", codigoProvedor: "", role: "admin" });
    }
}