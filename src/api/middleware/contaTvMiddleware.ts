import { Response, NextFunction } from "express";
import { AuthRequest } from "./IAuthRequest";

// Roda depois do authMiddleware. Só o token gerado por ContaTvServices
// (Cadastrar/Login) carrega role "conta-tv".
export function contaTvMiddleware(req: AuthRequest, res: Response, next: NextFunction) {

    if (req.usuario?.role !== "conta-tv")
        return res.status(403).json({ message: "Acesso restrito à conta do cliente synk-tv." });

    next();
}
