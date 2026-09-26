import { describe, it, expect } from "vitest";
import TokenProviderFactory from "../TokenProviderFactory";
import ReceitaNetTokenProvider from "../ReceitaNetTokenProvider";
import IxcTokenProvider from "../IxcTokenProvider";
import MkAuthTokenProvider from "../MkAuthTokenProvider";

describe("TokenProviderFactory", () => {
    const receitaNetProvider = new ReceitaNetTokenProvider({} as any);
    const ixcProvider = new IxcTokenProvider({} as any);
    const mkAuthProvider = new MkAuthTokenProvider({} as any);
    const factory = new TokenProviderFactory(receitaNetProvider, ixcProvider, mkAuthProvider);

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
