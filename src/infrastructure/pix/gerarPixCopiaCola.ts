// Gera o "PIX copia e cola" (BR Code / EMV) estático do Banco Central — sem gateway,
// sem chamada de rede, sem confirmação automática. O provedor cola esse texto no app
// do banco dele; a confirmação de pagamento continua manual (admin marca como pago).

function tlv(id: string, value: string): string {
    const len = value.length.toString().padStart(2, "0");
    return `${id}${len}${value}`;
}

function crc16(payload: string): string {
    let crc = 0xFFFF;
    const polinomio = 0x1021;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ polinomio) : (crc << 1);
            crc &= 0xFFFF;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
}

export type pixParams = {
    chave:string;
    nomeRecebedor:string;
    cidade:string;
    valor:number;
    txid:string;
}

export function gerarPixCopiaCola(params:pixParams) : string {

    const nome = params.nomeRecebedor.substring(0, 25).toUpperCase();
    const cidade = params.cidade.substring(0, 15).toUpperCase();
    // txid só aceita alfanumérico no padrão BR Code
    const txid = params.txid.replace(/[^A-Za-z0-9]/g, "").substring(0, 25) || "***";
    const valorStr = params.valor.toFixed(2);

    const merchantAccountInfo = tlv("00", "br.gov.bcb.pix") + tlv("01", params.chave);
    const additionalData = tlv("05", txid);

    const payload =
        tlv("00", "01") +
        tlv("26", merchantAccountInfo) +
        tlv("52", "0000") +
        tlv("53", "986") +
        tlv("54", valorStr) +
        tlv("58", "BR") +
        tlv("59", nome) +
        tlv("60", cidade) +
        tlv("62", additionalData) +
        "6304";

    return payload + crc16(payload);
}
