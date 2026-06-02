import { useState } from "react";
import { Question } from "@/features/quiz/types";
import { formatTitle } from "@/shared/lib/formatText";
import { ButtonData } from "@/features/quiz/components/CategoryStep";
import { quizService, VerifyQuizResponse } from "@/features/quiz/api/quizApi";
import { chatApi } from "@/features/chat/api/chatApi";

type QuizStep = "initial" | "levels" | "categories" | "subsubjects" | "questions" | "results";
type AppMode = "none" | "quiz" | "chat";

export interface ChatMsg {
  id: string;
  text: string;
  sender: "user" | "bot";
  type: "text" | "typing";
}

interface useQuizFlowProps {
  userId: string;
}

export function useQuizFlow({ userId }: useQuizFlowProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [step, setStep] = useState<QuizStep>("initial");
  const [mode, setMode] = useState<AppMode>("none");

  const [categoryButtons, setCategoryButtons] = useState<ButtonData[]>([]);
  const [subsubjectButtons, setSubsubjectButtons] = useState<ButtonData[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [resultData, setResultData] = useState<VerifyQuizResponse | null>(null);

  const [typing, setTyping] = useState(false);
  const [greetingDone, setGreetingDone] = useState(false);
  const [showLevels, setShowLevels] = useState(false);
  const [inputText, setInputText] = useState("");
  const [fakeTypingDelay, setFakeTypingDelay] = useState(false);

  const [previousQuestions, setPreviousQuestions] = useState<Question[][]>([]);
  const [previousResults, setPreviousResults] = useState<VerifyQuizResponse[]>([]);

  function addMessage(text: string, sender: "user" | "bot", type: "text" | "typing" = "text") {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text,
        sender,
        type,
      },
    ]);
  }

  function resetToInitial() {
    setMessages([]);
    setPreviousQuestions([]);
    setPreviousResults([]);
    setGreetingDone(true);
    setMode("none");
    setStep("initial");
    setShowLevels(false);
    setSessionId(null);
  }

  function handleInitialChoice(choice: AppMode) {
    setMessages([]);
    setPreviousQuestions([]);
    setPreviousResults([]);
    setMode(choice);

    if (choice === "quiz") {
      setStep("levels");
      setShowLevels(true);
    } else {
      addMessage("Vamos conversar, sobre o que quer falar?", "bot");
    }
    setGreetingDone(true);
  }

  function handleLevelNext(btns: ButtonData[], nivel: string) {
    addMessage(formatTitle(nivel), "user");
    addMessage("Agora escolha um assunto para praticar:", "bot");
    setCategoryButtons(btns);
    setStep("categories");
    setShowLevels(false);
  }

  function handleCategoryNext(btns: ButtonData[], categoria: string) {
    addMessage(formatTitle(categoria), "user");
    addMessage(`Escolha um tópico dentro de ${formatTitle(categoria)}:`, "bot");
    setSubsubjectButtons(btns);
    setStep("subsubjects");
  }

  function handleSubsubjectNext(qs: Question[], subtopico: string) {
    addMessage(formatTitle(subtopico), "user");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      addMessage("Suas perguntas estão prontas:", "bot");
      setQuestions(qs);
      setStep("questions");
    }, 1200);
  }

  async function handleSubmitAnswers(answers: string[]) {
    addMessage(`Respostas enviadas: ${answers.join(", ")}`, "user");
    setTyping(true);

    try {
      const result = await quizService.verifyQuiz(answers);
      setResultData(result);

      if (questions.length > 0) {
        setPreviousQuestions((prev) => [...prev, questions]);
        setPreviousResults((prev) => [...prev, result as any]);
      }

      setStep("results");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message ?? "Erro ao verificar respostas.";
      addMessage(errorMsg, "bot");
    } finally {
      setTyping(false);
    }
  }

  async function sendMessage(message: string) {
    if (!message.trim()) return;

    addMessage(message, "user");

    setTyping(true);
    setFakeTypingDelay(true);

    try {
      const res = await chatApi.askTutor(message, userId, sessionId || undefined);

      if (res.sessionId) {
        setSessionId(res.sessionId);
      }

      setTimeout(() => {
        addMessage(res.responses[0]?.text || "Desculpe, não entendi.", "bot");
        setTyping(false);
        setFakeTypingDelay(false);
      }, 1200);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Erro no chat.";
      addMessage(errorMsg, "bot");
      setTyping(false);
      setFakeTypingDelay(false);
    }
  }

  return {
    messages,
    setMessages,
    step,
    mode,
    setMode,
    sessionId,
    setSessionId,
    typing,
    greetingDone,
    showLevels,
    inputText,
    fakeTypingDelay,
    categoryButtons,
    subsubjectButtons,
    questions,
    resultData,
    previousQuestions,
    previousResults,
    setInputText,
    setGreetingDone,
    setShowLevels,
    handleInitialChoice,
    handleLevelNext,
    handleCategoryNext,
    handleSubsubjectNext,
    handleSubmitAnswers,
    resetToInitial,
    sendMessage,
    setPreviousQuestions,
    setPreviousResults,
  };
}
