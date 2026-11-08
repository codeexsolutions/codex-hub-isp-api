import { Router } from "express";
import { container } from "tsyringe";
import LicencaTvController from "../controllers/LicencaTv.controller";

const licencaTvRoute = Router();
const licencaTvController = container.resolve(LicencaTvController);

licencaTvRoute.post('/solicitar', licencaTvController.Solicitar.bind(licencaTvController));
licencaTvRoute.get('/status/:chave', licencaTvController.ObterStatus.bind(licencaTvController));
licencaTvRoute.get('/pagar/:chave', licencaTvController.PaginaPagamento.bind(licencaTvController));
licencaTvRoute.get('/:chave/sync/perfil', licencaTvController.ObterPerfilSync.bind(licencaTvController));
licencaTvRoute.put('/:chave/sync/perfil', licencaTvController.SalvarPerfilSync.bind(licencaTvController));

export default licencaTvRoute;
