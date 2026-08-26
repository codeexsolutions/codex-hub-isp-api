import { Request, Response, NextFunction } from "express";
import multer from "multer";

// Sem isso, erros que estouram fora do try/catch dos controllers (ex: multer no
// upload de ícone/logo) caem no handler default do Express — que responde com uma
// página HTML e status 500, sem motivo nenhum pro front conseguir mostrar ao usuário.
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {

    if (err instanceof multer.MulterError) {

        const campo = err.field ? ` (campo "${err.field}")` : "";
        const mensagens: Record<string, string> = {
            LIMIT_FILE_SIZE: `Arquivo muito grande${campo}. O tamanho máximo permitido é 1MB.`,
            LIMIT_UNEXPECTED_FILE: `Campo de arquivo inesperado${campo}.`,
        };

        return res.status(400).json({
            statusCode: 400,
            message: mensagens[err.code] || `Erro no envio do arquivo${campo}: ${err.message}`,
        });
    }

    // fileFilter (ex: "Somente imagens são permitidas.") joga um Error comum, não MulterError.
    if (err instanceof Error && req.is("multipart/form-data")) {
        return res.status(400).json({
            statusCode: 400,
            message: err.message || "Não foi possível processar o arquivo enviado.",
        });
    }

    console.error("Erro não tratado:", err);

    return res.status(500).json({
        statusCode: 500,
        message: err?.message || "Erro interno no servidor.",
    });
}
