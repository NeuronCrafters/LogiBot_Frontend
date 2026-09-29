import type { ChatHistoryDetail, ChatSession, HistoryMessage } from "@/features/chat/api/chatHistoryApi";
import {
  CHAT_SESSION_FUNCOES_ID,
  CHAT_SESSION_LOOPS_ID,
  CHAT_SESSION_VARIAVEIS_ID,
  STUDENT_USER_ID,
} from "./ids";

function iso(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

const loopsMessages: HistoryMessage[] = [
  {
    role: "user",
    content:
      "Oi! Não estou entendendo bem a diferença entre um loop `for` e um loop `while`. Quando eu uso cada um?",
    timestamp: iso(42),
  },
  {
    role: "assistant",
    content:
      "Boa pergunta! A regra prática é: use **`for`** quando você já sabe *quantas vezes* quer repetir algo (por exemplo, percorrer uma lista), e use **`while`** quando a repetição depende de uma *condição* que só é conhecida durante a execução.\n\n```python\n# for: número de repetições conhecido\nfor i in range(5):\n    print(i)\n\n# while: repete enquanto a condição for verdadeira\ncontador = 0\nwhile contador < 5:\n    print(contador)\n    contador += 1\n```\n\nOs dois exemplos acima fazem a mesma coisa, mas o `while` é a escolha certa quando você não sabe de antemão quantas voltas o loop vai dar.",
    timestamp: iso(41),
  },
  {
    role: "user",
    content:
      "E se eu não souber quantas vezes o loop vai rodar? Tipo, pedir pro usuário um número até ele digitar 'sair'.",
    timestamp: iso(38),
  },
  {
    role: "assistant",
    content:
      "Perfeito exemplo de uso do `while`! Nesse caso você não sabe quantas vezes o usuário vai digitar algo antes de decidir parar, então a condição de parada guia o loop:\n\n```python\nentrada = \"\"\nwhile entrada != \"sair\":\n    entrada = input(\"Digite um número (ou 'sair' para encerrar): \")\n    if entrada != \"sair\":\n        print(f\"Você digitou: {entrada}\")\n\nprint(\"Encerrado!\")\n```\n\nRepare que a condição `entrada != \"sair\"` é reavaliada a cada volta — assim que o usuário digitar exatamente `sair`, o loop para.",
    timestamp: iso(36),
  },
  {
    role: "user",
    content: "Ah entendi! E dá pra usar for pra isso também?",
    timestamp: iso(30),
  },
  {
    role: "assistant",
    content:
      "Dá, mas normalmente fica menos natural — você precisaria simular um loop \"infinito\" com `for` (ex.: `for _ in iter(int, 1)`) e um `break` dentro dele, o que é mais confuso de ler do que um `while` direto.\n\n**Resumindo:**\n- `for` → quantidade de repetições conhecida (listas, intervalos, `range`)\n- `while` → repetição condicionada a algo que só se sabe em tempo de execução\n\nSe quiser praticar isso, tem um quiz sobre Condicionais disponível na aba **Quiz** — ele reforça bem esse tipo de raciocínio de fluxo de controle 😉",
    timestamp: iso(29),
  },
];

const funcoesMessages: HistoryMessage[] = [
  {
    role: "user",
    content: "Como eu declaro uma função em Python que recebe dois números e devolve a soma?",
    timestamp: iso(1500),
  },
  {
    role: "assistant",
    content:
      "Assim:\n\n```python\ndef somar(a, b):\n    return a + b\n\nresultado = somar(3, 4)\nprint(resultado)  # 7\n```\n\nA palavra-chave `def` inicia a função, `somar` é o nome, `(a, b)` são os parâmetros, e `return` devolve o valor calculado para quem chamou a função.",
    timestamp: iso(1498),
  },
];

const variaveisMessages: HistoryMessage[] = [
  {
    role: "user",
    content: "Por que meu código deu erro quando tentei somar '5' + 3 em Python?",
    timestamp: iso(4200),
  },
  {
    role: "assistant",
    content:
      "Porque `'5'` é uma **string** (texto) e `3` é um **número inteiro** — Python não soma tipos diferentes automaticamente. Você precisa converter um deles:\n\n```python\nresultado = int('5') + 3\nprint(resultado)  # 8\n```\n\nEsse é um erro clássico chamado `TypeError`, muito comum quando dados vêm de um `input()`, que sempre retorna string.",
    timestamp: iso(4197),
  },
];

export const chatSessions: ChatSession[] = [
  {
    sessionId: CHAT_SESSION_LOOPS_ID,
    title: "Diferença entre for e while",
    lastActivityAt: iso(29),
  },
  {
    sessionId: CHAT_SESSION_FUNCOES_ID,
    title: "Como declarar uma função em Python",
    lastActivityAt: iso(1498),
  },
  {
    sessionId: CHAT_SESSION_VARIAVEIS_ID,
    title: "Erro de tipo ao somar variáveis",
    lastActivityAt: iso(4197),
  },
];

export const chatHistoryBySession: Record<string, ChatHistoryDetail> = {
  [CHAT_SESSION_LOOPS_ID]: {
    userId: STUDENT_USER_ID,
    sessionId: CHAT_SESSION_LOOPS_ID,
    title: "Diferença entre for e while",
    messages: loopsMessages,
  },
  [CHAT_SESSION_FUNCOES_ID]: {
    userId: STUDENT_USER_ID,
    sessionId: CHAT_SESSION_FUNCOES_ID,
    title: "Como declarar uma função em Python",
    messages: funcoesMessages,
  },
  [CHAT_SESSION_VARIAVEIS_ID]: {
    userId: STUDENT_USER_ID,
    sessionId: CHAT_SESSION_VARIAVEIS_ID,
    title: "Erro de tipo ao somar variáveis",
    messages: variaveisMessages,
  },
};

export const CANNED_BOT_REPLY =
  "Boa pergunta! Vamos pensar passo a passo: primeiro identifique o que a lógica precisa verificar, depois escolha a estrutura de controle certa (condicional, loop ou função) e teste com um exemplo pequeno antes de generalizar. Se quiser, me mande o trecho de código que você já tentou escrever.";
