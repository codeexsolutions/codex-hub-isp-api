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

// ATIVAÇÃO TV (código por cliente, ver core/models/ativacaoTvModel.ts)
painelRouter.post('/provedor/tv-ativacoes', authMiddleware, painelController.GerarAtivacaoTv.bind(painelController));
painelRouter.get('/provedor/tv-ativacoes', authMiddleware, painelController.ListarAtivacoesTv.bind(painelController));
painelRouter.delete('/provedor/tv-ativacoes/:id', authMiddleware, painelController.RevogarAtivacaoTv.bind(painelController));


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

// PLANOS DE INTERNET MÓVEL
painelRouter.post('/provedor/planos-moveis', authMiddleware, moduloMiddleware("planos_moveis"), painelController.GravarPlanoMovel.bind(painelController));
painelRouter.get('/provedor/planos-moveis', authMiddleware, moduloMiddleware("planos_moveis"), painelController.ObterPlanosMoveisPainel.bind(painelController));
painelRouter.patch('/provedor/planos-moveis/:id', authMiddleware, moduloMiddleware("planos_moveis"), painelController.EditarPlanoMovel.bind(painelController));
painelRouter.delete('/provedor/planos-moveis/:id', authMiddleware, moduloMiddleware("planos_moveis"), painelController.ExcluirPlanoMovel.bind(painelController));
painelRouter.get('/provedor/planos-moveis/solicitacoes', authMiddleware, moduloMiddleware("planos_moveis"), painelController.ListarSolicitacoesPlanoMovel.bind(painelController));
painelRouter.patch('/provedor/planos-moveis/solicitacoes/:id', authMiddleware, moduloMiddleware("planos_moveis"), painelController.AtualizarStatusSolicitacaoPlanoMovel.bind(painelController));

// MODULOS (o próprio provedor consultando quais módulos ele tem ativos)
painelRouter.get('/provedor/modulos', authMiddleware, painelController.ObterModulosProprio.bind(painelController));

// CENTRAL DE NOTIFICAÇÕES DO PAINEL (sino do provedor)
painelRouter.post('/notificacoes/inscrever', authMiddleware, painelController.InscreverNotificacaoPainel.bind(painelController));
painelRouter.post('/notificacoes/desinscrever', authMiddleware, painelController.DesinscreverNotificacaoPainel.bind(painelController));
painelRouter.get('/notificacoes', authMiddleware, painelController.ListarNotificacoesPainel.bind(painelController));
painelRouter.get('/notificacoes/nao-lidas', authMiddleware, painelController.ContarNotificacoesPainelNaoLidas.bind(painelController));
painelRouter.patch('/notificacoes/:id/lida', authMiddleware, painelController.MarcarNotificacaoPainelLida.bind(painelController));

// HOME CONFIGURÁVEL (blocos ativos/ocultos na tela inicial do app)
painelRouter.get('/provedor/home-config', authMiddleware, painelController.ObterHomeConfigProprio.bind(painelController));
painelRouter.put('/provedor/home-config', authMiddleware, painelController.DefinirHomeConfigProprio.bind(painelController));

// CANAIS DE ATENDIMENTO
painelRouter.get('/provedor/atendimento', authMiddleware, painelController.ObterAtendimentoProprio.bind(painelController));
painelRouter.put('/provedor/atendimento', authMiddleware, painelController.DefinirAtendimentoProprio.bind(painelController));

// CLUBE DE BENEFÍCIOS (identidade própria)
painelRouter.get('/provedor/clube-beneficios', authMiddleware, painelController.ObterClubeBeneficiosProprio.bind(painelController));
painelRouter.put('/provedor/clube-beneficios', authMiddleware, painelController.DefinirClubeBeneficiosProprio.bind(painelController));

// ORDEM DE SERVIÇO IXC (config de id_assunto/id_filial/setor/id_evento)
painelRouter.get('/provedor/ixc-os-config', authMiddleware, painelController.ObterIxcOsConfigProprio.bind(painelController));
painelRouter.put('/provedor/ixc-os-config', authMiddleware, painelController.DefinirIxcOsConfigProprio.bind(painelController));

// ASSUNTOS DE OS IXC
painelRouter.get('/provedor/ixc-assuntos', authMiddleware, painelController.ListarIxcAssuntosProprio.bind(painelController));
painelRouter.post('/provedor/ixc-assuntos', authMiddleware, painelController.CriarIxcAssuntoProprio.bind(painelController));
painelRouter.delete('/provedor/ixc-assuntos/:id', authMiddleware, painelController.ExcluirIxcAssuntoProprio.bind(painelController));

