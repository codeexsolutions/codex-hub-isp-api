import { Router } from "express";
import { container } from "tsyringe";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware";
import { parceiroMiddleware } from "../middleware/parceiroMiddleware";
import ParceiroController from "../controllers/Parceiro.controller";

const upload = multer({ storage: multer.memoryStorage() });

const parceiroRoute = Router();
const parceiroController = container.resolve(ParceiroController);

parceiroRoute.post('/login', parceiroController.Login.bind(parceiroController));
parceiroRoute.post('/pre-cadastro', parceiroController.PreCadastrar.bind(parceiroController));
parceiroRoute.get('/financeiro', authMiddleware, parceiroMiddleware, parceiroController.ObterFinanceiro.bind(parceiroController));
parceiroRoute.get('/comissao/faturamento', authMiddleware, parceiroMiddleware, parceiroController.ObterFaturamentoComissao.bind(parceiroController));
parceiroRoute.get('/cupom/:codigo', authMiddleware, parceiroMiddleware, parceiroController.ObterCupom.bind(parceiroController));
parceiroRoute.patch('/cupom/:codigo/validar', authMiddleware, parceiroMiddleware, parceiroController.ValidarCupom.bind(parceiroController));
parceiroRoute.patch('/cupom/:codigo/cancelar', authMiddleware, parceiroMiddleware, parceiroController.CancelarCupom.bind(parceiroController));

// OFERTAS (o parceiro cria/gerencia — o provedor só ativa, ver /painel/provedor/ofertas)
parceiroRoute.post('/ofertas', authMiddleware, parceiroMiddleware, upload.single("imagem"), parceiroController.CriarOferta.bind(parceiroController));
parceiroRoute.get('/ofertas', authMiddleware, parceiroMiddleware, parceiroController.ObterMinhasOfertas.bind(parceiroController));
parceiroRoute.patch('/ofertas/:id', authMiddleware, parceiroMiddleware, upload.single("imagem"), parceiroController.EditarOferta.bind(parceiroController));
parceiroRoute.delete('/ofertas/:id', authMiddleware, parceiroMiddleware, parceiroController.ExcluirOferta.bind(parceiroController));

export default parceiroRoute;
