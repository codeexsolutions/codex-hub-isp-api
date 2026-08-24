import { Router } from "express";
import clienteRoute from "./cliente.route";
import tokenRoute from "./token.route";
import provedorRoute from "./provedor.route";
import chamadoRoute from "./chamado.route";
import painelRouter from "./painel.route";
import notificationRoute from "./notifications.route";
import parceiroRoute from "./parceiro.route";
import iptvRoute from "./iptv.route";
import licencaTvRoute from "./licencaTv.route";

const routes = Router();

routes.use('/login', tokenRoute);
routes.use("/cliente", clienteRoute);
routes.use("/provedores", provedorRoute);
routes.use("/chamados", chamadoRoute);
routes.use("/painel", painelRouter);
routes.use('/notificacoes', notificationRoute)
routes.use('/parceiros', parceiroRoute)
routes.use('/iptv', iptvRoute)
routes.use('/licenca-tv', licencaTvRoute)

export default routes;