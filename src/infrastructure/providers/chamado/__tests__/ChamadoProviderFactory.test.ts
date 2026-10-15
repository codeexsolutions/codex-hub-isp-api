import { describe, it, expect } from "vitest";
import ChamadoProviderFactory from "../ChamadoProviderFactory";
import ReceitaNetChamadoProvider from "../ReceitaNetChamadoProvider";
import IxcChamadoProvider from "../IxcChamadoProvider";
import MkAuthChamadoProvider from "../MkAuthChamadoProvider";
import SgpChamadoProvider from "../SgpChamadoProvider";

describe("ChamadoProviderFactory", () => {
    const receitaNetProvider = new ReceitaNetChamadoProvider({} as any);
    const ixcProvider = new IxcChamadoProvider({} as any);
    const mkAuthProvider = new MkAuthChamadoProvider({} as any);
    const sgpProvider = new SgpChamadoProvider({} as any);
    const factory = new ChamadoProviderFactory(receitaNetProvider, ixcProvider, mkAuthProvider, sgpProvider);

    it("devolve o provider do IXC quando gerenciador é IXCSOFT", () => {
        expect(factory.criar("IXCSOFT")).toBe(ixcProvider);
    });

    it("devolve o provider do MK-Auth quando gerenciador é MKAUTH", () => {
        expect(factory.criar("MKAUTH")).toBe(mkAuthProvider);
    });

    it("devolve o provider do SGP quando gerenciador é SGP", () => {
        expect(factory.criar("SGP")).toBe(sgpProvider);
    });

    it("devolve o provider do ReceitaNet pra qualquer outro valor (mesmo comportamento do else implícito de antes)", () => {
        expect(factory.criar("RECEITANET")).toBe(receitaNetProvider);
        expect(factory.criar("qualquer-coisa")).toBe(receitaNetProvider);
        expect(factory.criar(undefined)).toBe(receitaNetProvider);
    });
});
