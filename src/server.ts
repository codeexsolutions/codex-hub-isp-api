import "reflect-metadata";
import "dotenv/config";

import "./api/container/container";

import { container } from "tsyringe";
import routes from "./api/routes";
import app from "./app";
import IPainelServices from "./application/interfaces/IPainelService";

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