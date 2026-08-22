import { inject, injectable } from "tsyringe";
import { contratoLoginDto, loginPainel, tokenDto } from "../Dtos/tokenDto";
import IApiIxcSoftService from "../../infrastructure/apis/ixcsoft/interfaces/IApiIxcSoftService";
import IApiReceitanetServices from "../../infrastructure/apis/receitanet/interface/IApiReceitanetServices";
import IProvedorRepository from "../../core/interfaces/IProvedorRepository";
import { eGerenciador } from "../../common/enuns/egerenciador";
import { contratoLogin } from "../../infrastructure/apis/receitanet/Token";
import ITokenService from "../interfaces/ITokenService";
import JwtService from "./JwtServices";
import { tokenPainelDto } from "../Dtos/tokenPainelDto";
import { estatus } from "../../common/enuns/estatus";
import { adminLoginDto } from "../Dtos/adminLoginDto";

@injectable()
export default class TokenService implements ITokenService {
   
    private readonly _apiIxcSoft:IApiIxcSoftService;
    private readonly _apiReceitaNet:IApiReceitanetServices;
    private readonly _provedorRepository:IProvedorRepository;
    private readonly _jwtService:JwtService;
    constructor(@inject("IApiIxcSoftService")apiIxcSoft:IApiIxcSoftService, @inject("IApiReceitanetServices")apiReceitaNet:IApiReceitanetServices, @inject("IProvedorRepository")provedorRepository:IProvedorRepository){
        this._apiIxcSoft = apiIxcSoft;
        this._apiReceitaNet = apiReceitaNet;
        this._provedorRepository = provedorRepository;
        this._jwtService = new JwtService();
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

        if(provedor.Gerenciador === eGerenciador.IXCSOFT){
            const token = this._apiIxcSoft.Token(provedor);
            tokenDto.token = token;
            tokenDto.nome = "";
            tokenDto.isContrassenha = false;
            return tokenDto
        }

        const token = await this._apiReceitaNet.ObterToken(codigoProvedor, cpf);

        if("access_token" in token){
            tokenDto.token = token.access_token;
            tokenDto.nome = token.name;
            tokenDto.isContrassenha = token.isContrassenha
            tokenDto.multiploCadastro = false;
            return tokenDto;
        }

        tokenDto.multiploCadastro = token.multiploCadastro;

        tokenDto.contratos = token.contratos.map((contrato:contratoLogin) => {
            const ctr:contratoLoginDto = {
                id: contrato.id,
                nome: contrato.nome,
                login:contrato.login,
                endereco: contrato.endereco,
                complemento: contrato.complemento,
                bairro: contrato.bairro,
                cidade: contrato.cidade,
                uf: contrato.uf
            }
            return ctr;
        })
        return tokenDto;
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

        if(provedor.Gerenciador === eGerenciador.RECEITANET.toString()){

    
            const token = await this._apiReceitaNet.ObterTokenPorContrato(codigoProvedor, cpf, idContrato);
            tokenDto.token = token.access_token;
            tokenDto.nome = token.name;
            tokenDto.isContrassenha = token.isContrassenha;
            tokenDto.multiploCadastro = false;
    
            return tokenDto;
        }

        if(provedor.Gerenciador === eGerenciador.IXCSOFT.toString()){

            const tokenDto: tokenDto = {
                gerenciador: provedor.Gerenciador,
                codigoProvedor: provedor.ObterCodigoProvedor(),
                token: "",
                cpfCnpj: cpf
            };
    
            const token = this._apiIxcSoft.Token(provedor);
            tokenDto.token = token;
            tokenDto.nome = "";
            tokenDto.isContrassenha = false;
            tokenDto.multiploCadastro = false;
            tokenDto.contratoId = Number.parseInt(idContrato);
            return tokenDto;
        
        }

        return tokenDto

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