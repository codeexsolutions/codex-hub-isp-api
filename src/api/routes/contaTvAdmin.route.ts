import { Router } from "express";
import { container } from "tsyringe";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import ContaTvController from "../controllers/ContaTv.controller";

const contaTvAdminRoute = Router();
const contaTvController = container.resolve(ContaTvController);

contaTvAdminRoute.get('/', authMiddleware, adminMiddleware, contaTvController.Listar.bind(contaTvController));
contaTvAdminRoute.patch('/:id/status', authMiddleware, adminMiddleware, contaTvController.DefinirStatusPagamento.bind(contaTvController));
contaTvAdminRoute.patch('/:id/iptv', authMiddleware, adminMiddleware, contaTvController.DefinirIptv.bind(contaTvController));
contaTvAdminRoute.get('/nao-lidos/contar', authMiddleware, adminMiddleware, contaTvController.ContarNaoNotificadas.bind(contaTvController));
contaTvAdminRoute.patch('/:id/marcar-lido', authMiddleware, adminMiddleware, contaTvController.MarcarNotificada.bind(contaTvController));

export default contaTvAdminRoute;
