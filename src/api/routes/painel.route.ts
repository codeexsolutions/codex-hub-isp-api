import { Router } from "express";
import { container } from "tsyringe";
import { authMiddleware } from "../middleware/authMiddleware";
import PainelController from "../controllers/Painel.controller";
import { uploadMiddleware } from "../middleware/uploadMiddleware";

const painelRouter = Router()
const painelController = container.resolve(PainelController);

painelRouter.post('/login', painelController.LoginPainel.bind(painelController))
painelRouter.post('/provedor/cadastrar', painelController.CadastrarProvedor.bind(painelController))
painelRouter.patch('/provedor/atualizar', authMiddleware, painelController.AtualizarProvedor.bind(painelController))
painelRouter.get('/provedor/temas', authMiddleware, painelController.ObterTema.bind(painelController));
painelRouter.put('/provedor/temas', authMiddleware, uploadMiddleware, painelController.AtualizarTema.bind(painelController));


// MARKETING - ALERTAS - INFORMATIVOS

// ANUNCIOS
painelRouter.post('/provedor/anuncios', authMiddleware, painelController.GravarAnuncio.bind(painelController));
painelRouter.get('/provedor/anuncios', authMiddleware, painelController.ObterAnuncios.bind(painelController) );
painelRouter.patch('/provedor/anuncios/:id', authMiddleware, painelController.EditarAnuncio.bind(painelController));
painelRouter.delete('/provedor/anuncios/:id', authMiddleware, painelController.ExcluirAnuncio.bind(painelController));

// BANNERS
painelRouter.post('/provedor/banners', authMiddleware, painelController.GravarBanner.bind(painelController));
painelRouter.get('/provedor/banners', authMiddleware, painelController.ObterBanner.bind(painelController));
painelRouter.patch('/provedor/banners/:id', authMiddleware, painelController.EditarBanner.bind(painelController))
painelRouter.delete('/provedor/banners/:id', authMiddleware, painelController.ExcluirBanner.bind(painelController))


painelRouter.get('/provedor/indicacoes', authMiddleware, painelController.ObterIndicacoes.bind(painelController)); 
painelRouter.get('/provedor/avaliacoes', authMiddleware, painelController.ObterAvaliacaoServico.bind(painelController));

export default painelRouter;