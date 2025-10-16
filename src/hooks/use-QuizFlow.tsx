import { useState } from "react";
import { Question } from "@/@types/QuestionType";
import { formatTitle } from "@/utils/formatText";
import { ButtonData } from "@/components/components/Bot/Quiz/CategoryStep";
import { quizService, VerifyQuizResponse } from "@/services/api/api_quiz";
import { rasaService } from "@/services/api/api_rasa"; // Mantido para o modo "chat"
import { usePersistedArray } from "@/hooks/use-PersistedArray";

// Tipos para clareza
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
  // --- Estados do Hook ---

  const {
    state: messages,
    push: pushMessage,
    clear: clearMessages,
  } = usePersistedArray<ChatMsg>("LOGIBOT_MESSAGES", []);

  // Estados de fluxo e modo
  const [step, setStep] = useState<QuizStep>("initial");
  const [mode, setMode] = useState<AppMode>("none");

  // Estados de dados para os componentes do quiz
  const [categoryButtons, setCategoryButtons] = useState<ButtonData[]>([]);
  const [subsubjectButtons, setSubsubjectButtons] = useState<ButtonData[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [resultData, setResultData] = useState<VerifyQuizResponse | null>(null);

  // Estados para controle da UI
  const [typing, setTyping] = useState(false);
  const [greetingDone, setGreetingDone] = useState(false);
  const [showLevels, setShowLevels] = useState(false);
  const [inputText, setInputText] = useState("");
  const [fakeTypingDelay, setFakeTypingDelay] = useState(false); // Mantido para o chat

  // Estados para histórico (se aplicável)
  const [previousQuestions, setPreviousQuestions] = useState<Question[][]>([]);
  const [previousResults, setPreviousResults] = useState<VerifyQuizResponse[]>([]);

  // --- Funções de Controle de Fluxo ---

  /**
   * Reseta o estado para a tela de escolha inicial (Quiz ou Chat).
   */
  function resetToInitial() {
    clearMessages();
    setPreviousQuestions([]);
    setPreviousResults([]);
    setGreetingDone(true); // Mantém a saudação como concluída
    setMode("none");
    setStep("initial");
    setShowLevels(false);
  }

  /**
   * Inicia o fluxo de Quiz ou de Chat com base na escolha do usuário.
   */
  function handleInitialChoice(choice: AppMode) {
    clearMessages();
    setPreviousQuestions([]);
    setPreviousResults([]);
    setMode(choice);

    if (choice === "quiz") {
      setStep("levels");
      setShowLevels(true); // Mostra a seleção de nível
    } else {
      // Lógica para iniciar o modo chat
      pushMessage({
        role: "assistant",
        content: "Vamos conversar, sobre o que quer falar?",
      });
    }
    setGreetingDone(true);
  }

  /**
   * Chamado pelo LevelStep após o usuário selecionar um nível.
   * Recebe a lista de categorias da API e avança para o próximo passo.
   */
  function handleLevelNext(btns: ButtonData[], nivel: string) {
    pushMessage({ role: "user", content: formatTitle(nivel) });
    pushMessage({ role: "assistant", content: "Agora escolha um assunto para praticar:" });
    setCategoryButtons(btns);
    setStep("categories");
    setShowLevels(false); // Esconde a seleção de nível
  }

  /**
   * Chamado pelo CategoryStep após o usuário selecionar uma categoria.
   * Recebe a lista de subtópicos e avança para o próximo passo.
   */
  function handleCategoryNext(btns: ButtonData[], categoria: string) {
    pushMessage({ role: "user", content: formatTitle(categoria) });
    pushMessage({ role: "assistant", content: `Escolha um tópico dentro de ${formatTitle(categoria)}:` });
    setSubsubjectButtons(btns);
    setStep("subsubjects");
  }

  /**
   * Chamado pelo SubsubjectStep após o usuário selecionar um subtópico.
   * Recebe as perguntas do quiz e avança para a tela de questões.
   */
  function handleSubsubjectNext(qs: Question[], subtopico: string) {
    pushMessage({ role: "user", content: formatTitle(subtopico) });
    setTyping(true);
    // Simula um delay para a mensagem "Gerando suas perguntas..." aparecer
    setTimeout(() => {
      setTyping(false);
      pushMessage({ role: "assistant", content: "Suas perguntas estão prontas:" });
      setQuestions(qs);
      setStep("questions");
    }, 1200);
  }

  /**
   * Chamado pelo QuestionsDisplay quando o usuário envia suas respostas.
   * Envia para a API de verificação e exibe os resultados.
   */
  async function handleSubmitAnswers(answers: string[]) {
    pushMessage({ role: "user", content: `Respostas enviadas: ${answers.join(", ")}` });
    setTyping(true);

    try {
      // MUDANÇA PRINCIPAL: Chama o novo quizService em vez do rasaService
      const result = await quizService.verifyQuiz(answers);
      setResultData(result);

      if (questions.length > 0) {
        setPreviousQuestions((prev) => [...prev, questions]);
        // A interface do 'result' é diferente da antiga, mas podemos adaptar
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

  /**
   * Lógica para o modo CHAT. Permanece usando o rasaService.
   */
  async function sendMessage(message: string) {
    if (!message.trim()) return;
    pushMessage({ role: "user", content: message });
    setTyping(true);
    setFakeTypingDelay(true);

    try {
      // Mantém a chamada ao serviço antigo para o modo chat
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
    // Estados para a UI
    messages,
    step,
    mode,
    typing,
    greetingDone,
    showLevels,
    inputText,
    fakeTypingDelay,

    // Dados para os componentes
    categoryButtons,
    subsubjectButtons,
    questions,
    resultData,
    previousQuestions,
    previousResults,

    // Funções de controle
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