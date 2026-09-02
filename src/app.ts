import express from "express";
import cors from "cors";
import webpush from "./infrastructure/notification/webpush.config";

const app = express();

// Express gera ETag automaticamente em toda resposta JSON — pra uma API
// dinâmica isso faz o navegador (ou qualquer camada de cache no meio, ex.:
// CDN do Railway) devolver 304 "não mudou" quando o corpo real já não está
// mais no cache do lado do cliente. O front então recebe uma resposta vazia
// e cai no catch como se a chamada tivesse falhado — foi exatamente o que
// aconteceu no /provedor (visto no Network: 304 em tudo, inclusive nas
// chamadas de API, sem "disk cache" pra completar o corpo).
app.disable("etag");

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false
}));


app.use(express.json());




export default app;