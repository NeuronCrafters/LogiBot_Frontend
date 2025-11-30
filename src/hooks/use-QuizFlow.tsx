import { useState } from "react";
import { Question } from "@/@types/QuestionType";
import { formatTitle } from "@/utils/formatText";
import { ButtonData } from "@/components/components/Bot/Quiz/CategoryStep";
import { quizService, VerifyQuizResponse } from "@/services/api/api_quiz";
import { rasaService } from "@/services/api/api_rasa";
import { usePersistedArray } from "@/hooks/use-PersistedArray";

type QuizStep = "initial" | "levels" | "categories" | "subsubjects" | "questions" | "results";
type AppMode = "none" | "quiz" | "chat";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface useQuizFlowProps {
  userId: string;
}

export function useQuizFlow({ userId }: useQuizFlowProps) {

  const {
    state: messages,
    push: pushMessage,
    clear: clearMessages,
  } = usePersistedArray<ChatMsg>("LOGIBOT_MESSAGES", []);

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

  function resetToInitial() {
    clearMessages();
    setPreviousQuestions([]);
    setPreviousResults([]);
    setGreetingDone(true);
    setMode("none");
    setStep("initial");
    setShowLevels(false);
  }

  function handleInitialChoice(choice: AppMode) {
    clearMessages();
    setPreviousQuestions([]);
    setPreviousResults([]);
    setMode(choice);

    if (choice === "quiz") {
      setStep("levels");
      setShowLevels(true);
    } else {
      pushMessage({
        role: "assistant",
        content: "Vamos conversar, sobre o que quer falar?",
      });
    }
    setGreetingDone(true);
  }

  function handleLevelNext(btns: ButtonData[], nivel: string) {
    pushMessage({ role: "user", content: formatTitle(nivel) });
    pushMessage({ role: "assistant", content: "Agora escolha um assunto para praticar:" });
    setCategoryButtons(btns);
    setStep("categories");
    setShowLevels(false);
  }

  function handleCategoryNext(btns: ButtonData[], categoria: string) {
    pushMessage({ role: "user", content: formatTitle(categoria) });
    pushMessage({ role: "assistant", content: `Escolha um tópico dentro de ${formatTitle(categoria)}:` });
    setSubsubjectButtons(btns);
    setStep("subsubjects");
  }

  function handleSubsubjectNext(qs: Question[], subtopico: string) {
    pushMessage({ role: "user", content: formatTitle(subtopico) });
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      pushMessage({ role: "assistant", content: "Suas perguntas estão prontas:" });
      setQuestions(qs);
      setStep("questions");
    }, 1200);
  }

  async function handleSubmitAnswers(answers: string[]) {
    pushMessage({ role: "user", content: `Respostas enviadas: ${answers.join(", ")}` });
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
      pushMessage({ role: "assistant", content: errorMsg });
    } finally {
      setTyping(false);
    }
  }

  async function sendMessage(message: string) {
    if (!message.trim()) return;
    pushMessage({ role: "user", content: message });
    setTyping(true);
    setFakeTypingDelay(true);

    try {
      const res = await rasaService.perguntar(message, userId);
      setTimeout(() => {
        pushMessage({
          role: "assistant",
          content: res.responses[0]?.text || "Desculpe, não entendi.",
        });
        setTyping(false);
        setFakeTypingDelay(false);
      }, 1200);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Erro no chat.";
      pushMessage({ role: "assistant", content: errorMsg });
      setTyping(false);
      setFakeTypingDelay(false);
    }
  }

  return {
    messages,
    step,
    mode,
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