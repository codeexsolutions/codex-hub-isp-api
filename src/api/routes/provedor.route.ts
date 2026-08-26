import { Router } from "express";
import { container } from "tsyringe";
import ProvedorController from "../controllers/Provedor.controller";

const provedorRoute = Router();
const provedorController = container.resolve(ProvedorController);

provedorRoute.get('/manifest/:codigoProvedor', provedorController.ObterManifest.bind(provedorController));
provedorRoute.get('/temas/:codigoProvedor', provedorController.ObterTema.bind(provedorController));
provedorRoute.get('/banners/:codigoProvedor', provedorController.ObterBanner.bind(provedorController));
provedorRoute.get('/anuncios/:codigoProvedor', provedorController.ObterAnuncios.bind(provedorController));
provedorRoute.get('/beneficios/:codigoProvedor', provedorController.ObterBeneficios.bind(provedorController));
provedorRoute.get('/modulos/:codigoProvedor', provedorController.ObterModulos.bind(provedorController));
provedorRoute.post('/tv-ativacao/:codigo/validar', provedorController.ValidarAtivacaoTv.bind(provedorController));
provedorRoute.get('/home-config/:codigoProvedor', provedorController.ObterHomeConfig.bind(provedorController));
provedorRoute.get('/atendimento/:codigoProvedor', provedorController.ObterAtendimento.bind(provedorController));
provedorRoute.get('/clube-beneficios/:codigoProvedor', provedorController.ObterClubeBeneficios.bind(provedorController));
provedorRoute.get('/ixc-assuntos/:codigoProvedor', provedorController.ObterIxcAssuntos.bind(provedorController));
provedorRoute.post('/beneficios/:id/clique', provedorController.RegistrarCliqueBeneficio.bind(provedorController));
provedorRoute.post('/beneficios/:id/comprar', provedorController.ComprarBeneficio.bind(provedorController));
provedorRoute.get('/beneficios/compras/:codigoProvedor', provedorController.ObterMinhasCompras.bind(provedorController));
provedorRoute.get('/pontos/recompensas/:codigoProvedor', provedorController.ObterRecompensas.bind(provedorController));
provedorRoute.post('/pontos/resgatar', provedorController.ResgatarRecompensa.bind(provedorController));
provedorRoute.get('/pontos/:codigoProvedor', provedorController.ObterMeusPontos.bind(provedorController));
provedorRoute.get('/parceiros/:codigoProvedor', provedorController.ListarParceirosAtivos.bind(provedorController));
provedorRoute.get('/:codigo', provedorController.ObterProvedorPorCodigo.bind(provedorController));
provedorRoute.post('/indicacao', provedorController.SalvarIndicacao.bind(provedorController))
provedorRoute.post('/avaliacao/servico/me', provedorController.AvaliarServico.bind(provedorController))
provedorRoute.post('/avaliacao/app/me', provedorController.AvaliarApp.bind(provedorController))

export default provedorRoute;