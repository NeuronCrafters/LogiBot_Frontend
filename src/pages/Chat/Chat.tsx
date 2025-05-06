import { useState } from "react";
import { AlignJustify, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-Auth";
import { useNavigate } from "react-router-dom";
import { ChatMessages } from "@/components/components/Bot/ChatMessages";
import { LevelStep } from "@/components/components/Bot/LevelStep";
import { CategoryStep } from "@/components/components/Bot/CategoryStep";
import { SubsubjectStep } from "@/components/components/Bot/SubsubjectStep";
import { QuestionsDisplay } from "@/components/components/Bot/QuestionDisplay";
import { ChatInput } from "@/components/components/Input/ChatInput";
import { Header } from "@/components/components/Header/Header";
import { rasaService } from "@/services/api/api_rasa";
import { Question } from "@/components/components/Bot/Question";
import { BotGreetingMessage } from "@/components/components/Bot/BotGreetingMessage";
import { ResultDisplay } from "@/components/components/Bot/ResultDisplay";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [step, setStep] = useState<"levels" | "categories" | "subsubjects" | "questions" | "results">("levels");
  const [categoryButtons, setCategoryButtons] = useState<any[]>([]);
  const [subsubjectButtons, setSubsubjectButtons] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [resultData, setResultData] = useState<any>(null);
  const [inputText, setInputText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [greetingDone, setGreetingDone] = useState(false);
  const [showLevels, setShowLevels] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const userName = user?.name || "Usuário";

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
    setMessages((prev) => [...prev, { role: "assistant", content: text }]);
    if (btns.length) {
      setCategoryButtons(btns);
      setStep("categories");
    }
  };

  const handleCategoryNext = (btns: any[], text: string) => {
    setMessages((prev) => [...prev, { role: "assistant", content: text }]);
    if (btns.length) {
      setSubsubjectButtons(btns);
      setStep("subsubjects");
    }
  };

  const handleSubsubjectNext = (qs: Question[], text: string) => {
    setMessages((prev) => [...prev, { role: "assistant", content: text }]);
    if (qs.length) {
      setQuestions(qs);
      setStep("questions");
    }
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

    answers.forEach((answer, index) => {
      setMessages((m) => [...m, { role: "user", content: `Pergunta ${index + 1}: ${answer}` }]);
    });

    try {
      const res = await rasaService.verificarRespostas(formattedAnswers);
      setMessages((m) => [...m, { role: "assistant", content: res.message }]);
      setResultData(res);
      setStep("results");
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { role: "assistant", content: "Erro ao verificar respostas." }]);
    }
  };

  const handleRestart = () => {
    setStep("levels");
    setCategoryButtons([]);
    setSubsubjectButtons([]);
    setQuestions([]);
    setResultData(null);
    setShowLevels(true);
  };

  return (
    <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full">
      <div className="absolute bg-[#141414] w-full flex justify-between border-b border-neutral-800 px-8 py-4 z-10">
        <Button onClick={() => navigate("/")}> <ChevronLeft stroke="white" /> </Button>
        <p className="text-white text-xl font-semibold">CHAT SAEL</p>
        {user && <Button onClick={() => setMenuOpen(true)}> <AlignJustify stroke="white" /> </Button>}
      </div>

      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      <div className="flex-1 w-full max-w-2xl mx-auto pt-24 pb-40 px-2">
        {!greetingDone && (
          <BotGreetingMessage
            onFinish={(msg) => {
              setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
              setGreetingDone(true);
              setTimeout(() => setShowLevels(true), 800);
            }}
          />
        )}

        {greetingDone && <ChatMessages messages={messages} userName={userName} />}

        {greetingDone && showLevels && step === "levels" && <LevelStep onNext={handleLevelNext} />}
        {step === "categories" && <CategoryStep buttons={categoryButtons} onNext={handleCategoryNext} />}
        {step === "subsubjects" && <SubsubjectStep buttons={subsubjectButtons} onNext={handleSubsubjectNext} />}
        {step === "questions" && <QuestionsDisplay questions={questions} onSubmitAnswers={handleSubmitAnswers} />}

        {step === "results" && resultData && (
          <div className="mt-6 space-y-4">
            <ResultDisplay
              detalhes={resultData.detalhes}
              totalCorrectAnswers={resultData.totalCorrectAnswers}
              totalWrongAnswers={resultData.totalWrongAnswers}
            />
            <div className="flex justify-center">
              <Button
                onClick={handleRestart}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-2xl mt-2 shadow"
              >
                Continuar praticando
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-2xl fixed bottom-0 left-0 right-0 px-4 pb-6 z-10">
        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          sendMessage={sendMessage}
        />
      </div>
    </div>
  );
}
