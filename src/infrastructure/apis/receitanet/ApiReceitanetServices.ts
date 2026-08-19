import { inject, injectable } from "tsyringe";
import RequestService from "../requesService";
import { configRequest } from "../configRequest";
import { emethodHttp } from "../../../common/enuns/emethodhttp";
import { SomenteNumeros } from "../../../common/utilities/utils";
import IProvedorRepository from "../../../core/interfaces/IProvedorRepository";
import IApiReceitanetServices from "./interface/IApiReceitanetServices";
import Chamado from "../../../core/domains/Chamado";
import { responseToken } from "./responseModels/responseToken";
import { responseClienteResumo, fatura } from "./responseModels/responseClienteResumo";
import { multiplos } from "./responseModels/responseMultiContratos";
import { responseChamados } from "./responseModels/responseChamados";

@injectable()
export default class ApiReceitanetServices implements IApiReceitanetServices {
    
    private _provedorRepository:IProvedorRepository;
    private readonly requestService:RequestService;
    constructor(@inject("IProvedorRepository") provedorRepository:IProvedorRepository){
        this._provedorRepository = provedorRepository;
        this.requestService = new RequestService("https://api.receitanet.net/centralassinante/v1/");
    }
    
    async ObterToken(codigoProvedor:string, cpf:string) : Promise<responseToken | multiplos> {
        
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
               
        const codigo = provedor.ObterCodigoApiGerenciador();
        const secret = provedor.ObterChaveApiGerenciador();
        
        const configRequest: configRequest = {
            method: emethodHttp.POST,
            resource: "token",
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: { 
                "grant_type": "password",
                "client_id": codigo,
                "client_secret": secret,
                "cpfcnpj": SomenteNumeros(cpf)
            }
        }
        
        const response = await this.requestService.Requst(configRequest);

        const data = await response.json();
        
        if("access_token" in data){   
            
            return data as responseToken
        }

        return data as multiplos;
    }

    async ObterTokenPorContrato(codigoProvedor:string, cpf:string, idContrato:string): Promise<responseToken> {
        
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
               
        const codigo = provedor.ObterCodigoApiGerenciador();
        const secret = provedor.ObterChaveApiGerenciador();
        
        const configRequest: configRequest = {
            method: emethodHttp.POST,
            resource: "token",
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: { 
                "grant_type": "password",
                "client_id": codigo,
                "client_secret": secret,
                "cpfcnpj": SomenteNumeros(cpf),
                "idCliente": idContrato
            }
        }
        
        const response = await this.requestService.Requst(configRequest);

        const token = await response.json() as responseToken;
        
        if(token.access_token){
            return token
        }

        return token;
    }

    async ObterResumoCliente(token: string): Promise<responseClienteResumo> {       
   
        const configRequest:configRequest = {
            method: emethodHttp.GET,
            resource: "cliente/resumo",
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }

        const response = await this.requestService.Requst(configRequest);
        const resumo = await response.json() as responseClienteResumo;
        return resumo;
       // return requestParaClientetMapper(resumo);

    }

    async ObterFaturas(token: string) : Promise<fatura[]> {
        const configRequest:configRequest = {
            method: emethodHttp.GET,
            resource: "financeiros/faturas",
             headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }

        const response = await this.requestService.Requst(configRequest);

        return await response.json() as fatura[];
    }

    // GET cliente/contrato — devolve os dados/link do PDF do contrato assinado.
    async ObterContrato(token: string) : Promise<any> {
        const configRequest:configRequest = {
            method: emethodHttp.GET,
            resource: "cliente/contrato",
             headers: {
                'accept': 'application/pdf',
                'Authorization': `Bearer ${token}`
            }
        }

        const response = await this.requestService.Requst(configRequest);
        console.log("RESPONSE ", response)
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/pdf")) {
            const buffer = Buffer.from(await response.arrayBuffer());
            return { buffer, contentType: "application/pdf" };
        }

        return await response.json();
    }

    // POST cliente/notificar-pagamento — "Desbloqueio de confiança": cliente avisa que
    // já pagou pra liberar o acesso antes da baixa automática confirmar.
    async NotificarPagamento(token: string) : Promise<{ success:boolean; date:string }> {
        const configRequest:configRequest = {
            method: emethodHttp.GET,
            resource: "cliente/notificar-pagamento",
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }

        const response = await this.requestService.Requst(configRequest);
        return await response.json();
    }

    async AbrirChamado(token:string, motivo:string) : Promise<boolean> {

        const configRequest:configRequest = {
            method: emethodHttp.POST,
            resource: "chamados",
             headers: {
                'accept': 'application/json',
                'Content-Type':'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: {
                descricao: motivo
            }
        }

        const response = await this.requestService.Requst(configRequest);

        return response.json();
    }
    
    async ObterChamados(token:string) : Promise<responseChamados> {

        const configRequest:configRequest = {
            method: emethodHttp.GET,
            resource: "chamados",
             headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }

        const response = await this.requestService.Requst(configRequest);
        const chamados = await response.json() as responseChamados;
        return chamados;
    }

    async EnviarRespostaChamado(token: string, idChamado: number, mensagem: string): Promise<boolean> {
        const configRequest:configRequest = {
            method: emethodHttp.POST,
            resource: `chamados/respostas/${idChamado}`,
             headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: { resposta: mensagem }
        }
        const response = await this.requestService.Requst(configRequest);
        return await response.json();
    }

    async RespostasDoChamado(token: string, idChamado: number) : Promise<any> {
         const configRequest:configRequest = {
            method: emethodHttp.GET,
            resource: `chamados/respostas/${idChamado}`,
             headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }
        const response = await this.requestService.Requst(configRequest);
        return await response.json();
    }


}