import { describe, it, expect } from "vitest";
import FaturaProviderFactory from "../FaturaProviderFactory";
import ReceitaNetFaturaProvider from "../ReceitaNetFaturaProvider";
import IxcFaturaProvider from "../IxcFaturaProvider";
import MkAuthFaturaProvider from "../MkAuthFaturaProvider";

describe("FaturaProviderFactory", () => {
    const receitaNetProvider = new ReceitaNetFaturaProvider({} as any);
    const ixcProvider = new IxcFaturaProvider({} as any);
    const mkAuthProvider = new MkAuthFaturaProvider({} as any);
    const factory = new FaturaProviderFactory(receitaNetProvider, ixcProvider, mkAuthProvider);

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
