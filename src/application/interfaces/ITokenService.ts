import { loginPainel, tokenDto } from "../Dtos/tokenDto";
import { tokenPainelDto } from "../Dtos/tokenPainelDto";
import { adminLoginDto } from "../Dtos/adminLoginDto";

export default interface ITokenService {
    ObterToken(codigoProvedor:string, cpf?:string):Promise<tokenDto>
    TokenPorContrato(codigoProvedor:string, cpf:string, idContrato:string) : Promise<tokenDto>
    // TODO: login por usuário/senha (IXCSOFT) — falta confirmar com o provedor como validar
    // as credenciais contra o IXC (comparar radusuarios.senha? endpoint de autenticação
    // dedicado?). Por enquanto sempre lança erro "não disponível".
    ObterTokenPorUsuarioSenha(codigoProvedor:string, login:string, senha:string) : Promise<tokenDto>
    //PAINEL
    TokenAcessoPainel(loginPainel:loginPainel): Promise<tokenPainelDto>
    //ADMIN
    TokenAcessoAdmin(login:adminLoginDto): Promise<string>
}