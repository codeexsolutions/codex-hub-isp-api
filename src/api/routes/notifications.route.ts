import { Router } from "express";
import { container } from "tsyringe";
import NotificationsController from "../controllers/Notifications.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const notificationRoute = Router();
const controller = container.resolve(NotificationsController);

notificationRoute.post('/salvar', controller.Salvar.bind(controller));
notificationRoute.get('/public-key', controller.ObterPublicKey.bind(controller));
notificationRoute.post('/notificar', authMiddleware, controller.EnviarNotificacao.bind(controller));
notificationRoute.get('/buscarTodos', authMiddleware, controller.OberTodos.bind(controller));
notificationRoute.get('/buscarPorCpf', authMiddleware, controller.EnviarNotificacao.bind(controller));

// CENTRAL DE NOTIFICAÇÕES DO CLIENTE (sino do app) — sem authMiddleware, mesmo
// padrão das demais rotas de cliente (identidade vem de cpf+codigoProvedor)
notificationRoute.post('/minhas', controller.ListarMinhasNotificacoes.bind(controller));
notificationRoute.post('/nao-lidas', controller.ContarNaoLidas.bind(controller));
notificationRoute.patch('/:id/lida', controller.MarcarLida.bind(controller));
notificationRoute.delete('/:id', controller.ExcluirNotificacao.bind(controller));

export default notificationRoute;