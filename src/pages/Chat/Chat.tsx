import { useState, useEffect } from "react";
import { ChevronLeft, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-Auth";
import { useNavigate } from "react-router-dom";
import { ChatMessages } from "@/components/components/Bot/ChatMessages";
import { LevelStep } from "@/components/components/Bot/LevelStep";
import { CategoryStep } from "@/components/components/Bot/CategoryStep";
import { SubsubjectStep } from "@/components/components/Bot/SubsubjectStepProps";
import { QuestionsDisplay } from "@/components/components/Bot/QuestionDisplay";
import { ChatInput } from "@/components/components/Input/ChatInput";
import { Header } from "@/components/components/Header/Header";
import { rasaService } from "@/services/api/api_rasa";
import { Question } from "@/components/components/Bot/Question";

interface ChatMsg { role: "user" | "assistant"; content: string; }

export function Chat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [step, setStep] = useState<
    "levels" | "categories" | "subsubjects" | "questions" | "results"
  >("levels");

  const [categoryButtons, setCategoryButtons] = useState<any[]>([]);
  const [subsubjectButtons, setSubsubjectButtons] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [resultData, setResultData] = useState<any>(null);

  const [inputText, setInputText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const userName = user?.name || "Usuário";

  useEffect(() => {
    setMessages([{ role: "assistant", content: "Olá! Escolha seu nível abaixo 👇" }]);
  }, []);

  // Envia mensagem digitada
  const sendMessage = async (message: string) => {
    if (!message.trim()) return;
    setMessages((m) => [...m, { role: "user", content: message }]);
    setInputText("");
    try {
      const res = await rasaService.sendMessage(message);
      setMessages((m) => [...m, { role: "assistant", content: res.response }]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { role: "assistant", content: "Erro no chat." }]);
    }
  };

  const handleLevelNext = (btns: any[], text: string) => {
    setMessages((m) => [...m, { role: "assistant", content: text }]);
    if (btns.length) {
      setCategoryButtons(btns);
      setStep("categories");
    }
  };

  const handleCategoryNext = (btns: any[], text: string) => {
    setMessages((m) => [...m, { role: "assistant", content: text }]);
    if (btns.length) {
      setSubsubjectButtons(btns);
      setStep("subsubjects");
    }
  };

  const handleSubsubjectNext = (qs: Question[], text: string) => {
    setMessages((m) => [...m, { role: "assistant", content: text }]);
    if (qs.length) {
      setQuestions(qs);
      setStep("questions");
    }
  };

  const handleSubmitAnswers = async (answers: string[]) => {
    answers.forEach((ans) =>
      setMessages((m) => [...m, { role: "user", content: ans }])
    );
    try {
      const res = await rasaService.verificarRespostas(answers);
      setMessages((m) => [...m, { role: "assistant", content: res.message }]);
      setResultData(res);
      setStep("results");
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Erro ao verificar respostas." },
      ]);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full">
      {/* Header */}
      <div className="absolute bg-[#141414] w-full flex justify-between border-b border-neutral-800 px-8 py-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/")}
        >
          <ChevronLeft />
        </Button>

        <p className="text-white text-xl font-semibold">CHAT SAEL</p>

        {user && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMenuOpen(true)}
          >
            <PanelRightOpen />
          </Button>
        )}
      </div>

      {/* Side Header Menu */}
      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      {/* Chat body */}
      <div className="flex-1 w-full max-w-2xl mx-auto pt-24 pb-32">
        <ChatMessages messages={messages} userName={userName} />

        {step === "levels" && <LevelStep onNext={handleLevelNext} />}
        {step === "categories" && (
          <CategoryStep
            buttons={categoryButtons}
            onNext={handleCategoryNext}
          />
        )}
        {step === "subsubjects" && (
          <SubsubjectStep
            buttons={subsubjectButtons}
            onNext={handleSubsubjectNext}
          />
        )}
        {step === "questions" && (
          <QuestionsDisplay
            questions={questions}
            onSubmitAnswers={handleSubmitAnswers}
          />
        )}
        {step === "results" && resultData && (
          <div className="mt-6 p-4 bg-gray-800 rounded">
            <p className="text-white font-semibold">
              Acertos: {resultData.totalCorrectAnswers}
            </p>
            <p className="text-white font-semibold">
              Erros: {resultData.totalWrongAnswers}
            </p>
          </div>
        )}
      </div>

      {/* Chat input */}
      <div className="w-full max-w-2xl fixed bottom-0 left-0 right-0 p-4 bg-[#141414]">
        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          sendMessage={sendMessage}
        />
      </div>
    </div>
  );
}