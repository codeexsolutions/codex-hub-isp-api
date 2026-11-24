import { injectable } from "tsyringe";

export type RespostaTesteIptv = {
    usuario: string;
    senha: string;
    dns: string;
    pacote: string;
    vencimento: Date;
    linkPagamento: string;
};

// Chama o link do chatbot (DEYLER+ ou outro cadastrado em links_teste_iptv)
// que gera um teste IPTV novo a cada chamada. É sempre POST (apesar do nome
// "GET" usado informalmente) — confirmado por tentativa real: GET dá 405,
// só o Allow: POST funciona. Sem corpo nem autenticação — os dois tokens já
// vêm embutidos na própria URL.
@injectable()
export default class DeylerTrialService {

    async GerarTeste(url: string): Promise<RespostaTesteIptv> {

        const response = await fetch(url, { method: "POST" });

        if (!response.ok)
            throw new Error(`Falha ao gerar teste IPTV (HTTP ${response.status}).`);

        const json: any = await response.json();

        if (!json?.username || !json?.password || !json?.dns)
            throw new Error("Resposta inesperada do link de teste — faltam usuário/senha/dns.");

        const DURACAO_PADRAO_MS = 3 * 60 * 60 * 1000;
        const MARGEM_MINIMA_MS = 5 * 60 * 1000;

        // Já aconteceu de o bot devolver expiresAt praticamente igual ao
        // instante da chamada (teste "nascendo vencido") — provavelmente uma
        // falha pontual do lado do provedor. Nesses casos ignora o valor dele
        // e usa a duração padrão, em vez de entregar um teste já expirado.
        const vencimentoProvedor = json.expiresAt ? new Date(json.expiresAt) : null;
        const vencimento = vencimentoProvedor && vencimentoProvedor.getTime() - Date.now() >= MARGEM_MINIMA_MS
            ? vencimentoProvedor
            : new Date(Date.now() + DURACAO_PADRAO_MS);

        return {
            usuario: json.username,
            senha: json.password,
            dns: json.dns,
            pacote: json.package ?? "",
            vencimento,
            linkPagamento: json.payUrl ?? "",
        };
    }
}
