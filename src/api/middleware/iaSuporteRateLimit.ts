import rateLimit from "express-rate-limit";

// Limita a rota pública de sugestão de IA (módulo "ia_suporte") — ela chama a
// API da Anthropic a cada requisição, então sem limite alguém poderia bater
// nela em loop e gerar custo real sem controle. 8 pedidos a cada 10 min por
// IP é generoso pra um cliente de verdade pedindo ajuda, mas barra abuso.
export const iaSuporteRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 8,
    standardHeaders: true,
    legacyHeaders: false,
    message: { statusCode: 429, message: "Muitas tentativas. Tente de novo em alguns minutos.", data: { sugestao: null } },
});
