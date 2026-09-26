import { describe, it, expect } from "vitest";
import ClienteProviderFactory from "../ClienteProviderFactory";
import ReceitaNetClienteProvider from "../ReceitaNetClienteProvider";
import IxcClienteProvider from "../IxcClienteProvider";
import MkAuthClienteProvider from "../MkAuthClienteProvider";

describe("ClienteProviderFactory", () => {
    const receitaNetProvider = new ReceitaNetClienteProvider({} as any);
    const ixcProvider = new IxcClienteProvider({} as any);
    const mkAuthProvider = new MkAuthClienteProvider({} as any);
    const factory = new ClienteProviderFactory(receitaNetProvider, ixcProvider, mkAuthProvider);

    it("devolve o provider do IXC quando gerenciador é IXCSOFT", () => {
        expect(factory.criar("IXCSOFT")).toBe(ixcProvider);
    });

    it("devolve o provider do MK-Auth quando gerenciador é MKAUTH", () => {
        expect(factory.criar("MKAUTH")).toBe(mkAuthProvider);
    });

    it("devolve o provider do ReceitaNet pra qualquer outro valor (mesmo comportamento do else implícito de antes)", () => {
        expect(factory.criar("RECEITANET")).toBe(receitaNetProvider);
        expect(factory.criar("qualquer-coisa")).toBe(receitaNetProvider);
        expect(factory.criar(undefined)).toBe(receitaNetProvider);
    });
});
