import crypto from "crypto";

// Chave única da licença do Synk TV (app avulso) — usada tanto quando o
// admin Synk cria direto quanto quando um revendedor cria pro próprio
// cliente (mesma tabela licencas_tv, mesmo formato de chave).
export function gerarChaveLicenca(): string {
    const bloco = () => crypto.randomBytes(3).toString("hex").toUpperCase();
    return `SYNK-${bloco()}-${bloco()}`;
}
