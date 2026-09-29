import "reflect-metadata";
import "./api/container/container";
import { container } from "tsyringe";
import IIxcSoftServices from "./application/interfaces/IIxcSoftServices";

async function main() {
    const service = container.resolve<IIxcSoftServices>("IIxcSoftServices");
    const resultado: any = await service.ObterDadosCliente("043.999.473-06", "2", undefined as any);
    console.log("consumos:", JSON.stringify(resultado?.consumos, null, 2));
}
main().catch((e) => console.error("ERRO", e));
