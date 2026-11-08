import { Router } from "express";
import { container } from "tsyringe";
import ServidorParceiroController from "../controllers/ServidorParceiro.controller";

const servidorParceiroRoute = Router();
const servidorParceiroController = container.resolve(ServidorParceiroController);

servidorParceiroRoute.get('/:codigo/validar', servidorParceiroController.Validar.bind(servidorParceiroController));

export default servidorParceiroRoute;
