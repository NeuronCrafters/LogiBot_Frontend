import { useAuth } from "@/hooks/use-Auth";
import { useQuizFlow } from "@/hooks/UseQuizFlow";
import { useEffect } from "react";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Header } from "@/components/components/Header/Header";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { RefreshCcw } from "lucide-react";
import { BotGreetingMessage } from "@/components/components/Bot/Chat/BotGreetingMessage";
import { InitialChoiceStep } from "@/components/components/Bot/InitialChoiceStep";
import { ChatMessages } from "@/components/components/Bot/ChatMessages";
import { TypingBubble } from "@/components/components/Bot/Chat/TypingBubble";
import { LevelStep } from "@/components/components/Bot/Quiz/LevelStep";
import { CategoryStep } from "@/components/components/Bot/Quiz/CategoryStep";
import { SubsubjectStep } from "@/components/components/Bot/Quiz/SubsubjectStep";
import { QuestionsDisplay } from "@/components/components/Bot/Quiz/QuestionDisplay";
import { ResultDisplay } from "@/components/components/Bot/Quiz/ResultDisplay";
import { ChatInput } from "@/components/components/Input/ChatInput";

export function Chat() {
  const { user } = useAuth();
  const userId = user?._id || "user";
  const userName = user?.name || "Usuário";

  const {
    messages,
    typing,
    fakeTypingDelay,
    greetingDone,
    setGreetingDone,
    menuOpen,
    setMenuOpen,
    inputText,
    setInputText,
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
  } = useQuizFlow({ userId });

  return (
    <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full">
      {/* Top bar */}
      <div className="absolute bg-[#141414] w-full flex items-center gap-4 border-b border-neutral-800 px-8 py-4 z-10">
        <Typograph
          text="Chat SAEL"
          colorText="text-white"
          variant="text2"
          weight="bold"
          fontFamily="poppins"
        />
        {user && (
          <div className="ml-auto">
            <Button
              onClick={() => setMenuOpen(true)}
              className="p-0 flex items-center justify-center"
            >
              <div className="rainbow-avatar w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center">
                <Avatar
                  seed={user._id}
                  backgroundColor="#141414"
                  className="w-full h-full rounded-full"
                />
              </div>
            </Button>
          </div>
        )}
      </div>

      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      {/* Chat Body */}
      <div className="flex-1 w-full max-w-2xl mx-auto pt-24 pb-40 px-2">
        {!greetingDone && (
          <BotGreetingMessage onFinish={() => setGreetingDone(true)} />
        )}

        {greetingDone && mode === "none" && (
          <InitialChoiceStep onChoose={handleInitialChoice} />
        )}

        {mode !== "none" && (
          <div className="flex justify-center mt-2 mb-4">
            <Button
              onClick={handleRestart}
              className="text-sm bg-gray-800 hover:bg-gray-700 text-white px-4 py-1.5 rounded-xl flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Trocar modo (quiz/conversa)
            </Button>
          </div>
        )}

        {greetingDone && mode !== "none" && (
          <ChatMessages messages={messages} userName={userName} userId={userId} />
        )}

        {greetingDone && mode === "chat" && typing && fakeTypingDelay && (
          <TypingBubble onDone={() => { }} text="Só um momento..." />
        )}

        {mode === "quiz" && showLevels && step === "levels" && (
          <LevelStep onNext={handleLevelNext} />
        )}
        {mode === "quiz" && step === "categories" && (
          <CategoryStep buttons={categoryButtons} onNext={handleCategoryNext} />
        )}
        {mode === "quiz" && step === "subsubjects" && (
          <SubsubjectStep
            buttons={subsubjectButtons}
            onNext={handleSubsubjectNext}
          />
        )}
        {mode === "quiz" && step === "questions" && (
          <QuestionsDisplay
            questions={questions}
            onSubmitAnswers={handleSubmitAnswers}
          />
        )}

        {mode === "quiz" && step === "results" && resultData && (
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

      {/* Chat Input */}
      <div className="w-full max-w-2xl fixed bottom-0 left-0 right-0 px-4 pb-6 z-10">
        {greetingDone && mode === "chat" && (
          <ChatInput
            inputText={inputText}
            setInputText={setInputText}
            sendMessage={sendMessage}
          />
        )}
      </div>
    </div>
  );
}
