import "reflect-metadata";
import "./api/container/container";
import { container } from "tsyringe";
import IIxcSoftServices from "./application/interfaces/IIxcSoftServices";

async function main() {
    const service = container.resolve<IIxcSoftServices>("IIxcSoftServices");
    try {
        await service.TestarConexao("2");
        console.log("OK: conexão autenticada com sucesso.");
    } catch (e: any) {
        console.log("FALHA:", e.message);
    }
}
main();
