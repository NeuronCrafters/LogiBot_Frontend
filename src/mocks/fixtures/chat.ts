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
      "Hi! I'm not really understanding the difference between a `for` loop and a `while` loop. When do I use each one?",
    timestamp: iso(42),
  },
  {
    role: "assistant",
    content:
      "Great question! The rule of thumb is: use **`for`** when you already know *how many times* you want to repeat something (for example, iterating over a list), and use **`while`** when the repetition depends on a *condition* that is only known at runtime.\n\n```python\n# for: known number of repetitions\nfor i in range(5):\n    print(i)\n\n# while: repeats as long as the condition is true\ncounter = 0\nwhile counter < 5:\n    print(counter)\n    counter += 1\n```\n\nBoth examples above do the same thing, but `while` is the right choice when you don't know in advance how many iterations the loop will run.",
    timestamp: iso(41),
  },
  {
    role: "user",
    content:
      "What if I don't know how many times the loop will run? Like, asking the user for a number until they type 'quit'.",
    timestamp: iso(38),
  },
  {
    role: "assistant",
    content:
      "A perfect use case for `while`! Here you don't know how many times the user will type something before deciding to stop, so the stop condition drives the loop:\n\n```python\nuser_input = \"\"\nwhile user_input != \"quit\":\n    user_input = input(\"Enter a number (or 'quit' to exit): \")\n    if user_input != \"quit\":\n        print(f\"You typed: {user_input}\")\n\nprint(\"Finished!\")\n```\n\nNotice that the condition `user_input != \"quit\"` is re-evaluated on every iteration — as soon as the user types exactly `quit`, the loop stops.",
    timestamp: iso(36),
  },
  {
    role: "user",
    content: "Oh, I see! Can I use for for that too?",
    timestamp: iso(30),
  },
  {
    role: "assistant",
    content:
      "You can, but it usually feels less natural — you would need to simulate an \"infinite\" loop with `for` (e.g. `for _ in iter(int, 1)`) and a `break` inside it, which is harder to read than a plain `while`.\n\n**In short:**\n- `for` → known number of repetitions (lists, ranges, `range`)\n- `while` → repetition conditioned on something only known at runtime\n\nIf you want to practice this, there is a Conditionals quiz available in the **Quiz** tab — it reinforces this kind of control-flow reasoning well 😉",
    timestamp: iso(29),
  },
];

const funcoesMessages: HistoryMessage[] = [
  {
    role: "user",
    content: "How do I declare a function in Python that takes two numbers and returns their sum?",
    timestamp: iso(1500),
  },
  {
    role: "assistant",
    content:
      "Like this:\n\n```python\ndef add(a, b):\n    return a + b\n\nresult = add(3, 4)\nprint(result)  # 7\n```\n\nThe `def` keyword starts the function, `add` is the name, `(a, b)` are the parameters, and `return` sends the computed value back to whoever called the function.",
    timestamp: iso(1498),
  },
];

const variaveisMessages: HistoryMessage[] = [
  {
    role: "user",
    content: "Why did my code fail when I tried to add '5' + 3 in Python?",
    timestamp: iso(4200),
  },
  {
    role: "assistant",
    content:
      "Because `'5'` is a **string** (text) and `3` is an **integer** — Python doesn't add different types automatically. You need to convert one of them:\n\n```python\nresult = int('5') + 3\nprint(result)  # 8\n```\n\nThis is a classic error called `TypeError`, very common when data comes from an `input()`, which always returns a string.",
    timestamp: iso(4197),
  },
];

export const chatSessions: ChatSession[] = [
  {
    sessionId: CHAT_SESSION_LOOPS_ID,
    title: "Difference between for and while",
    lastActivityAt: iso(29),
  },
  {
    sessionId: CHAT_SESSION_FUNCOES_ID,
    title: "How to declare a function in Python",
    lastActivityAt: iso(1498),
  },
  {
    sessionId: CHAT_SESSION_VARIAVEIS_ID,
    title: "Type error when adding variables",
    lastActivityAt: iso(4197),
  },
];

export const chatHistoryBySession: Record<string, ChatHistoryDetail> = {
  [CHAT_SESSION_LOOPS_ID]: {
    userId: STUDENT_USER_ID,
    sessionId: CHAT_SESSION_LOOPS_ID,
    title: "Difference between for and while",
    messages: loopsMessages,
  },
  [CHAT_SESSION_FUNCOES_ID]: {
    userId: STUDENT_USER_ID,
    sessionId: CHAT_SESSION_FUNCOES_ID,
    title: "How to declare a function in Python",
    messages: funcoesMessages,
  },
  [CHAT_SESSION_VARIAVEIS_ID]: {
    userId: STUDENT_USER_ID,
    sessionId: CHAT_SESSION_VARIAVEIS_ID,
    title: "Type error when adding variables",
    messages: variaveisMessages,
  },
};

export const CANNED_BOT_REPLY =
  "Great question! Let's think step by step: first identify what the logic needs to check, then choose the right control structure (conditional, loop or function) and test it with a small example before generalizing. If you want, send me the piece of code you've already tried to write.";
