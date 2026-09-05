import { inject, injectable } from "tsyringe";
import { Request, Response } from "express";
import IPainelServices from "../../application/interfaces/IPainelService";

@injectable()
export default class LicencaTvController {

    private readonly _painelService:IPainelServices;

    constructor(@inject("IPainelServices")painelService:IPainelServices){
        this._painelService = painelService;
    }

    // Público — usado pelo app de TV na venda avulsa (sem provedor). Gera uma
    // licença "pendente" com PIX pra pagar.
    async Solicitar(req:Request, res:Response){
        try {
            const { nome, telefone } = req.body;
            const resultado = await this._painelService.SolicitarLicencaTv(nome, telefone);
            return res.status(201).json({ data: resultado });
        } catch (error:any) {
            return res.status(400).json({ statusCode: 400, message: error.message, data: error.message });
        }
    }

    // Público — o app consulta periodicamente pra saber se o admin já
    // aprovou o pagamento, ou pra reativar a licença em outro aparelho.
    async ObterStatus(req:Request, res:Response){
        try {
            const resultado = await this._painelService.ObterStatusLicencaTv(req.params.chave as string);
            return res.json({ data: resultado });
        } catch (error:any) {
            return res.status(404).json({ statusCode: 404, message: error.message, data: error.message });
        }
    }

    // Página pública de pagamento (HTML simples, sem framework) — o app NUNCA
    // mostra QR code/PIX dentro dele mesmo (violaria a política de pagamento
    // das lojas de app pra desbloquear conteúdo); em vez disso abre essa
    // página no navegador do aparelho via Linking.openURL, fora do app.
    async PaginaPagamento(req:Request, res:Response){
        const chave = (req.params.chave as string)?.trim() ?? "";
        try {
            const licenca = await this._painelService.ObterStatusLicencaTv(chave);
            return res.type("html").send(this.renderPaginaPagamento(licenca));
        } catch (error:any) {
            return res.status(404).type("html").send(this.renderPaginaErro(error.message || "Licença não encontrada."));
        }
    }

    private formatarData(data: string | null): string {
        if (!data) return "-";
        const [ano, mes, dia] = data.split("-");
        return `${dia}/${mes}/${ano}`;
    }

    private rotuloStatus(status: string): string {
        const rotulos: Record<string, string> = {
            pendente: "Aguardando primeiro pagamento",
            teste: "Em teste grátis",
            ativa: "Ativa",
            vencida: "Vencida",
            cancelada: "Cancelada",
        };
        return rotulos[status] ?? status;
    }

    private estiloBase(): string {
        return `
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
                body { background:#05070B; color:#fff; font-family:-apple-system,Segoe UI,Roboto,sans-serif; margin:0; padding:32px 20px; display:flex; justify-content:center; }
                .card { width:100%; max-width:380px; text-align:center; }
                .logo { font-weight:800; font-size:20px; margin-bottom:24px; }
                .logo span { color:#2563EB; }
                h1 { font-size:18px; margin:0 0 4px; }
                p { color:#9AA4B2; font-size:13.5px; line-height:1.5; margin:0 0 20px; }
                .box { background:#0B0F17; border:1px solid #1C2431; border-radius:16px; padding:20px; margin-bottom:16px; }
                .linha { display:flex; justify-content:space-between; font-size:13px; padding:8px 0; border-bottom:1px solid #1C2431; }
                .linha:last-child { border-bottom:none; }
                .linha span:first-child { color:#9AA4B2; }
                .linha span:last-child { font-weight:700; }
                img.qr { width:220px; height:220px; border-radius:12px; background:#fff; padding:10px; margin:12px 0; }
                textarea { width:100%; box-sizing:border-box; background:#05070B; color:#fff; border:1px solid #1C2431; border-radius:10px; padding:12px; font-size:12px; resize:none; height:70px; }
                button { width:100%; background:#2563EB; color:#fff; border:none; border-radius:12px; padding:14px; font-size:14px; font-weight:700; margin-top:10px; cursor:pointer; }
                .aviso { font-size:12px; color:#5B6472; margin-top:20px; }
            </style>
        `;
    }

    private renderPaginaPagamento(licenca: any): string {
        const semPix = !licenca.pixCopiaCola;
        return `<!DOCTYPE html>
<html lang="pt-BR"><head><title>Pagamento — Synk TV</title>${this.estiloBase()}</head>
<body>
    <div class="card">
        <div class="logo">Synk<span>TV</span></div>
        <h1>Renovação da licença</h1>
        <p>Pague com Pix e a liberação acontece assim que o pagamento for confirmado.</p>

        <div class="box">
            <div class="linha"><span>Chave</span><span>${licenca.chave}</span></div>
            <div class="linha"><span>Status</span><span>${this.rotuloStatus(licenca.status)}</span></div>
            <div class="linha"><span>Vencimento</span><span>${this.formatarData(licenca.vencimento)}</span></div>
            <div class="linha"><span>Valor</span><span>R$ ${Number(licenca.valor).toFixed(2).replace(".", ",")}</span></div>
        </div>

        ${semPix ? `<p>Pagamento por Pix ainda não configurado. Fale com o suporte.</p>` : `
        <div class="box">
            <img class="qr" src="${licenca.pixQrCode}" alt="QR Code Pix" />
            <textarea readonly id="pix">${licenca.pixCopiaCola}</textarea>
            <button onclick="copiar()">Copiar código Pix</button>
        </div>
        `}

        <div class="aviso">Depois de pagar, volte pro app — a liberação é automática.</div>
    </div>

    <script>
        function copiar() {
            var el = document.getElementById('pix');
            el.select();
            el.setSelectionRange(0, 999999);
            navigator.clipboard && navigator.clipboard.writeText(el.value);
            var btn = document.querySelector('button');
            btn.textContent = 'Copiado!';
            setTimeout(function () { btn.textContent = 'Copiar código Pix'; }, 2000);
        }
    </script>
</body></html>`;
    }

    private renderPaginaErro(mensagem: string): string {
        return `<!DOCTYPE html>
<html lang="pt-BR"><head><title>Pagamento — Synk TV</title>${this.estiloBase()}</head>
<body>
    <div class="card">
        <div class="logo">Synk<span>TV</span></div>
        <h1>Não encontramos essa licença</h1>
        <p>${mensagem}</p>
    </div>
</body></html>`;
    }
}
