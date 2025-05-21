import { useEffect } from 'react';
import { RefreshCcw } from 'lucide-react';
import { User } from '@/contexts/AuthContext';
import { BotGreetingMessage } from '@/components/components/Bot/Chat/BotGreetingMessage';
import { InitialChoiceStep } from '@/components/components/Bot/InitialChoiceStep';
import { ChatMessages } from '@/components/components/Bot/ChatMessages';
import { LevelStep } from '@/components/components/Bot/Quiz/LevelStep';
import { CategoryStep } from '@/components/components/Bot/Quiz/CategoryStep';
import { SubsubjectStep } from '@/components/components/Bot/Quiz/SubsubjectStep';
import { QuestionsDisplay } from '@/components/components/Bot/Quiz/QuestionDisplay';
import { ResultDisplay } from '@/components/components/Bot/Quiz/ResultDisplay';
import { ChatInput } from '@/components/components/Input/ChatInput';
import { ButtonBotAnswer } from '@/components/components/Button/ButtonBotAnswer';
import { useQuizFlow } from '@/hooks/use-QuizFlow';

interface StudentChatContentProps {
  user: User;
}

const StudentChatContent: React.FC<StudentChatContentProps> = ({ user }) => {
  const userId = user?._id || "user";
  const userName = user?.name || "Usuário";

  const {
    messages,
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
    setPreviousQuestions,
    setPreviousResults,
    handleInitialChoice,
    handleLevelNext,
    handleCategoryNext,
    handleSubsubjectNext,
    handleSubmitAnswers,
    handleRestart,
    sendMessage,
    setStep,
    setShowLevels,
  } = useQuizFlow({ userId });

  return (
    <>
      <div className="flex-1 w-full max-w-2xl mx-auto pt-24 pb-40 px-2">
        {!greetingDone && <BotGreetingMessage onFinish={() => setGreetingDone(true)} />}

        {greetingDone && mode === "none" && <InitialChoiceStep onChoose={handleInitialChoice} />}

        {mode !== "none" && (
          <div className="flex justify-center mt-2 mb-4">
            <ButtonBotAnswer
              text={<span className="flex items-center gap-2"><RefreshCcw className="w-4 h-4" />Trocar modo (quiz/conversa)</span>}
              onClick={handleRestart}
              isSubmit
            />
          </div>
        )}

        {greetingDone && mode !== "none" && (
          <>
            <ChatMessages messages={messages} userName={userName} userId={userId} />

            {mode === "quiz" && showLevels && step === "levels" && (
              <div className="mt-4"><LevelStep onNext={handleLevelNext} /></div>
            )}

            {mode === "quiz" && step === "categories" && (
              <div className="mt-4"><CategoryStep buttons={categoryButtons} onNext={handleCategoryNext} /></div>
            )}

            {mode === "quiz" && step === "subsubjects" && (
              <div className="mt-4"><SubsubjectStep buttons={subsubjectButtons} onNext={handleSubsubjectNext} /></div>
            )}

            {mode === "quiz" && step === "questions" && (
              <div className="mt-4"><QuestionsDisplay questions={questions} onSubmitAnswers={handleSubmitAnswers} /></div>
            )}

            {mode === "quiz" && step === "results" && resultData && (
              <div className="mt-6 space-y-6">
                <ResultDisplay
                  detalhes={resultData.detalhes}
                  totalCorrectAnswers={resultData.totalCorrectAnswers}
                  totalWrongAnswers={resultData.totalWrongAnswers}
                />
                <div className="flex justify-center">
                  <ButtonBotAnswer
                    text="Continuar praticando"
                    isSubmit
                    onClick={() => {
                      if (questions.length > 0 && resultData) {
                        setPreviousQuestions((prev) => [...prev, questions]);
                        setPreviousResults((prev) => [...prev, resultData]);
                      }
                      setStep("levels");
                      setShowLevels(true);
                      setGreetingDone(true);
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="w-full max-w-2xl fixed bottom-0 left-0 right-0 px-4 pb-6 z-10">
        {greetingDone && mode === "chat" && (
          <ChatInput inputText={inputText} setInputText={setInputText} sendMessage={sendMessage} />
        )}
      </div>
    </>
  );
};

export default StudentChatContent;