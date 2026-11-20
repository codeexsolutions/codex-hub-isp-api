import rateLimit from "express-rate-limit";

// Cadastro synk-tv é público e sem verificação de email/telefone — sem
// limite, a mesma pessoa criaria conta nova a cada 3h (ou em loop,
// script) só trocando de email, pra sempre ganhar teste de novo sem pagar.
// 3 cadastros por IP a cada 24h é generoso pra uma casa/família de
// verdade testando, mas barra abuso manual ou automatizado.
export const contaTvCadastroRateLimit = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    limit: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { statusCode: 429, message: "Muitos cadastros a partir desse endereço. Tente de novo mais tarde." },
});
