import { Router } from "express";
import { container } from "tsyringe";
import { authMiddleware } from "../middleware/authMiddleware";
import { parceiroMiddleware } from "../middleware/parceiroMiddleware";
import ParceiroController from "../controllers/Parceiro.controller";

const parceiroRoute = Router();
const parceiroController = container.resolve(ParceiroController);

parceiroRoute.post('/login', parceiroController.Login.bind(parceiroController));
parceiroRoute.get('/financeiro', authMiddleware, parceiroMiddleware, parceiroController.ObterFinanceiro.bind(parceiroController));
parceiroRoute.get('/cupom/:codigo', authMiddleware, parceiroMiddleware, parceiroController.ObterCupom.bind(parceiroController));
parceiroRoute.patch('/cupom/:codigo/validar', authMiddleware, parceiroMiddleware, parceiroController.ValidarCupom.bind(parceiroController));
parceiroRoute.patch('/cupom/:codigo/cancelar', authMiddleware, parceiroMiddleware, parceiroController.CancelarCupom.bind(parceiroController));

export default parceiroRoute;
