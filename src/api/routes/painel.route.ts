import { Router } from "express";
import { container } from "tsyringe";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { moduloMiddleware } from "../middleware/moduloMiddleware";
import PainelController from "../controllers/Painel.controller";
import { uploadMiddleware } from "../middleware/uploadMiddleware";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });



const painelRouter = Router()
const painelController = container.resolve(PainelController);

painelRouter.post('/login', painelController.LoginPainel.bind(painelController))
painelRouter.post('/provedor/cadastrar', painelController.CadastrarProvedor.bind(painelController))
painelRouter.patch('/provedor/atualizar', authMiddleware, painelController.AtualizarProvedor.bind(painelController))
painelRouter.get('/provedor/temas', authMiddleware, painelController.ObterTema.bind(painelController));
painelRouter.put('/provedor/temas', authMiddleware, uploadMiddleware, painelController.AtualizarTema.bind(painelController));


// MARKETING - ALERTAS - INFORMATIVOS

// ANUNCIOS
painelRouter.post('/provedor/anuncios', authMiddleware, upload.single("imagem"), painelController.GravarAnuncio.bind(painelController));
painelRouter.get('/provedor/anuncios', authMiddleware, painelController.ObterAnuncios.bind(painelController) );
painelRouter.patch('/provedor/anuncios/:id', authMiddleware, upload.single("imagem"), painelController.EditarAnuncio.bind(painelController));
painelRouter.delete('/provedor/anuncios/:id', authMiddleware, painelController.ExcluirAnuncio.bind(painelController));

// BANNERS
painelRouter.post('/provedor/banners', authMiddleware, painelController.GravarBanner.bind(painelController));
painelRouter.get('/provedor/banners', authMiddleware, painelController.ObterBanner.bind(painelController));
painelRouter.patch('/provedor/banners/:id', authMiddleware, painelController.EditarBanner.bind(painelController))
painelRouter.delete('/provedor/banners/:id', authMiddleware, painelController.ExcluirBanner.bind(painelController))

// BENEFICIOS (módulo vendável — precisa estar ativo pra esse provedor)
painelRouter.post('/provedor/beneficios', authMiddleware, moduloMiddleware("beneficios"), upload.single("imagem"), painelController.GravarBeneficio.bind(painelController));
painelRouter.get('/provedor/beneficios', authMiddleware, moduloMiddleware("beneficios"), painelController.ObterBeneficios.bind(painelController));
painelRouter.patch('/provedor/beneficios/:id', authMiddleware, moduloMiddleware("beneficios"), upload.single("imagem"), painelController.EditarBeneficio.bind(painelController));
painelRouter.delete('/provedor/beneficios/:id', authMiddleware, moduloMiddleware("beneficios"), painelController.ExcluirBeneficio.bind(painelController));

// METRICAS
painelRouter.get('/provedor/metricas', authMiddleware, painelController.ObterMetricas.bind(painelController));

// COMPRAS (relatório do provedor — mesmo módulo de Benefícios)
painelRouter.get('/provedor/compras', authMiddleware, moduloMiddleware("beneficios"), painelController.ObterCompras.bind(painelController));

// RECOMPENSAS (pontos — mesmo módulo de Benefícios)
painelRouter.post('/provedor/pontos/recompensas', authMiddleware, moduloMiddleware("beneficios"), painelController.GravarRecompensa.bind(painelController));
painelRouter.get('/provedor/pontos/recompensas', authMiddleware, moduloMiddleware("beneficios"), painelController.ObterRecompensasPainel.bind(painelController));
painelRouter.patch('/provedor/pontos/recompensas/:id', authMiddleware, moduloMiddleware("beneficios"), painelController.EditarRecompensa.bind(painelController));
painelRouter.delete('/provedor/pontos/recompensas/:id', authMiddleware, moduloMiddleware("beneficios"), painelController.ExcluirRecompensa.bind(painelController));
painelRouter.post('/provedor/pontos/conceder', authMiddleware, moduloMiddleware("beneficios"), painelController.ConcederPontos.bind(painelController));

// MODULOS (o próprio provedor consultando quais módulos ele tem ativos)
painelRouter.get('/provedor/modulos', authMiddleware, painelController.ObterModulosProprio.bind(painelController));

painelRouter.get('/provedor/indicacoes', authMiddleware, painelController.ObterIndicacoes.bind(painelController));
painelRouter.patch('/provedor/indicacoes/:id/efetivar', authMiddleware, moduloMiddleware("beneficios"), painelController.MarcarIndicacaoEfetivada.bind(painelController));
painelRouter.get('/provedor/avaliacoes', authMiddleware, painelController.ObterAvaliacaoServico.bind(painelController));

// ADMIN (tela interna de ativação de módulos — login separado do provedor)
painelRouter.post('/admin/login', painelController.LoginAdmin.bind(painelController));
painelRouter.get('/admin/provedores', authMiddleware, adminMiddleware, painelController.ListarProvedoresAdmin.bind(painelController));
painelRouter.patch('/admin/provedores/:codigoProvedor/modulos/:modulo', authMiddleware, adminMiddleware, painelController.DefinirModuloAdmin.bind(painelController));
painelRouter.patch('/admin/provedores/:codigoProvedor/status', authMiddleware, adminMiddleware, painelController.DefinirStatusProvedorAdmin.bind(painelController));
painelRouter.get('/admin/config-comissao', authMiddleware, adminMiddleware, painelController.ObterConfigComissaoAdmin.bind(painelController));
painelRouter.put('/admin/config-comissao', authMiddleware, adminMiddleware, painelController.DefinirConfigComissaoAdmin.bind(painelController));
painelRouter.get('/admin/compras', authMiddleware, adminMiddleware, painelController.ObterRelatorioComprasAdmin.bind(painelController));
painelRouter.get('/admin/config-pontos', authMiddleware, adminMiddleware, painelController.ObterConfigPontosAdmin.bind(painelController));
painelRouter.put('/admin/config-pontos', authMiddleware, adminMiddleware, painelController.DefinirConfigPontosAdmin.bind(painelController));
painelRouter.post('/admin/parceiros', authMiddleware, adminMiddleware, painelController.CriarParceiroAdmin.bind(painelController));
painelRouter.get('/admin/parceiros', authMiddleware, adminMiddleware, painelController.ListarParceirosAdmin.bind(painelController));
painelRouter.patch('/admin/parceiros/:id/status', authMiddleware, adminMiddleware, painelController.DefinirStatusParceiroAdmin.bind(painelController));
painelRouter.patch('/admin/parceiros/:id/provedor', authMiddleware, adminMiddleware, painelController.DefinirProvedorParceiroAdmin.bind(painelController));
painelRouter.patch('/admin/compras/:id/validar', authMiddleware, adminMiddleware, painelController.ValidarCompraAdmin.bind(painelController));

export default painelRouter;