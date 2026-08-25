import { Router } from "express";
import { container } from "tsyringe";
import IptvProxyController from "../controllers/IptvProxy.controller";

const iptvProxyRoute = Router();
const iptvProxyController = container.resolve(IptvProxyController);

iptvProxyRoute.post('/autenticar', iptvProxyController.Autenticar.bind(iptvProxyController));
iptvProxyRoute.post('/categorias', iptvProxyController.Categorias.bind(iptvProxyController));
iptvProxyRoute.post('/canais', iptvProxyController.Canais.bind(iptvProxyController));
iptvProxyRoute.get('/manifesto', iptvProxyController.Manifesto.bind(iptvProxyController));
iptvProxyRoute.get('/segmento', iptvProxyController.Segmento.bind(iptvProxyController));

export default iptvProxyRoute;
