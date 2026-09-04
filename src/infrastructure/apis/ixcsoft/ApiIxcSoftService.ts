
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

    // PIX pra uma fatura (fn_areceber) — sem header ixcsoft:listar, é uma ação/consulta
    // pontual, não uma listagem.
    async ObterPix(idAreceber:number, codigoProvedor:string) : Promise<any> {
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
        const service = new RequestService(urlBase);

        const configReques:configRequest = {
            method: emethodHttp.POST,
            resource: "get_pix",
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Basic ${this.Token(provedor)}`
            },
            body: {
                id_areceber: String(idAreceber)
            }
        }

        const response = await service.Requst(configReques);
        return response.json();
    }

    async ObterConsumo(idLogin: number, codigoProvedor: string): Promise<any> {
        
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
        const service = new RequestService(urlBase);
        
        const configReques:configRequest = {
            method: emethodHttp.POST,
            resource: "radusuarios_consumo_m",
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Basic ${this.Token(provedor)}`,
                'ixcsoft': 'listar'
            },
            body: {
                qtype: "radusuarios_consumo_m.id_login",
                query: idLogin,
                oper: operadores.IGUAL,
                page: 1,
                rp: 1000,
                sortname: "radusuarios_consumo_m.id_login",
                sortorder: ordenacao.MAIOR_MENOR
            }
        }

        const response = await service.Requst(configReques);

        return response.json();
    }

    async ObterLogin(codigoProvedor:string, contrato:string) : Promise<any> {
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
        const service = new RequestService(urlBase);

        const configReques:configRequest = {
            method: emethodHttp.POST,
            resource: 'radusuarios',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Basic ${this.Token(provedor)}`,
                'ixcsoft': 'listar'
            },
            body: {
                qtype: 'radusuarios.id_contrato',
                query: contrato,
                oper: operadores.IGUAL,
                page: 1,
                sortname: 'radusuarios.id',
                sortorder: ordenacao.MENOR_MAIOR
            }
        }
        
        const response = await service.Requst(configReques);
        return response.json();
    }

    // Ordem de serviço / chamado de suporte — mesmo padrão de listagem já usado
    // pra radusuarios (webservice/v1/{recurso}, header ixcsoft:listar).
    async ObterOS(idCliente:number, codigoProvedor:string) : Promise<any> {
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
        const service = new RequestService(urlBase);

        const configReques:configRequest = {
            method: emethodHttp.POST,
            resource: 'su_oss_chamado',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Basic ${this.Token(provedor)}`,
                'ixcsoft': 'listar'
            },
            body: {
                qtype: 'su_oss_chamado.id_cliente',
                query: idCliente,
                oper: operadores.IGUAL,
                page: 1,
                rp: 100,
                sortname: 'su_oss_chamado.id',
                sortorder: ordenacao.MENOR_MAIOR
            }
        }

        const response = await service.Requst(configReques);
        return response.json();
    }

    // Abre uma OS nova (POST simples, sem o header ixcsoft:listar — é o "insert" da API).
    // origem_endereco fixo em "M" (manual) pra não exigir endereço/cidade obrigatórios;
    // prioridade fixa em "N" (normal), que é o padrão neutro pra abertura pelo cliente.
    async CriarOS(dados:{ idCliente:number; idAssunto:number; idFilial:number; setor:number; mensagem:string }, codigoProvedor:string) : Promise<any> {
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
        const service = new RequestService(urlBase);

        const configReques:configRequest = {
            method: emethodHttp.POST,
            resource: 'su_oss_chamado',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Basic ${this.Token(provedor)}`
            },
            body: {
                tipo: 'C',
                id_assunto: dados.idAssunto,
                id_cliente: dados.idCliente,
                id_filial: dados.idFilial,
                origem_endereco: 'M',
                prioridade: 'N',
                setor: dados.setor,
                mensagem: dados.mensagem,
                status: 'A'
            }
        }

        const response = await service.Requst(configReques);
        const resultado = await response.json();
        // a API do IXC responde HTTP 200 mesmo quando rejeita o insert (type: "error" no corpo)
        if (resultado?.type === 'error')
            throw new Error(resultado.message ?? 'Erro ao abrir a Ordem de Serviço no IXC.');
        return resultado;
    }

    // Mensagens/andamento de uma OS — mesmo padrão listar do su_oss_chamado.
    async ObterMensagensOS(idChamado:number, codigoProvedor:string) : Promise<any> {
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
        const service = new RequestService(urlBase);

        const configReques:configRequest = {
            method: emethodHttp.POST,
            resource: 'su_oss_chamado_mensagem',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Basic ${this.Token(provedor)}`,
                'ixcsoft': 'listar'
            },
            body: {
                qtype: 'su_oss_chamado_mensagem.id_chamado',
                query: idChamado,
                oper: operadores.IGUAL,
                page: 1,
                rp: 200,
                sortname: 'su_oss_chamado_mensagem.id',
                sortorder: ordenacao.MENOR_MAIOR
            }
        }

        const response = await service.Requst(configReques);
        return response.json();
    }

    // Envia uma mensagem/resposta numa OS existente. tipo_cobranca e finaliza_processo
    // fixos pro caso simples de "cliente comentou" — não fecha nem cobra nada.
    async CriarMensagemOS(dados:{ idChamado:number; idEvento:number; mensagem:string }, codigoProvedor:string) : Promise<any> {
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
        const service = new RequestService(urlBase);

        const configReques:configRequest = {
            method: emethodHttp.POST,
            resource: 'su_oss_chamado_mensagem',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Basic ${this.Token(provedor)}`
            },
            body: {
                id_chamado: dados.idChamado,
                id_evento: dados.idEvento,
                mensagem: dados.mensagem,
                status: 'A',
                tipo_cobranca: 'NENHUM',
                finaliza_processo: 'N'
            }
        }

        const response = await service.Requst(configReques);
        const resultado = await response.json();
        // a API do IXC responde HTTP 200 mesmo quando rejeita o insert (type: "error" no corpo) —
        // ex.: id_evento inválido/incompatível faz a mensagem "sumir" silenciosamente sem isso.
        if (resultado?.type === 'error')
            throw new Error(resultado.message ?? 'Erro ao enviar a mensagem no IXC.');
        return resultado;
    }

    async NewRequestService(codigoProvedor:string) : Promise<RequestService> {
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
        const service = new RequestService(urlBase);
        return service;
    }

    // Endpoint de impressão de contrato — o "resource" é específico por instalação
    // IXC (ex.: cliente_contrato_imprimir_contrato_17678), por isso vem de config
    // do provedor em vez de fixo. Resposta de sucesso é o PDF em base64 cru (sem
    // wrapper JSON); em erro a IXC devolve JSON normal com type "error", mesmo com
    // HTTP 200 — por isso o corpo é sempre inspecionado antes de devolver.
    async ImprimirContrato(idContrato:number, resource:string, codigoProvedor:string) : Promise<string> {
        const provedor = await this._provedorRepository.ObterProvedor(codigoProvedor);
        const urlBase = `https://${provedor.DominioIxc}/webservice/v1/`;
        const service = new RequestService(urlBase);

        const configReques:configRequest = {
            method: emethodHttp.POST,
            resource,
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'Authorization': `Basic ${this.Token(provedor)}`
            },
            body: {
                id: String(idContrato)
            }
        }

        const response = await service.Requst(configReques);
        const texto = await response.text();

        try {
            const possivelErro = JSON.parse(texto);
            if (possivelErro?.type === 'error')
                throw new Error(possivelErro.message ?? 'Erro ao gerar o contrato no IXC.');
        } catch (e) {
            if (!(e instanceof SyntaxError))
                throw e;
        }

        return texto;
    }

    // Total da base de clientes ATIVOS do provedor no IXC — usado no card
    // "Clientes conectados" do dashboard. rp:1 porque só interessa o campo
    // "total" da resposta (contagem), não os registros em si — evita puxar
    // a base inteira só pra contar.
    async ContarClientesAtivos(codigoProvedor:string): Promise<number> {

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
            body: {
                qtype: "cliente.id",
                query: "1",
                oper: operadores.MAIOR_OU_IGUAL,
                page: "1",
                rp: "1",
                sortname: "cliente.id",
                sortorder: ordenacao.MENOR_MAIOR,
                grid_param: JSON.stringify([{
                    TB: "cliente.ativo",
                    OP: operadores.IGUAL,
                    P: "S"
                }])
            }
        }

        const response = await service.Requst(configRequest);
        const resultado:respose<any> = await response.json();
        return Number.parseInt(resultado.total ?? "0");
    }

    public Token(provedor:Provedor): string {
        return  Buffer.from(`${provedor.ObterCodigoApiGerenciador()}:${provedor.ObterChaveApiGerenciador()}`).toString("base64");
    } 

}