import { useState, useEffect } from "react";
import { rasaService } from "@/services/api/api_rasa";
import { Question } from "@/@types/QuestionType";
import { formatTitle } from "@/utils/formatText";
import { ButtonData } from "@/components/components/Bot/Quiz/CategoryStep";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface useQuizFlowProps {
  userId: string;
}

export function useQuizFlow({ userId }: useQuizFlowProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [step, setStep] = useState<"levels" | "categories" | "subsubjects" | "questions" | "results">("levels");
  const [categoryButtons, setCategoryButtons] = useState<any[]>([]);
  const [subsubjectButtons, setSubsubjectButtons] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [resultData, setResultData] = useState<any>(null);
  const [typing, setTyping] = useState(false);
  const [showLevels, setShowLevels] = useState(false);
  const [pendingLevelIntro, setPendingLevelIntro] = useState(false);
  const [greetingDone, setGreetingDone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<"none" | "quiz" | "chat">("none");
  const [fakeTypingDelay, setFakeTypingDelay] = useState(false);

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;
    setMessages((m) => [...m, { role: "user", content: message }]);
    setTyping(true);
    setFakeTypingDelay(true);
    try {
      const res = await rasaService.perguntar(message, userId);
      setTimeout(() => {
        setMessages((m) => [...m, { role: "assistant", content: res.responses[0]?.text || "..." }]);
        setTyping(false);
        setFakeTypingDelay(false);
      }, 1200);
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { role: "assistant", content: "Erro no chat." }]);
      setTyping(false);
      setFakeTypingDelay(false);
    }
  };

  const handleInitialChoice = async (choice: "quiz" | "chat") => {
    setMessages([]);
    if (choice === "quiz") {
      setPendingLevelIntro(true);
      setStep("levels");
      setMode("quiz");
    } else {
      setMode("chat");
      try {
        await rasaService.conversar();
        setMessages([{ role: "assistant", content: "Vamos conversar, sobre o que quer falar?" }]);
      } catch (e) {
        console.error("Erro ao iniciar modo conversa:", e);
      }
    }
    setGreetingDone(true);
  };

  const handleLevelNext = (btns: any[], nivel: string) => {
    console.log("🟦 handleLevelNext - nível:", nivel);
    console.log("🟦 handleLevelNext - botões recebidos:", btns);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: formatTitle(nivel) },
      { role: "assistant", content: "Agora escolha um assunto para praticar:" }
    ]);

    setCategoryButtons(btns);
    setStep("categories");
  };



  const handleCategoryNext = (btns: ButtonData[], payload: string) => {
    console.log("📦 Payload recebido no clique do botão:", payload);

    let categoria = "";
    try {
      const jsonStart = payload.indexOf("{");
      if (jsonStart >= 0) {
        const jsonString = payload.slice(jsonStart);
        const parsed = JSON.parse(jsonString);
        categoria = parsed.categoria || "";
      }
    } catch (e) {
      console.error("❌ Erro ao extrair categoria do payload:", payload, e);
    }

    if (!categoria) {
      console.warn("⚠️ Nenhuma categoria encontrada no payload. Ignorando clique.");
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "user", content: formatTitle(categoria) },
      { role: "assistant", content: `Escolha um tópico dentro de ${formatTitle(categoria)}:` }
    ]);

    setSubsubjectButtons(btns);
    setStep("subsubjects");
  };



  const handleSubsubjectNext = (qs: Question[], subtopico: string) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: formatTitle(subtopico) },
      { role: "assistant", content: "Gerando suas perguntas..." }
    ]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, { role: "assistant", content: "Suas perguntas estão prontas:" }]);
      setQuestions(qs);
      setStep("questions");
    }, 1500);
  };


  const handleSubmitAnswers = async (answers: string[]) => {
    const convertToOptionKey = (answer: string) => {
      const prefix = answer.trim().toLowerCase().charAt(0);
      switch (prefix) {
        case "a": return "options A";
        case "b": return "options B";
        case "c": return "options C";
        case "d": return "options D";
        case "e": return "options E";
        default: return "options A";
      }
    };

    const formattedAnswers = answers.map(convertToOptionKey);
    setMessages((m) => [...m, { role: "user", content: `Respostas: ${answers.join(", ")}` }]);

    try {
      const res = await rasaService.verificarRespostas(formattedAnswers);
      setMessages((m) => [...m, { role: "assistant", content: res.message }]);
      setResultData(res);
      setStep("results");
    } catch (err) {
      console.error("Erro ao enviar respostas:", err);
      setMessages((m) => [...m, { role: "assistant", content: "Erro ao verificar respostas." }]);
    }
  };

  const handleRestart = () => {
    setStep("levels");
    setCategoryButtons([]);
    setSubsubjectButtons([]);
    setQuestions([]);
    setResultData(null);
    setMessages([]);
    setShowLevels(false);
    setMode("none");
    setGreetingDone(false);
  };

  useEffect(() => {
    if (pendingLevelIntro) {
      const timer = setTimeout(() => {
        setMessages((prev) => [...prev, { role: "assistant", content: "Olá! Escolha seu nível abaixo 👇" }]);
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
    mode,
    questions,
    resultData,
    showLevels,
    categoryButtons,
    subsubjectButtons,
    handleInitialChoice,
    handleLevelNext,
    handleCategoryNext,
    handleSubsubjectNext,
    handleSubmitAnswers,
    handleRestart,
    sendMessage,
  };
}
