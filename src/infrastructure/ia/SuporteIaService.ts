import Anthropic from "@anthropic-ai/sdk";

// Sugestão automática ANTES de abrir chamado — módulo "ia_suporte", opcional
// por provedor. Escopo deliberadamente restrito a passos simples e seguros
// (reiniciar roteador, 2ª via de fatura, dúvidas de auto-atendimento) — não
// tenta diagnosticar queda de conexão de verdade, isso só o suporte humano
// resolve. Haiku (modelo mais barato) + max_tokens curto por controle de custo.
const SYSTEM_PROMPT = `Você é um assistente de primeiro atendimento de um provedor de internet.
Seu único objetivo é tentar resolver, em poucas frases, os problemas mais simples e comuns ANTES
de abrir um chamado com o suporte humano. Você SÓ pode ajudar com:
- Reiniciar o roteador (desligar da tomada, esperar uns 30 segundos, ligar de novo e aguardar as luzes estabilizarem).
- Como emitir a 2ª via da fatura / ver o código de barras ou PIX (isso já está na tela "Faturas" do app).
- Dúvidas simples de uso do próprio app (onde vê o plano, como faz teste de velocidade, etc.).

Regras importantes:
- Se a mensagem do cliente parecer um problema real de conexão (internet caiu, sem sinal, lentidão
  persistente após reiniciar, problema físico/de instalação), NÃO tente diagnosticar. Responda de forma
  breve reconhecendo o problema e oriente a abrir o chamado pra o time técnico olhar.
- Nunca invente prazos, valores, promessas de visita técnica ou informações que você não tem.
- Nunca peça dados pessoais, senha ou informações de pagamento.
- Seja direto e breve (no máximo 4-5 linhas curtas). Sem saudação nem despedida formal.
- Responda sempre em português do Brasil.`;

let cliente: Anthropic | null = null;
function obterCliente(): Anthropic {
    if (!cliente) cliente = new Anthropic();
    return cliente;
}

export async function gerarSugestaoSuporte(mensagemCliente: string): Promise<string> {
    const response = await obterCliente().messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 220,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: mensagemCliente.slice(0, 1000) }],
    });

    const bloco = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    return bloco?.text?.trim() ?? "";
}
