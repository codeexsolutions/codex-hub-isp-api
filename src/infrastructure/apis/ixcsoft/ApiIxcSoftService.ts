
import { inject, injectable } from "tsyringe";
import IProvedorRepository from "../../../core/interfaces/IProvedorRepository";
import { configRequest } from "../configRequest";
import RequestService from "../requesService";
import Provedor from "../../../core/domains/Provedor";
import { emethodHttp } from "../../../common/enuns/emethodhttp";
import { PadronizarCpf } from "../../../common/utilities/utils";
import IApiIxcSoftService from "./interfaces/IApiIxcSoftService";
import {  operadores, ordenacao } from "./queryType";
import { respose } from "./response";
import { planoDto } from "../../../application/Dtos/clienteDto";

@injectable()
export default class ApiIxcSoftService implements IApiIxcSoftService {

    private _provedorRepository:IProvedorRepository;
   
    constructor(@inject("IProvedorRepository") provedorRepository:IProvedorRepository){
        this._provedorRepository = provedorRepository;        
    }    
    
    async ObterClientePorCpfCnpj(cpfcnpj: string, codigoProvedor:string): Promise<any> {
        
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
        const service = new RequestService(urlBase);

        const configRequest:configRequest = {
            method: emethodHttp.POST,
            resource: "cliente",
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Basic ${this.Token(provedor)}`,
                'ixcsoft': 'listar'
            },
            body: 
            { grid_param: JSON.stringify([{
                TB: "cliente.cnpj_cpf",
                OP: operadores.IGUAL,
                P: PadronizarCpf(cpfcnpj)
            }])}           
          
        }

        const response = await service.Requst(configRequest)
        return await response.json();
    }

    async ObterCidade(id: number, codigoProvedor:string): Promise<any> {
        
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
        const service = new RequestService(urlBase);

        const configRequest:configRequest = {
            method: emethodHttp.POST,
            resource: "cidade",
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Basic ${this.Token(provedor)}`,
                'ixcsoft': 'listar'
            },
            body: {
                 grid_param: JSON.stringify([{
                TB: "cidade.id",
                OP: operadores.IGUAL,
                P: id
            }])}
            
        }

        const response = await service.Requst(configRequest)
        return response.json();
    }

    async ObterUf(id: number, codigoProvedor:string): Promise<any> {
        
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
        const service = new RequestService(urlBase);

        const configRequest:configRequest = {
            method: emethodHttp.POST,
            resource: "uf",
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Basic ${this.Token(provedor)}`,
                'ixcsoft': 'listar'
            },
            body: {
                 grid_param: JSON.stringify([{
                TB: "uf.id",
                OP: operadores.IGUAL,
                P: id
            }])}
            
        }

        const response = await service.Requst(configRequest)
        return response.json();
    }

    async ObterContratoPorIdCliente(id: number, codigoProvedor:string): Promise<any> {
        
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
        const service = new RequestService(urlBase);

        const configRequest:configRequest = {
            method: emethodHttp.POST,
            resource: "cliente_contrato",
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Basic ${this.Token(provedor)}`,
                'ixcsoft': 'listar'
            },
            body: 
            { grid_param: JSON.stringify([{
                TB: "cliente_contrato.id_cliente",
                OP: operadores.IGUAL,
                P: id
            }])}
            
           /*  {

                qtype: "cliente.cnpj_cpf",
                query: PadronizarCpf(cpfcnpj),
                oper: "=",
                page: 1,
                rp: 10,
            } */
        }

        const response = await service.Requst(configRequest)
        return await response.json();
    }
    async ObterContratoPorId(id: number, codigoProvedor:string): Promise<any> {
        
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
        const service = new RequestService(urlBase);

        const configRequest:configRequest = {
            method: emethodHttp.POST,
            resource: "cliente_contrato",
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Basic ${this.Token(provedor)}`,
                'ixcsoft': 'listar'
            },
            body: 
            { grid_param: JSON.stringify([{
                TB: "cliente_contrato.id",
                OP: operadores.IGUAL,
                P: id
            }])}
            
           /*  {

                qtype: "cliente.cnpj_cpf",
                query: PadronizarCpf(cpfcnpj),
                oper: "=",
                page: 1,
                rp: 10,
            } */
        }

        const response = await service.Requst(configRequest)
        return await response.json();
    }

    async ObterProdutoContrato(id: number, codigoProvedor: string): Promise<any> {
        
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
        const service = new RequestService(urlBase);
        
        const configRequestVdProduto:configRequest = {
            method: emethodHttp.POST,
            resource: "vd_contratos",
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Basic ${this.Token(provedor)}`,
                'ixcsoft': 'listar'
            },
            body: 
            { grid_param: JSON.stringify([{
                TB: "vd_contratos.id",
                OP: operadores.IGUAL,
                P: id
            }])}
        }

        const responseVdProduto = await service.Requst(configRequestVdProduto)
        const vdProduto = await responseVdProduto.json()
        
        const configRequestProduto:configRequest = {
            method: emethodHttp.POST,
            resource: "produtos",
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Basic ${this.Token(provedor)}`,
                'ixcsoft': 'listar'
            },
            body: 
            { grid_param: JSON.stringify([{
                TB: "produtos.id",
                OP: operadores.IGUAL,
                P: vdProduto.registros[0].id
            }])}
        }

        const responseProduto = await service.Requst(configRequestProduto)
        const produto = await responseProduto.json();

        const plano:planoDto = {
            id: produto.registros[0].id,
            descricao: vdProduto.registros[0].nome,
            quantidade: parseInt(vdProduto.total),
            valor : vdProduto.registros.map((produto: any) => `R$ ${parseFloat(produto.valor_contrato)}`).join(" | "),
            total:  vdProduto.registros.reduce((acc:number, produto:any) => acc + parseFloat(produto.valor_contrato), 0),
        }

        return plano;
    }

    async ObterFaturas(idContrato:number, codigoProvedor:string) : Promise<any> {
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
        const service = new RequestService(urlBase);

        const configReques:configRequest = {
            method: emethodHttp.POST,
            resource: "fn_areceber",
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Basic ${this.Token(provedor)}`,
                'ixcsoft': 'listar'
            },
            body: {
                qtype: "fn_areceber.id_contrato",
                query: idContrato,
                oper: operadores.IGUAL,
                page: 1,
                rp: 200000000,
                sortname: "fn_areceber.data_vencimento",
                sortorder: ordenacao.MAIOR_MENOR,
                grid_param: JSON.stringify([
                        {
                            TB: "fn_areceber.liberado",
                            OP: operadores.IGUAL,
                            P: "S"
                        },
                        {
                            TB: "fn_areceber.status",
                            OP: operadores.DIFERENTE,
                            P: "C"
                        },
                        {
                            TB: "fn_areceber.status",
                            OP: operadores.DIFERENTE,
                            P: "R"
                        }
                    ])
            }
        }

        const response = await service.Requst(configReques);

        return response.json();
    }

    public Token(provedor:Provedor): string {
        return  Buffer.from(`${provedor.ObterCodigoApiGerenciador()}:${provedor.ObterChaveApiGerenciador()}`).toString("base64");
    } 

}