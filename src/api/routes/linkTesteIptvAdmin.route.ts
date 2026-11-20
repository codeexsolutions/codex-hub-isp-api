import { Router } from "express";
import { container } from "tsyringe";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import LinkTesteIptvController from "../controllers/LinkTesteIptv.controller";

const linkTesteIptvAdminRoute = Router();
const linkTesteIptvController = container.resolve(LinkTesteIptvController);

linkTesteIptvAdminRoute.get('/', authMiddleware, adminMiddleware, linkTesteIptvController.Listar.bind(linkTesteIptvController));
linkTesteIptvAdminRoute.post('/', authMiddleware, adminMiddleware, linkTesteIptvController.Criar.bind(linkTesteIptvController));
linkTesteIptvAdminRoute.patch('/:id/padrao', authMiddleware, adminMiddleware, linkTesteIptvController.DefinirPadrao.bind(linkTesteIptvController));

export default linkTesteIptvAdminRoute;
