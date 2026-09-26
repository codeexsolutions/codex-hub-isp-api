import Provedor from "../../../../core/domains/Provedor";

export default interface IApiIxcSoftService {
    Token(provedor:Provedor): string;
    ObterClientePorCpfCnpj(cpfcnpj:string, codigoProvedor:string):Promise<any>
    ObterCidade(id:number,codigoProvedor:string):Promise<any>
    ObterUf(id:number,codigoProvedor:string):Promise<any>
    ObterContratoPorIdCliente(id:number, codigoProvedor:string) : Promise<any>
    ObterContratoPorId(id: number, codigoProvedor:string): Promise<any>
    ObterProdutoContrato(id:number, codigoProvedor:string) : Promise<any>
    ObterFaturas(idContrato:number, codigoProvedor:string) : Promise<any>
    ObterPix(idAreceber:number, codigoProvedor:string) : Promise<any>
    ObterConsumo(idUsuario:number, codigoProvedor:string) : Promise<any> 
    ObterLogin(codigoProvedor:string, contrato:string) : Promise<any>
    ObterOS(idCliente:number, codigoProvedor:string) : Promise<any>
    CriarOS(dados:{ idCliente:number; idAssunto:number; idFilial:number; setor:number; mensagem:string }, codigoProvedor:string) : Promise<any>
    ObterMensagensOS(idChamado:number, codigoProvedor:string) : Promise<any>
    CriarMensagemOS(dados:{ idChamado:number; idEvento:number; mensagem:string }, codigoProvedor:string) : Promise<any>
    ImprimirContrato(idContrato:number, resource:string, codigoProvedor:string) : Promise<string>
    ContarClientesAtivos(codigoProvedor:string) : Promise<number>
    // Edita cadastro (tabela cliente) — PUT /webservice/v1/cliente/{id} com o
    // registro inteiro (confirmado na doc oficial do IXC); ainda não testado
    // contra uma instalação real — validar com um campo não-crítico antes de
    // liberar pro cliente final.
    AtualizarCliente(idCliente:number, dados:{ email?:string; telefone?:string; celular?:string }, codigoProvedor:string) : Promise<any>
    // Reboot ONU — confirmado na doc oficial (docs.doc-api-provedor.com):
    // POST num endpoint "botão" específico da instalação (resource, configurado
    // por provedor — ver provedor_ixc_contrato_config.resource_reboot_onu) com
    // body { id: <radpop_radio_cliente_fibra.id> }.
    ObterFibraPorContrato(idContrato:number, codigoProvedor:string) : Promise<any>
    ReiniciarOnu(idClienteFibra:number, resource:string, codigoProvedor:string) : Promise<any>
    // 2ª via de boleto (base64) — fallback pra quando o boleto não tem
    // gateway_link preenchido. Confirmado na doc oficial (fluxo "Boletos por
    // CPF" > get_boleto), mas sem exemplo de resposta documentado — por isso
    // o retorno é tratado como texto puro (base64 cru), igual ImprimirContrato.
    ObterBoletoArquivo(idBoleto:number, codigoProvedor:string) : Promise<string>
    // Senha/SSID do WiFi ficam direto no cadastro de Login (radusuarios), não
    // num botão separado — confirmado na doc oficial (campos ssid_router_wifi,
    // senha_rede_sem_fio, ssid_router_wifi_5ghz, senha_rede_sem_fio_5ghz).
    // OBS: só funciona se o provedor não usa ACS vinculado ao login (nesse caso
    // o próprio IXC move esses campos pra dentro do dispositivo ACS).
    AtualizarLogin(idLogin:number, dados:{ ssidWifi?:string; senhaWifi?:string; ssidWifi5ghz?:string; senhaWifi5ghz?:string }, codigoProvedor:string) : Promise<any>
}