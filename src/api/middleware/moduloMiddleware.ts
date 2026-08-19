import { Response, NextFunction } from "express";
import { container } from "tsyringe";
import { AuthRequest } from "./IAuthRequest";
import IPainelRepository from "../../core/interfaces/IPainelRepository";

// Roda depois do authMiddleware. Bloqueia rotas de um módulo (ex.: "beneficios")
// para provedores que não o compraram/ativaram — ativação é feita pela tela de admin.
export function moduloMiddleware(modulo: string) {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {

        const codigoProvedor = Number.parseInt(req.usuario?.codigoProvedor as string);
        const painelRepository = container.resolve<IPainelRepository>("IPainelRepository");

        const possui = await painelRepository.PossuiModulo(codigoProvedor, modulo);

        if (!possui)
            return res.status(403).json({ message: `Módulo "${modulo}" não está ativo para este provedor.` });

        next();
    };
}
