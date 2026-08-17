import { container, inject, injectable } from "tsyringe";
import IApiIxcSoftService from "../../infrastructure/apis/ixcsoft/interfaces/IApiIxcSoftService";
import { clienteDto, consumosDto, faturaDto } from "../Dtos/clienteDto";
import IIxcSoftServices from "../interfaces/IIxcSoftServices";
import IProvedorRepository from "../../core/interfaces/IProvedorRepository";
import { boletos } from "../Dtos/boletosDto";
import { contrato, multiplos } from "../../infrastructure/apis/receitanet/responseModels/responseMultiContratos";

@injectable()
export default class IxcSoftServices implements IIxcSoftServices{

    private readonly _apiIxcSoft:IApiIxcSoftService;
    private readonly _provedroRepository:IProvedorRepository;
    constructor(@inject("IApiIxcSoftService")apiIxcSofit:IApiIxcSoftService, @inject("IProvedorRepository")provedorRepository:IProvedorRepository){
        this._apiIxcSoft = apiIxcSofit;
        this._provedroRepository = provedorRepository;
    }

    async ObterDadosCliente(cpf:string, codigoProvedor: string, idContrato:number): Promise<clienteDto | multiplos | null> {

        const responseCliente = await this._apiIxcSoft.ObterClientePorCpfCnpj(cpf, codigoProvedor);
        const cliente = await responseCliente.registros[0]

        const responseCidade = await this._apiIxcSoft.ObterCidade(cliente.cidade, codigoProvedor);
        const cidade = await responseCidade.registros[0];
        
        const responseUf = await this._apiIxcSoft.ObterUf(cliente.uf, codigoProvedor);
        const uf = await responseUf.registros[0]
        
        let responseContrato: any = null
        
        if(idContrato === undefined)
            responseContrato = await this._apiIxcSoft.ObterContratoPorIdCliente(cliente.id, codigoProvedor);
        else
            responseContrato = await this._apiIxcSoft.ObterContratoPorId(idContrato, codigoProvedor);        
        
        const contratos = await responseContrato.registros.filter((s:any) => s.status === 'A');

        if(contratos.length < 1)
            return null;

        if(contratos.length > 1){

            const multiplos:multiplos = {
                multiploCadastro:true,
                contratos: contratos.map((c:any) : contrato => {
                    return {
                       id: c.id,
                       nome: cliente.razao,
                       endereco: `${cliente.endereco} - ${cliente.numero}`,
                       bairro: cliente.bairro,
                       complemento: cliente.complemento,
                       cidade: cidade.nome,
                       uf: uf.sigla,
                       login: cpf
                       
                    }
                } )
            }

            return multiplos
        }

        const produto = await this._apiIxcSoft.ObterProdutoContrato(contratos[0].id_vd_contrato, codigoProvedor);
        const faturas = await this._apiIxcSoft.ObterFaturas(contratos[0].id, codigoProvedor);
        const loginUsuario = await this._apiIxcSoft.ObterLogin(codigoProvedor, contratos[0].id);
        const consumos = await this._apiIxcSoft.ObterConsumo(loginUsuario.registros[0].id, codigoProvedor);
        const agora = new Date();
        const consumoMes = consumos.registros.filter((c: any) => {
                const data = new Date(c.data);

                return (
                    data.getMonth() === agora.getMonth() &&
                    data.getFullYear() === agora.getFullYear()
                );
            });
       
        const download = (Number(consumoMes[0].consumo) / (1024 ** 3)).toFixed(1); 
        const upload = (Number(consumoMes[0].consumo_upload) / (1024 ** 3)).toFixed(1); 
        const clienteDto:clienteDto = {
            idContrato : contratos[0].id,
            dadosCadastrais :{
                nome: cliente.razao,
                cpfCnpj: cliente.cnpj_cpf,
                dataNascimento: cliente.data_nascimento,
                email: cliente.email,
                inscricao: cliente.ie_identidade,
        
            },
            endereco:{
                logradouro: `${cliente.endereco} - ${cliente.numero}`,
                complemento: cliente.complemento,
                bairro: cliente.bairro,
                cidade: cidade.nome,
                uf: uf.sigla,
                cep: cliente.cep                
            },
            plano: [{
                id: produto.id,
                descricao: produto.descricao,
                quantidade: produto.quantidade,
                valor: produto.valor.replace('R$', ''),
                total: produto.total,
            }],
            consumos: {
                consumoMensalLabels :  [`${new Date(consumoMes[0].data).getMonth()}/${new Date(consumoMes[0].data).getFullYear()}`],
                consumoMensalDown :  [Number.parseInt(download)],
                consumoMensalUp : [Number.parseInt(upload)]
            },
            ultimasFaturas: faturas.registros.map((fat:any) => {
                const fatura:faturaDto = {
                    id: fat.id,
                    dataPagamento: fat.pagamento_data === '' ? null : fat.pagamento_data,
                    dataVencimento: fat.data_vencimento,
                    linhaDigitavel: fat.linha_digitavel,
                    linkFatura: fat.gateway_link,
                    linkFaturaPdf: fat.gateway_link,
                    linkRecibo: "",
                    qrCode: null,
                    qrCodeImg: null,
                    valor: fat.valor,
                    valorPago: fat.valor_recebido,
                }
                return fatura;
            })
        }

        return clienteDto;
    }

    async ObterFaturas(idContrato:string, codigoProvedor:string) : Promise<boletos> {     

        const faturasResponse = await this._apiIxcSoft.ObterFaturas(Number.parseInt(idContrato), codigoProvedor);
        
        const faturas =  faturasResponse.registros.map((fat:any) => {
            const fatura:faturaDto = {
                id: fat.id,
                dataPagamento: fat.pagamento_data === '' ? null : fat.pagamento_data,
                dataVencimento: fat.data_vencimento,
                linhaDigitavel: fat.linha_digitavel,
                linkFatura: fat.gateway_link,
                linkFaturaPdf: fat.gateway_link,
                linkRecibo: "",
                qrCode: null,
                qrCodeImg: null,
                valor: Number.parseFloat(fat.valor),
                valorPago: Number.parseFloat(fat.valor_recebido),
            }
            return fatura;
        });

        const boletos:boletos = {
            boletos: faturas    
        };

        return boletos;    
    }

    async ObterContratos(cpf:string, codigoProvedor: string ) : Promise<string | multiplos> {
        
        const responseCliente = await this._apiIxcSoft.ObterClientePorCpfCnpj(cpf, codigoProvedor);
        const cliente = await responseCliente.registros[0]

        const responseContrato = await this._apiIxcSoft.ObterContratoPorId(cliente.id, codigoProvedor);
        const contratos = await responseContrato.registros.filter((s:any) => s.status === 'A');   
        
        if(contratos.length > 1){

            const multiplos:multiplos = {
                multiploCadastro: true,
                contratos: contratos
            }

            return multiplos
        }        

        return cpf;
        
    }
    
    async ObterToken(codigoProvedor: string): Promise<string> {
        const provedor = await this._provedroRepository.ObterProvedor(codigoProvedor);
        return this._apiIxcSoft.Token(provedor);
    }

}