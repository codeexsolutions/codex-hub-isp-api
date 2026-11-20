import { Router } from "express";
import { container } from "tsyringe";
import { authMiddleware } from "../middleware/authMiddleware";
import { contaTvMiddleware } from "../middleware/contaTvMiddleware";
import { contaTvCadastroRateLimit } from "../middleware/contaTvCadastroRateLimit";
import ContaTvController from "../controllers/ContaTv.controller";

const contaTvRoute = Router();
const contaTvController = container.resolve(ContaTvController);

contaTvRoute.post('/cadastro', contaTvCadastroRateLimit, contaTvController.Cadastrar.bind(contaTvController));
contaTvRoute.post('/login', contaTvController.Login.bind(contaTvController));
contaTvRoute.get('/me', authMiddleware, contaTvMiddleware, contaTvController.Me.bind(contaTvController));

export default contaTvRoute;
