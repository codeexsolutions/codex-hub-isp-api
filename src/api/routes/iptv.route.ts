import { Router } from "express";
import { container } from "tsyringe";
import IptvController from "../controllers/Iptv.controller";

const iptvRoute = Router();
const iptvController = container.resolve(IptvController);

iptvRoute.get('/url-padrao', iptvController.ObterUrlPadrao.bind(iptvController));

export default iptvRoute;
