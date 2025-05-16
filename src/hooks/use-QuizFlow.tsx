import { useState, useEffect } from "react";
import { rasaService } from "@/services/api/api_rasa";
import { Question } from "@/@types/QuestionType";
import { formatTitle } from "@/utils/formatText";
import { ButtonData } from "@/components/components/Bot/Quiz/CategoryStep";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface AnswerDetail {
  level: string;
  subject: string;
  selectedOption: {
    question: string;
    isCorrect: string;
    isSelected: string;
  };
  correctOption?: string;
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  timestamp: string;
}

interface QuizResult {
  detalhes?: { questions?: AnswerDetail[] };
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
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
  const [resultData, setResultData] = useState<QuizResult | null>(null);
  const [typing, setTyping] = useState(false);
  const [showLevels, setShowLevels] = useState(false);
  const [pendingLevelIntro, setPendingLevelIntro] = useState(false);
  const [greetingDone, setGreetingDone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<"none" | "quiz" | "chat">("none");
  const [fakeTypingDelay, setFakeTypingDelay] = useState(false);

  const [previousQuestions, setPreviousQuestions] = useState<Question[][]>([]);
  const [previousResults, setPreviousResults] = useState<QuizResult[]>([]);

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
        setMessages([{ role: "assistant", content: "Vamos conversar, sobre o que quer falar?" }]);
      } catch (e) {
        console.error("Erro ao iniciar modo conversa:", e);
      }
    }
    setGreetingDone(true);
  };

  const handleLevelNext = (btns: any[], nivel: string) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: formatTitle(nivel) },
      { role: "assistant", content: "Agora escolha um assunto para praticar:" },
    ]);
    setCategoryButtons(btns);
    setStep("categories");
  };

  const handleCategoryNext = (btns: ButtonData[], payload: string) => {
    let categoria = "";
    try {
      const jsonStart = payload.indexOf("{");
      if (jsonStart >= 0) {
        const jsonString = payload.slice(jsonStart);
        const parsed = JSON.parse(jsonString);
        categoria = parsed.categoria || "";
      }
    } catch (e) {
      console.error("Erro ao extrair categoria:", e);
    }

    if (!categoria) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: formatTitle(categoria) },
      { role: "assistant", content: `Escolha um tópico dentro de ${formatTitle(categoria)}:` },
    ]);

    setSubsubjectButtons(btns);
    setTimeout(() => {
      setStep("subsubjects");
    }, 100);
  };


  const handleSubsubjectNext = (qs: Question[], subtopico: string) => {
    setMessages((prev) => [
      ...prev,
      { role: "user", content: formatTitle(subtopico) },
      { role: "assistant", content: "Gerando suas perguntas..." },
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
        case "a": return "A";
        case "b": return "B";
        case "c": return "C";
        case "d": return "D";
        case "e": return "E";
        default: return "?";
      }
    };

    const lettersOnly = answers.map(convertToOptionKey);
    const formattedAnswers = answers.map((answer) => `options ${convertToOptionKey(answer)}`);

    setMessages((m) => [...m, { role: "user", content: `Respostas escolhidas: ${lettersOnly.join(", ")}` }]);

    try {
      const res = await rasaService.verificarRespostas(formattedAnswers);
      setMessages((m) => [...m, { role: "assistant", content: res.message }]);

      setPreviousQuestions((prev) => [...prev, questions]);
      setPreviousResults((prev) => [...prev, res]);

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
    setShowLevels(false);
    setPendingLevelIntro(true);
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
  };
}