// IMPRESSÃO DE CONTRATO IXC (resource do endpoint — específico por instalação)
painelRouter.get('/provedor/ixc-contrato-config', authMiddleware, painelController.ObterIxcContratoConfigProprio.bind(painelController));
painelRouter.put('/provedor/ixc-contrato-config', authMiddleware, painelController.DefinirIxcContratoConfigProprio.bind(painelController));

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
painelRouter.patch('/admin/parceiros/:id/aprovar', authMiddleware, adminMiddleware, painelController.AprovarParceiroAdmin.bind(painelController));
painelRouter.patch('/admin/parceiros/:id/rejeitar', authMiddleware, adminMiddleware, painelController.RejeitarParceiroAdmin.bind(painelController));
painelRouter.patch('/admin/compras/:id/validar', authMiddleware, adminMiddleware, painelController.ValidarCompraAdmin.bind(painelController));

// FATURAMENTO SYNK (mensalidade que o provedor paga pra Synk)
painelRouter.get('/provedor/faturamento', authMiddleware, painelController.ObterFaturamentoProvedor.bind(painelController));
painelRouter.get('/admin/faturamento', authMiddleware, adminMiddleware, painelController.ListarFaturamentoAdmin.bind(painelController));
painelRouter.post('/admin/faturamento/:codigoProvedor/assinatura', authMiddleware, adminMiddleware, painelController.ConfigurarAssinaturaAdmin.bind(painelController));

// PLANOS DE VENDA
painelRouter.get('/admin/planos', authMiddleware, adminMiddleware, painelController.ListarPlanosAdmin.bind(painelController));
painelRouter.post('/admin/planos', authMiddleware, adminMiddleware, painelController.CriarPlanoAdmin.bind(painelController));
painelRouter.put('/admin/planos/:id', authMiddleware, adminMiddleware, painelController.EditarPlanoAdmin.bind(painelController));
painelRouter.patch('/admin/planos/:id/status', authMiddleware, adminMiddleware, painelController.DefinirStatusPlanoAdmin.bind(painelController));

// PAGAMENTO DE COMISSÃO DO PARCEIRO
painelRouter.get('/admin/comissao/faturamento', authMiddleware, adminMiddleware, painelController.ListarFaturasComissaoAdmin.bind(painelController));
painelRouter.patch('/admin/comissao/faturas/:id/pagar', authMiddleware, adminMiddleware, painelController.MarcarFaturaComissaoPagaAdmin.bind(painelController));
painelRouter.patch('/admin/comissao/faturas/:id/cancelar', authMiddleware, adminMiddleware, painelController.MarcarFaturaComissaoCanceladaAdmin.bind(painelController));
painelRouter.get('/admin/faturamento/:codigoProvedor/faturas', authMiddleware, adminMiddleware, painelController.ObterFaturasAdmin.bind(painelController));
painelRouter.patch('/admin/faturas/:id/pagar', authMiddleware, adminMiddleware, painelController.MarcarFaturaPagaAdmin.bind(painelController));
painelRouter.patch('/admin/faturas/:id/cancelar', authMiddleware, adminMiddleware, painelController.MarcarFaturaCanceladaAdmin.bind(painelController));
painelRouter.patch('/admin/faturas/:id/reabrir', authMiddleware, adminMiddleware, painelController.ReabrirFaturaAdmin.bind(painelController));
painelRouter.get('/admin/faturas/:id/recibo', authMiddleware, adminMiddleware, painelController.ObterReciboAdmin.bind(painelController));
painelRouter.get('/admin/config-pix', authMiddleware, adminMiddleware, painelController.ObterConfigPixAdmin.bind(painelController));
painelRouter.put('/admin/config-pix', authMiddleware, adminMiddleware, painelController.DefinirConfigPixAdmin.bind(painelController));

painelRouter.get('/admin/config-iptv', authMiddleware, adminMiddleware, painelController.ObterConfigIptvAdmin.bind(painelController));
painelRouter.put('/admin/config-iptv', authMiddleware, adminMiddleware, painelController.DefinirConfigIptvAdmin.bind(painelController));

painelRouter.get('/admin/config-licenca-tv', authMiddleware, adminMiddleware, painelController.ObterConfigLicencaTvAdmin.bind(painelController));
painelRouter.put('/admin/config-licenca-tv', authMiddleware, adminMiddleware, painelController.DefinirConfigLicencaTvAdmin.bind(painelController));
painelRouter.get('/admin/licencas-tv', authMiddleware, adminMiddleware, painelController.ListarLicencasTvAdmin.bind(painelController));
painelRouter.post('/admin/licencas-tv', authMiddleware, adminMiddleware, painelController.CriarLicencaTvAdmin.bind(painelController));
painelRouter.patch('/admin/licencas-tv/:id/aprovar', authMiddleware, adminMiddleware, painelController.AprovarLicencaTvAdmin.bind(painelController));
painelRouter.patch('/admin/licencas-tv/:id/cancelar', authMiddleware, adminMiddleware, painelController.CancelarLicencaTvAdmin.bind(painelController));

export default painelRouter;