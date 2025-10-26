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
import { useState } from 'react';

interface StudentChatContentProps {
  user: User;
}

const StudentChatContent: React.FC<StudentChatContentProps> = ({ user }) => {
  const userId = user?._id || "user";
  const userName = user?.name || "Usuário";

  const {
    messages,
    step,
    mode,
    questions,
    resultData,
    categoryButtons,
    subsubjectButtons,
    inputText,
    setInputText,
    handleInitialChoice,
    handleLevelNext,
    handleCategoryNext,
    handleSubsubjectNext,
    handleSubmitAnswers,
    resetToInitial,
    sendMessage,
  } = useQuizFlow({ userId });

  const [greetingDone, setGreetingDone] = useState(false);

  return (
    <>
      <div id="chat-container" className="flex-1 w-full max-w-2xl mx-auto pt-24 pb-40 px-2">
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

        {/* MODO CHAT */}
        {greetingDone && mode === "chat" && (
          <ChatMessages messages={messages} userName={userName} userId={userId} />
        )}

        {/* MODO QUIZ */}
        {greetingDone && mode === "quiz" && (
          <AnimatePresence mode="wait">
            {step === "levels" && (
              <motion.div key="levels" /* ...animacões... */ className="mt-4">
                <LevelStep onNext={handleLevelNext} />
              </motion.div>
            )}

            {step === "categories" && (
              <motion.div key="categories" /* ...animacões... */ className="mt-4">
                <CategoryStep buttons={categoryButtons} onNext={handleCategoryNext} />
              </motion.div>
            )}

            {step === "subsubjects" && (
              <motion.div key="subsubjects" /* ...animacões... */ className="mt-4">
                <SubsubjectStep buttons={subsubjectButtons} onNext={handleSubsubjectNext} />
              </motion.div>
            )}

            {step === "questions" && (
              <motion.div key="questions" /* ...animacões... */ className="mt-4">
                <QuestionsDisplay questions={questions} onSubmitAnswers={handleSubmitAnswers} />
              </motion.div>
            )}

            {step === "results" && resultData && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="mt-6 space-y-6"
              >
                {/* MUDANÇA AQUI 👇: Passando todas as props necessárias */}
                <ResultDisplay
                  totalCorrectAnswers={resultData.totalCorrectAnswers}
                  totalWrongAnswers={resultData.totalWrongAnswers}
                  detalhes={resultData.detalhes}
                />

                <div className="flex justify-center">
                  <ButtonBotAnswer
                    text="Continuar praticando"
                    isSubmit
                    onClick={() => handleInitialChoice("quiz")}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Input de chat apenas no modo chat */}
      <AnimatePresence mode="wait">
        {greetingDone && mode === "chat" && (
          <motion.div
            key="chat-input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full max-w-2xl fixed bottom-0 left-0 right-0 px-4 pb-6 z-10 mx-auto"
          >
            <ChatInput inputText={inputText} setInputText={setInputText} sendMessage={sendMessage} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StudentChatContent;