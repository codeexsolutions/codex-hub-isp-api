import { Router } from "express";
import clienteRoute from "./cliente.route";
import tokenRoute from "./token.route";
import provedorRoute from "./provedor.route";
import chamadoRoute from "./chamado.route";
import painelRouter from "./painel.route";
import notificationRoute from "./notifications.route";
import parceiroRoute from "./parceiro.route";
import iptvRoute from "./iptv.route";
import iptvProxyRoute from "./iptvProxy.route";
import licencaTvRoute from "./licencaTv.route";
import revendedorRoute from "./revendedor.route";
import catalogoRoute from "./catalogo.route";
import futebolRoute from "./futebol.route";
import servidorParceiroRoute from "./servidorParceiro.route";
import marcadoresRoute from "./marcadores.route";
import esportesRoute from "./esportes.route";
import contaTvRoute from "./contaTv.route";
import contaTvAdminRoute from "./contaTvAdmin.route";
import linkTesteIptvAdminRoute from "./linkTesteIptvAdmin.route";

const routes = Router();

routes.use('/login', tokenRoute);
routes.use("/cliente", clienteRoute);
routes.use("/provedores", provedorRoute);
routes.use("/chamados", chamadoRoute);
routes.use("/painel", painelRouter);
routes.use('/notificacoes', notificationRoute)
routes.use('/parceiros', parceiroRoute)
routes.use('/iptv', iptvRoute)
routes.use('/iptv/proxy', iptvProxyRoute)
routes.use('/licenca-tv', licencaTvRoute)
routes.use('/revendedores', revendedorRoute)
routes.use('/catalogo', catalogoRoute)
routes.use('/futebol', futebolRoute)
routes.use('/servidores-parceiros', servidorParceiroRoute)
routes.use('/marcadores', marcadoresRoute)
routes.use('/esportes', esportesRoute)
routes.use('/synk-tv', contaTvRoute)
routes.use('/painel/admin/synk-tv-clientes', contaTvAdminRoute)
routes.use('/painel/admin/links-teste-iptv', linkTesteIptvAdminRoute)

export default routes;