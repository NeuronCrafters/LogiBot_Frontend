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
import { motion, AnimatePresence } from 'framer-motion';

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
    resetToInitial,
    sendMessage,
    setStep,
    setShowLevels,
  } = useQuizFlow({ userId });

  return (
    <>
      <div className="flex-1 w-full max-w-2xl mx-auto pt-24 pb-40 px-2">
        <AnimatePresence mode="wait">
          {!greetingDone && (
            <motion.div
              key="greeting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <BotGreetingMessage onFinish={() => setGreetingDone(true)} />
            </motion.div>
          )}

          {greetingDone && mode === "none" && (
            <motion.div
              key="initial-choice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <InitialChoiceStep onChoose={handleInitialChoice} />
            </motion.div>
          )}
        </AnimatePresence>

        {mode !== "none" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center mt-2 mb-4"
          >
            <ButtonBotAnswer
              text={
                <span className="flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4" />
                  Voltar à escolha inicial
                </span>
              }
              onClick={resetToInitial}
              isSubmit
            />
          </motion.div>
        )}

        {greetingDone && mode !== "none" && (
          <>
            <ChatMessages messages={messages} userName={userName} userId={userId} />

            <AnimatePresence mode="wait">
              {mode === "quiz" && showLevels && step === "levels" && (
                <motion.div
                  key="levels"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="mt-4"
                >
                  <LevelStep onNext={handleLevelNext} />
                </motion.div>
              )}

              {mode === "quiz" && step === "categories" && (
                <motion.div
                  key="categories"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="mt-4"
                >
                  <CategoryStep buttons={categoryButtons} onNext={handleCategoryNext} />
                </motion.div>
              )}

              {mode === "quiz" && step === "subsubjects" && (
                <motion.div
                  key="subsubjects"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="mt-4"
                >
                  <SubsubjectStep buttons={subsubjectButtons} onNext={handleSubsubjectNext} />
                </motion.div>
              )}

              {mode === "quiz" && step === "questions" && (
                <motion.div
                  key="questions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="mt-4"
                >
                  <QuestionsDisplay questions={questions} onSubmitAnswers={handleSubmitAnswers} />
                </motion.div>
              )}

              {mode === "quiz" && step === "results" && resultData && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="mt-6 space-y-6"
                >
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
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <AnimatePresence mode="wait">
        {greetingDone && mode === "chat" && (
          <motion.div
            key="chat-input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.4,
              ease: "easeInOut"
            }}
            className="w-full max-w-2xl fixed bottom-0 left-0 right-0 px-4 pb-6 z-10"
          >
            <ChatInput inputText={inputText} setInputText={setInputText} sendMessage={sendMessage} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StudentChatContent;
