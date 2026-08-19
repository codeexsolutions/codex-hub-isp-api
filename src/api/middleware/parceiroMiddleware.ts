import { Response, NextFunction } from "express";
import { AuthRequest } from "./IAuthRequest";

// Roda depois do authMiddleware. Só o token gerado por ParceiroServices.Login carrega role "parceiro".
export function parceiroMiddleware(req: AuthRequest, res: Response, next: NextFunction){

    if (req.usuario?.role !== "parceiro")
        return res.status(403).json({ message: "Acesso restrito ao parceiro." });

    next();
}
