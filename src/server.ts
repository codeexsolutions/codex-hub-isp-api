import "reflect-metadata";
import "dotenv/config";

import "./api/container/container";

import { container } from "tsyringe";
import routes from "./api/routes";
import app from "./app";
import IPainelServices from "./application/interfaces/IPainelService";
import INotificacaoFaturaServices from "./application/interfaces/INotificacaoFaturaServices";

app.get('/hub-api-isp', (req, res) => res.json({"message":"Check"}))
app.use('/v1', routes)


const PORT = process.env.PORT || 3010;

app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});

// Varredura periódica de faturamento: gera a fatura do mês pra quem ainda não tem e
// inativa provedor com 7+ dias de atraso — roda de tempos em tempos pra não depender
// de alguém abrir a tela de faturamento naquele dia.
setInterval(() => {
    const painelServices = container.resolve<IPainelServices>("IPainelServices");
    painelServices.VerificarInadimplenciaTodos().catch((error) => {
        console.error("Erro na varredura de inadimplência:", error);
    });
}, 6 * 60 * 60 * 1000);

// Varredura periódica de faturas do cliente (ISP): notifica por push quando a fatura
// está a 3 dias do vencimento, no dia do vencimento e 1 dia após vencer — roda de
// tempos em tempos, sem depender do cliente abrir o app naquele dia.
setInterval(() => {
    const notificacaoFaturaServices = container.resolve<INotificacaoFaturaServices>("INotificacaoFaturaServices");
    notificacaoFaturaServices.VerificarFaturasTodos().catch((error) => {
        console.error("Erro na varredura de notificação de faturas:", error);
    });
}, 6 * 60 * 60 * 1000);