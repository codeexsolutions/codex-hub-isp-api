import { Router } from "express";
import { container } from "tsyringe";
import TokenController from "../controllers/Token.controller";

const tokenRoute = Router();

const tokenController = container.resolve(TokenController);

tokenRoute.post('/token', tokenController.ObterToken.bind(tokenController));
tokenRoute.post('/token/ixc-usuario', tokenController.ObterTokenPorUsuarioSenha.bind(tokenController));
tokenRoute.post('/token/contrato', tokenController.ObterTokenPorContrato.bind(tokenController))
tokenRoute.post('/painel/token', tokenController.LoginPainel.bind(tokenController))


export default tokenRoute;