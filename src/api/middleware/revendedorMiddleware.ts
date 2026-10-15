import { Response, NextFunction } from "express";
import { AuthRequest } from "./IAuthRequest";

// Roda depois do authMiddleware. Só o token gerado por RevendedorServices.Login carrega role "revendedor".
export function revendedorMiddleware(req: AuthRequest, res: Response, next: NextFunction){

    if (req.usuario?.role !== "revendedor")
        return res.status(403).json({ message: "Acesso restrito ao revendedor." });

    next();
}
