import { Router } from "express";
import { container } from "tsyringe";
import ProvedorController from "../controllers/Provedor.controller";

const provedorRoute = Router();
const provedorController = container.resolve(ProvedorController);

provedorRoute.get('/manifest/:codigoProvedor', provedorController.ObterManifest.bind(provedorController));
provedorRoute.get('/temas/:codigoProvedor', provedorController.ObterTema.bind(provedorController));
provedorRoute.get('/banners/:codigoProvedor', provedorController.ObterBanner.bind(provedorController));
provedorRoute.get('/anuncios/:codigoProvedor', provedorController.ObterAnuncios.bind(provedorController));
provedorRoute.get('/:codigo', provedorController.ObterProvedorPorCodigo.bind(provedorController));
provedorRoute.post('/indicacao', provedorController.SalvarIndicacao.bind(provedorController))
provedorRoute.post('/avaliacao/servico/me', provedorController.AvaliarServico.bind(provedorController))
provedorRoute.post('/avaliacao/app/me', provedorController.AvaliarApp.bind(provedorController))

export default provedorRoute;