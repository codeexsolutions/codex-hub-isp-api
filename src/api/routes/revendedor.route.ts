import { Router } from "express";
import { container } from "tsyringe";
import { authMiddleware } from "../middleware/authMiddleware";
import { revendedorMiddleware } from "../middleware/revendedorMiddleware";
import RevendedorController from "../controllers/Revendedor.controller";

const revendedorRoute = Router();
const revendedorController = container.resolve(RevendedorController);

revendedorRoute.post('/login', revendedorController.Login.bind(revendedorController));

// LICENÇAS — o revendedor cria/gerencia só as dos próprios clientes
revendedorRoute.get('/licencas', authMiddleware, revendedorMiddleware, revendedorController.ListarMinhasLicencas.bind(revendedorController));
revendedorRoute.post('/licencas', authMiddleware, revendedorMiddleware, revendedorController.CriarLicenca.bind(revendedorController));
revendedorRoute.patch('/licencas/:id/aprovar', authMiddleware, revendedorMiddleware, revendedorController.AprovarLicenca.bind(revendedorController));
revendedorRoute.patch('/licencas/:id/cancelar', authMiddleware, revendedorMiddleware, revendedorController.CancelarLicenca.bind(revendedorController));
revendedorRoute.patch('/licencas/:id/link-lista', authMiddleware, revendedorMiddleware, revendedorController.DefinirLinkPagamentoLista.bind(revendedorController));

export default revendedorRoute;
