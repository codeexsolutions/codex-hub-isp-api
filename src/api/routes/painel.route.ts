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

// OFERTAS (módulo vendável — precisa estar ativo pra esse provedor). Criadas pelo
// parceiro (ver /v1/parceiros/ofertas) — o provedor só vê o catálogo e ativa.
painelRouter.get('/provedor/ofertas/catalogo', authMiddleware, moduloMiddleware("beneficios"), painelController.ObterCatalogoOfertas.bind(painelController));
painelRouter.patch('/provedor/ofertas/:id/ativar', authMiddleware, moduloMiddleware("beneficios"), painelController.AtivarOferta.bind(painelController));

// METRICAS
painelRouter.get('/provedor/metricas', authMiddleware, painelController.ObterMetricas.bind(painelController));

// COMPRAS (relatório do provedor — mesmo módulo de Benefícios)
painelRouter.get('/provedor/compras', authMiddleware, moduloMiddleware("beneficios"), painelController.ObterCompras.bind(painelController));

// RECOMPENSAS (pontos — mesmo módulo de Benefícios)
// RECOMPENSAS — módulo próprio (o cliente pode ganhar pontos por comprar um benefício
// mesmo sem esse módulo ativo; "recompensas" só controla o catálogo de resgate).
painelRouter.post('/provedor/pontos/recompensas', authMiddleware, moduloMiddleware("recompensas"), painelController.GravarRecompensa.bind(painelController));
painelRouter.get('/provedor/pontos/recompensas', authMiddleware, moduloMiddleware("recompensas"), painelController.ObterRecompensasPainel.bind(painelController));
painelRouter.patch('/provedor/pontos/recompensas/:id', authMiddleware, moduloMiddleware("recompensas"), painelController.EditarRecompensa.bind(painelController));
painelRouter.delete('/provedor/pontos/recompensas/:id', authMiddleware, moduloMiddleware("recompensas"), painelController.ExcluirRecompensa.bind(painelController));
painelRouter.post('/provedor/pontos/conceder', authMiddleware, moduloMiddleware("recompensas"), painelController.ConcederPontos.bind(painelController));

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
painelRouter.patch('/admin/parceiros/:id/localizacao', authMiddleware, adminMiddleware, painelController.DefinirLocalizacaoParceiroAdmin.bind(painelController));
painelRouter.patch('/admin/parceiros/:id/contato', authMiddleware, adminMiddleware, painelController.DefinirContatoParceiroAdmin.bind(painelController));
painelRouter.patch('/admin/compras/:id/validar', authMiddleware, adminMiddleware, painelController.ValidarCompraAdmin.bind(painelController));

// FATURAMENTO SYNK (mensalidade que o provedor paga pra Synk)
painelRouter.get('/provedor/faturamento', authMiddleware, painelController.ObterFaturamentoProvedor.bind(painelController));
painelRouter.get('/admin/faturamento', authMiddleware, adminMiddleware, painelController.ListarFaturamentoAdmin.bind(painelController));
painelRouter.post('/admin/faturamento/:codigoProvedor/assinatura', authMiddleware, adminMiddleware, painelController.ConfigurarAssinaturaAdmin.bind(painelController));
painelRouter.patch('/admin/faturas/:id/pagar', authMiddleware, adminMiddleware, painelController.MarcarFaturaPagaAdmin.bind(painelController));
painelRouter.patch('/admin/faturas/:id/cancelar', authMiddleware, adminMiddleware, painelController.MarcarFaturaCanceladaAdmin.bind(painelController));
painelRouter.get('/admin/faturas/:id/recibo', authMiddleware, adminMiddleware, painelController.ObterReciboAdmin.bind(painelController));
painelRouter.get('/admin/config-pix', authMiddleware, adminMiddleware, painelController.ObterConfigPixAdmin.bind(painelController));
painelRouter.put('/admin/config-pix', authMiddleware, adminMiddleware, painelController.DefinirConfigPixAdmin.bind(painelController));

export default painelRouter;