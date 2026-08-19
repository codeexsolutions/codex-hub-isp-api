import { Response, NextFunction } from "express";
import { AuthRequest } from "./IAuthRequest";

// Roda depois do authMiddleware (que já populou req.usuario a partir do JWT).
// Só o token gerado por TokenAcessoAdmin carrega role "admin".
export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction){

    if (req.usuario?.role !== "admin")
        return res.status(403).json({ message: "Acesso restrito ao administrador." });

    next();
}
