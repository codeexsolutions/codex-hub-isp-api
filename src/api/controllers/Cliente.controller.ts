import { inject, injectable } from "tsyringe";
import { Request, Response } from "express";
import IReceitanetServices from "../../application/interfaces/IReceitanetServicest";
import { reqBodyDadosClienteDto } from "../../application/Dtos/reqBodyDadosClienteDto";
import { eGerenciador } from "../../common/enuns/egerenciador";
import { retornoPadrao } from "../../application/Dtos/retornoPadrao";
import { clienteDto } from "../../application/Dtos/clienteDto";
import IIxcSoftServices from "../../application/interfaces/IIxcSoftServices";
import { multiplos } from "../../infrastructure/apis/receitanet/responseModels/responseMultiContratos";

@injectable()
export default class ClienteController {

    private readonly _receitaNetService:IReceitanetServices;
    private readonly _ixcSoftService:IIxcSoftServices;
    
    constructor(@inject("IReceitanetServices")receitaNetService:IReceitanetServices, @inject("IIxcSoftServices")ixcSoftService:IIxcSoftServices){
        this._receitaNetService = receitaNetService;
        this._ixcSoftService = ixcSoftService;
    }

    async ObterDadosCliente(req:Request, res:Response){

        const data:reqBodyDadosClienteDto = req.body;
        try {
            
            if(data.gerenciador === eGerenciador.RECEITANET){
                const result = await this._receitaNetService.ObterDadosCliente(data.token);
    
                const retorno: retornoPadrao<clienteDto> = {
                    statusCode:200,
                    message:"Dados Cliente "+ data.gerenciador,
                    data: result 
                }
    
                return res.json(retorno);
            }
    
            if(data.gerenciador === eGerenciador.IXCSOFT){
                const result = await this._ixcSoftService.ObterDadosCliente(data.cpfCnpj, data.codigoProvedor, data.contratoId as number)
                
                if(result === null){
                    const retorno: retornoPadrao<any> = {
                        statusCode:400,
                        message:"Dados Cliente "+ data.gerenciador,
                        data: "Cliente com contrato inativo"
                }
                
                return res.status(400).json(retorno);
                }
           

                const retorno: retornoPadrao<clienteDto|multiplos> = {
                    statusCode:200,
                    message:"Dados Cliente "+ data.gerenciador,
                    data: result 
                }
    
                return res.json(retorno);
            }
        } catch (error:any) {

            const retorno: retornoPadrao<any> = {
                statusCode:500,
                message:"Dados Cliente "+ data.gerenciador,
                data: error.message
            }
            
            return res.status(500).json(retorno);
        }
    }

    async ObterFaturas(req:Request, res:Response){

        const data = req.body;
        if(data.gerenciador === eGerenciador.RECEITANET){

            const faturas = await this._receitaNetService.ObterFaturas(data.data.token)
            const retorno: retornoPadrao<any> = {
                    statusCode:200,
                    message:"Faturas "+ data.gerenciador,
                    data: faturas 
                }
    
                return res.json(retorno);
        }

        if(data.token.gerenciador === eGerenciador.IXCSOFT){

            const faturas = await this._ixcSoftService.ObterFaturas(data.idContrato, data.token.codigoProvedor);
            const retorno: retornoPadrao<any> = {
                    statusCode:200,
                    message:"Faturas "+ data.gerenciador,
                    data: faturas 
                }
    
            return res.json(retorno);
        }
    }
}