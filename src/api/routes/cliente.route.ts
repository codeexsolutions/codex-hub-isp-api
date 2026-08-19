import { Router } from "express";
import { container } from "tsyringe";
import ClienteController from "../controllers/Cliente.controller";

const clienteRoute = Router();
const clienteController = container.resolve(ClienteController);

clienteRoute.get('/contrato/pdf', clienteController.ObterContratoPdf.bind(clienteController));
clienteRoute.post("/dados-cliente", clienteController.ObterDadosCliente.bind(clienteController));
clienteRoute.post('/faturas', clienteController.ObterFaturas.bind(clienteController));
clienteRoute.post('/contrato', clienteController.ObterContrato.bind(clienteController));
clienteRoute.post('/notificar-pagamento', clienteController.NotificarPagamento.bind(clienteController));

export default clienteRoute;