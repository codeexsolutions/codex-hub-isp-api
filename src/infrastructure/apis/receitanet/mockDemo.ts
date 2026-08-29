// Ambiente de demonstração (ver SQL 2026_08_provedor_demo.sql) — provedor
// "Synk Net" (codigo_provedor 999) não tem backend ReceitaNet/IXC real por
// trás. ApiReceitanetServices intercepta esse codigo_provedor/token e
// devolve estes dados fabricados em vez de chamar a API de verdade, então
// tudo daqui pra cima (mapper, controller, app) funciona sem saber a
// diferença — é a mesma forma/contrato de resposta que o ReceitaNet real
// devolveria.
import { responseClienteResumo } from "./responseModels/responseClienteResumo";
import { responseChamados } from "./responseModels/responseChamados";
import { responseToken } from "./responseModels/responseToken";

export const DEMO_CODIGO_PROVEDOR = "999";
export const DEMO_TOKEN = "SYNKDEMO-TOKEN";
export const DEMO_CPF = "604.937.501-18";

export const demoTokenResponse: responseToken = {
    access_token: DEMO_TOKEN,
    name: "MARIA EDUARDA SANTOS",
    isContrassenha: false,
};

const hoje = new Date();
const dataISO = (diasOffset: number) => {
    const d = new Date(hoje);
    d.setDate(d.getDate() + diasOffset);
    return d.toISOString().slice(0, 10);
};

export const demoResumoCliente: responseClienteResumo = {
    ultimasFaturas: [
        {
            id: 900001,
            valor: 99.90,
            valor_pago: 0,
            data_vencimento: dataISO(6),
            data_pagamento: null,
            link_fatura: "https://synkisp.com.br",
            link_fatura_pdf: "https://synkisp.com.br",
            link_recibo: "https://synkisp.com.br",
            qrcode: null,
            qrcode_img: null,
            linha_digitavel: "00000.00000 00000.000000 00000.000000 0 00000000009990",
        },
        { id: 900000, valor: 99.90, valor_pago: 99.90, data_vencimento: dataISO(-24), data_pagamento: dataISO(-25) },
        { id: 899999, valor: 99.90, valor_pago: 99.90, data_vencimento: dataISO(-54), data_pagamento: dataISO(-55) },
    ] as any,
    isFaturaVencida: false,
    isPromessaLiberado: true,
    consumoMensalLabels: ["Mai", "Jun", "Jul", "Ago"],
    consumoMensalDown: [142.5, 168.3, 155.8, 171.2],
    consumoMensalUp: [12.4, 14.1, 13.7, 15.0],
    mensalidades: [
        { id: 1, descricao: "PLANO 500 MEGA + WI-FI 6 (demonstração)", valor: 99.90, quantidade: 1, total: 99.90 },
    ],
    contrato: "https://synkisp.com.br",
    servidor: [{ isManutencao: "false", manutencaoMensagem: "" }],
    dados_cadastrais: {
        nome: "MARIA EDUARDA SANTOS",
        cpfcnpj: DEMO_CPF,
        inscricao: "0000000000000",
        email: "demo@synkisp.com.br",
        data_nascimento: "15/03/1994",
        endereco: "RUA DAS DEMONSTRAÇÕES, 123",
        complemento: "APTO 101",
        bairro: "CENTRO",
        cidade: "FORTALEZA",
        uf: "CE",
        isBloqueado: false,
        data_bloqueio: null as any,
    },
    isBloqueado: false,
    data_bloqueio: null as any,
};

// Runtime real do ReceitaNet devolve o JSON cru { boletos: [...] } pra esse
// endpoint (ver ReceitanetServices.ObterFaturas, que lê response.boletos) —
// por isso a forma aqui é diferente de responseClienteResumo.ultimasFaturas.
export const demoFaturasRaw = {
    boletos: demoResumoCliente.ultimasFaturas,
};

export const demoChamados: responseChamados = {
    chamados: [
        { id: 1, is_aberto: false, descricao: "Lentidão à noite (exemplo)", protocolo: "DEMO0001", respostas_status: 1 },
    ],
    is_criar_novo: true,
};

export const demoNotificarPagamento = () => ({ success: true, date: new Date().toISOString() });
