import { loginPainel, tokenDto } from "../Dtos/tokenDto";
import { tokenPainelDto } from "../Dtos/tokenPainelDto";
import { adminLoginDto } from "../Dtos/adminLoginDto";

export default interface ITokenService {
    ObterToken(codigoProvedor:string, cpf?:string):Promise<tokenDto>
    TokenPorContrato(codigoProvedor:string, cpf:string, idContrato:string) : Promise<tokenDto>
    //PAINEL
    TokenAcessoPainel(loginPainel:loginPainel): Promise<tokenPainelDto>
    //ADMIN
    TokenAcessoAdmin(login:adminLoginDto): Promise<string>
}