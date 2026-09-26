import { describe, it, expect, vi } from "vitest";
import ReceitanetServices from "../ReceitanetServices";

// Regressão real: em produção, o ReceitaNet às vezes devolve a resposta de
// chamados sem o campo "chamados" (sessão expirada, zero chamados formatado
// diferente etc.) — antes disso ser corrigido, `chamados.chamados.map(...)`
// quebrava com "Cannot read properties of undefined" e a tela de Suporte
// toda caía num 500. Esse teste garante que isso nunca volta a acontecer.
describe("ReceitanetServices.ObterChamados", () => {
    it("devolve lista vazia quando a API do ReceitaNet não traz o campo chamados", async () => {
        const apiFalsa = { ObterChamados: vi.fn().mockResolvedValue({}) };
        const service = new ReceitanetServices(apiFalsa as any);

        const resultado = await service.ObterChamados("token-qualquer");

        expect(resultado).toEqual([]);
    });

    it("devolve lista vazia quando a API devolve chamados: null", async () => {
        const apiFalsa = { ObterChamados: vi.fn().mockResolvedValue({ chamados: null }) };
        const service = new ReceitanetServices(apiFalsa as any);

        const resultado = await service.ObterChamados("token-qualquer");

        expect(resultado).toEqual([]);
    });

    it("mapeia os chamados normalmente quando a API responde certo", async () => {
        const apiFalsa = {
            ObterChamados: vi.fn().mockResolvedValue({
                chamados: [{ id: 1, descricao: "d", protocolo: "P1", is_aberto: true, respostas_status: 1 }],
            }),
        };
        const service = new ReceitanetServices(apiFalsa as any);

        const resultado = await service.ObterChamados("token-qualquer");

        expect(resultado).toEqual([
            { id: 1, descricao: "d", protocolo: "P1", status: "Aberto", respostasStatus: 1 },
        ]);
    });
});
