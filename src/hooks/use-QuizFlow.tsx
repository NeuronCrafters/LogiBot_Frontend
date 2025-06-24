import { useState, useEffect } from "react";
import { rasaService } from "@/services/api/api_rasa";
import { Question } from "@/@types/QuestionType";
import { formatTitle } from "@/utils/formatText";
import { ButtonData } from "@/components/components/Bot/Quiz/CategoryStep";
import type { QuizResult } from "@/@types/QuizResult";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface useQuizFlowProps {
  userId: string;
}

export function useQuizFlow({ userId }: useQuizFlowProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [step, setStep] = useState<
    "initial" | "levels" | "categories" | "subsubjects" | "questions" | "results"
  >("initial");
  const [mode, setMode] = useState<"none" | "quiz" | "chat">("none");
  const [categoryButtons, setCategoryButtons] = useState<any[]>([]);
  const [subsubjectButtons, setSubsubjectButtons] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [resultData, setResultData] = useState<QuizResult | null>(null);
  const [typing, setTyping] = useState(false);
  const [showLevels, setShowLevels] = useState(false);
  const [pendingLevelIntro, setPendingLevelIntro] = useState(false);
  const [greetingDone, setGreetingDone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [fakeTypingDelay, setFakeTypingDelay] = useState(false);

  const [previousQuestions, setPreviousQuestions] = useState<Question[][]>([]);
  const [previousResults, setPreviousResults] = useState<QuizResult[]>([]);

  function resetToInitial() {
    setMessages([]);
    setPreviousQuestions([]);
    setPreviousResults([]);
    setGreetingDone(true);
    setMode("none");
    setStep("initial");
    setShowLevels(false);
  }

  async function sendMessage(message: string) {
    if (!message.trim()) return;
    setMessages((m) => [...m, { role: "user", content: message }]);
    setTyping(true);
    setFakeTypingDelay(true);
    try {
      const res = await rasaService.perguntar(message, userId);
      setTimeout(() => {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: res.responses[0]?.text || "..." },
        ]);
        setTyping(false);
        setFakeTypingDelay(false);
      }, 1200);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Erro no chat.";
      console.error("Erro no chat:", err.response?.status, errorMsg);
      setMessages((m) => [...m, { role: "assistant", content: errorMsg }]);
      setTyping(false);
      setFakeTypingDelay(false);
    }
  }

  async function handleInitialChoice(choice: "quiz" | "chat") {
    setMessages([]);
    setPreviousQuestions([]);
    setPreviousResults([]);
    if (choice === "quiz") {
      setPendingLevelIntro(true);
      setStep("levels");
      setMode("quiz");
    } else {
      setMode("chat");
      try {
        await rasaService.conversar();
        setMessages([
          { role: "assistant", content: "Vamos conversar, sobre o que quer falar?" },
        ]);
      } catch (e) {
        console.error("Erro ao iniciar modo conversa:", e);
      }
    }
    setGreetingDone(true);
  }

  function handleLevelNext(btns: any[], nivel: string) {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: formatTitle(nivel) },
      { role: "assistant", content: "Agora escolha um assunto para praticar:" },
    ]);
    setCategoryButtons(btns);
    setStep("categories");
  }

  function handleCategoryNext(btns: ButtonData[], payload: string) {
    let categoria = "";
    try {
      const idx = payload.indexOf("{");
      if (idx >= 0) {
        const parsed = JSON.parse(payload.slice(idx));
        categoria = parsed.categoria || "";
      }
    } catch (e) {
      console.error("Erro ao extrair categoria:", e);
    }
    if (!categoria) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: formatTitle(categoria) },
      {
        role: "assistant",
        content: `Escolha um tópico dentro de ${formatTitle(categoria)}:`,
      },
    ]);
    setSubsubjectButtons(btns);
    setStep("subsubjects");
  }

  function handleSubsubjectNext(qs: Question[], subtopico: string) {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: formatTitle(subtopico) },
      { role: "assistant", content: "Gerando suas perguntas..." },
    ]);
    setSubsubjectButtons([]);
    setCategoryButtons([]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Suas perguntas estão prontas:" },
      ]);
      setQuestions(qs);
      setStep("questions");
    }, 1500);
  }

  async function handleSubmitAnswers(answers: string[]) {
    // converte para A–E
    const convertKey = (a: string) => {
      const p = a.trim().toLowerCase().charAt(0);
      return ["a", "b", "c", "d", "e"].includes(p) ? p.toUpperCase() : "?";
    };
    const letters = answers.map(convertKey);

    setMessages((m) => [
      ...m,
      { role: "user", content: `Respostas escolhidas: ${letters.join(", ")}` },
    ]);

    try {
      const result = await rasaService.verificarRespostas(letters);
      setResultData(result);
      if (questions.length) {
        setPreviousQuestions((prev) => [...prev, questions]);
        setPreviousResults((prev) => [...prev, result]);
      }
      setStep("results");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message ?? "Erro ao verificar respostas.";
      console.error("Erro ao enviar respostas:", err.response?.status, errorMsg);
      setMessages((m) => [...m, { role: "assistant", content: errorMsg }]);
    }
  }

  async function handleRestart() {
    setGreetingDone(true);
    setStep("levels");
    setCategoryButtons([]);
    setSubsubjectButtons([]);
    setQuestions([]);
    setResultData(null);
    setMessages([]);

    if (mode === "quiz") {
      setShowLevels(false);
      setMode("chat");
      try {
        await rasaService.conversar();
        setMessages([
          { role: "assistant", content: "Vamos conversar, sobre o que quer falar?" },
        ]);
      } catch (e) {
        console.error("Erro ao iniciar modo conversa:", e);
      }
    } else {
      setMode("quiz");
      setMessages([{ role: "assistant", content: "Olá! Escolha seu nível abaixo 👇" }]);
      setTimeout(() => setShowLevels(true), 200);
    }
  }

  useEffect(() => {
    if (pendingLevelIntro) {
      const timer = setTimeout(() => {
        setMessages((p) => [
          ...p,
          { role: "assistant", content: "Olá! Escolha seu nível abaixo 👇" },
        ]);
        setTimeout(() => setShowLevels(true), 800);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [pendingLevelIntro]);

  return {
    messages,
    typing,
    fakeTypingDelay,
    greetingDone,
    menuOpen,
    setMenuOpen,
    inputText,
    setInputText,
    setGreetingDone,
    step,
    setStep,
    mode,
    questions,
    resultData,
    previousQuestions,
    previousResults,
    showLevels,
    setShowLevels,
    categoryButtons,
    subsubjectButtons,
    handleInitialChoice,
    handleLevelNext,
    handleCategoryNext,
    handleSubsubjectNext,
    handleSubmitAnswers,
    handleRestart,
    sendMessage,
    setPreviousQuestions,
    setPreviousResults,
    resetToInitial,
  };
}
