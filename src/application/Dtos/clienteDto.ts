export type clienteDto = {
    dadosCadastrais:dadosCadastrais;
    endereco:enderecoDto;
    plano?:planoDto[];
    servidor?:servidorDto;
    consumos?:consumosDto;
    ultimasFaturas?:faturaDto[];
    isBloqueado?: boolean;
    data_bloqueio?: Date;
    idContrato?: number;
}

export type dadosCadastrais = {
    nome:string,
    cpfCnpj:string,
    email:string,
    dataNascimento:string,
    inscricao:string|null
}

export type enderecoDto = {
    logradouro:string,
    complemento:string,
    bairro:string,
    cidade:string,
    uf:string,
    cep:string|null
}

export type planoDto = {
    id:number,
    descricao:string,
    valor:number,
    quantidade:number,
    total:number
}

type servidorDto = {
    isManutencao:boolean,
    manutencaoMensagem:string
}
export type consumosDto = {
    consumoMensalLabels:string[],
    consumoMensalDown:number[],
    consumoMensalUp:number[]
}
export type faturaDto = {
    id:number,
    valor:number,
    valorPago:number,
    dataVencimento:string | null,
    dataPagamento:string | null,
    linkFatura:string,
    linkFaturaPdf:string,
    linkRecibo:string,
    qrCode:string | null,
    qrCodeImg:string | null,
    linhaDigitavel:string
}
