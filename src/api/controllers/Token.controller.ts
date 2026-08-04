import { inject, injectable } from "tsyringe";
import ITokenService from "../../application/interfaces/ITokenService";
import { Request, Response } from "express";
import { retornoPadrao } from "../../application/Dtos/retornoPadrao";
import { loginPainel, tokenDto } from "../../application/Dtos/tokenDto";
import { tokenPainelDto } from "../../application/Dtos/tokenPainelDto";
import { eGerenciador } from "../../common/enuns/egerenciador";

@injectable()
export default class TokenController{

    private readonly _tokenService:ITokenService;
    
    constructor(@inject("ITokenService")tokenService:ITokenService){
        this._tokenService = tokenService;
    }

    async ObterToken(req:Request, res:Response){

        const data = req.body;
        try {
            
            const token = await this._tokenService.ObterToken(data.codigoProvedor, data.cpfCnpj);
    
            if(!token){
    
                const retorno: retornoPadrao<null> = {
                    statusCode: 500,
                    message: "Erro ao obter Token.",
                    data: null
                }
                return res.json(retorno);
            }

            if(token.provedorAtivo){
                if(token.gerenciador === eGerenciador.RECEITANET.toString()){

                    if(token.multiploCadastro){
                        const retorno: retornoPadrao<tokenDto> = {
                            statusCode: 200,
                            message: "Multiplos Cadastros. Escolha um contrato para continuar.",
                            data: token
                        }
                        return res.json(retorno);
                    }else{
            
                        const retorno: retornoPadrao<tokenDto> = {
                               statusCode: 200,
                               message: "Token retornado com sucesso.",
                               data: token
                           }
                       return res.json(retorno);
                    }
                }                
                
                
                if(token.gerenciador === eGerenciador.IXCSOFT.toString()){
                    const retorno: retornoPadrao<tokenDto> = {
                        statusCode: 200,
                        message: "Token retornado com sucesso.",
                        data: token
                    }
                    return res.status(200).json(retorno);
                }
                
            }
            
            const retorno: retornoPadrao<string> = {
                statusCode: 401,
                message: "Não Autorizado",
                data: 'Provedor não está ativo.'
            }
            return res.status(401).json(retorno);
            
        } catch (error:any) {
            const retorno: retornoPadrao<string> = {
                       statusCode: 401,
                       message: error.message,
                       data: 'Cliente não está com contrato ativo.'
                   }
               return res.status(401).json(retorno);
        }    

        
    }

    async ObterTokenPorContrato(req:Request, res: Response) {

        const data = req.body;

        const token = await this._tokenService.TokenPorContrato(data.codigoProvedor, data.cpfCnpj, data.contratoId);
        
        const retorno: retornoPadrao<tokenDto> = {
            statusCode: 200,
            message: "Token retornado com sucesso.",
            data: token
        }
        return res.json(retorno);
    }

    async LoginPainel(req:Request, res:Response){

        const data = req.body as loginPainel;
        
        try {
           
            const token = await this._tokenService.TokenAcessoPainel(data);
    
            const retorno: retornoPadrao<tokenPainelDto> = {
                statusCode: 200,
                message: "Token retornado com sucesso.",
                data: token
            }
            return res.json(retorno);
            
        } catch (error) {

            const retorno: retornoPadrao<string> = {
                statusCode: 500,
                message: "Usuario ou Senha invalido.",
                data: ""
            }
            return res.json(retorno);
        }
    }
}