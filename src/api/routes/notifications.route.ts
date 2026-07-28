import { Router } from "express";
import { container } from "tsyringe";
import NotificationsController from "../controllers/Notifications.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const notificationRoute = Router();
const controller = container.resolve(NotificationsController);

notificationRoute.post('/salvar', authMiddleware, controller.Salvar.bind(controller));
notificationRoute.get('/public-key', controller.ObterPublicKey.bind(controller));
notificationRoute.post('/notificar', authMiddleware, controller.EnviarNotificacao.bind(controller));
notificationRoute.get('/buscarTodos', authMiddleware, controller.OberTodos.bind(controller));
notificationRoute.get('/buscarPorCpf', authMiddleware, controller.EnviarNotificacao.bind(controller));

export default notificationRoute;