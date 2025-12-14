import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { historyService } from "@/services/api/api_history";
import { GraduationCap, Clock, Loader2, AlertCircle, Plus, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface QuizSession {
  quizId: string;
  title: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

interface QuizHistoryProps {
  userId: string;
  closeMenu?: () => void;
}

export function QuizHistory({ userId, closeMenu }: QuizHistoryProps) {
  const [quizzes, setQuizzes] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function fetchHistory() {
      try {
        setLoading(true);
        const data = await historyService.getQuizHistory(userId);

        if (isMounted) {
          setQuizzes(Array.isArray(data) ? data : []);
          setError(false);
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (userId) {
      fetchHistory();
    }

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleSelect = (quizId: string) => {
    navigate(`/quiz/results/${quizId}`);
    if (closeMenu) closeMenu();
  };

  const handleNewQuiz = () => {
    navigate("/chat?mode=quiz");
    if (closeMenu) closeMenu();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <Typograph text="Carregando quizzes..." colorText="text-zinc-500" variant="text6" weight="regular" fontFamily="poppins" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full pr-3">
      <div className="pb-4 px-1">
        <Button
          onClick={handleNewQuiz}
          className="w-full h-11 bg-purple-600 hover:bg-purple-500 text-white font-poppins font-medium rounded-xl shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 border border-purple-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
              <Plus size={14} className="text-white" />
            </div>
            <span>Novo Quiz</span>
          </div>
        </Button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3 px-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <Typograph text="Erro ao carregar histórico." colorText="text-zinc-500" variant="text6" weight="regular" fontFamily="poppins" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3 px-6 text-center">
          <GraduationCap className="w-8 h-8 text-zinc-700" />
          <Typograph text="Nenhum quiz realizado." colorText="text-zinc-500" variant="text6" weight="regular" fontFamily="poppins" />
        </div>
      ) : (
        <ScrollArea className="flex-1 -mr-3 pr-3">
          <div className="flex flex-col gap-3 pb-4 px-1">
            {quizzes.map((quiz, index) => (
              <motion.div
                key={quiz.quizId || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => handleSelect(quiz.quizId)}
                className="group flex flex-col gap-2 p-3.5 rounded-xl bg-[#2a2a2a] hover:bg-[#333333] border border-transparent hover:border-zinc-700 cursor-pointer transition-all duration-200 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0 group-hover:bg-purple-500/20 transition-colors">
                      <GraduationCap size={16} />
                    </div>
                    <Typograph
                      text={quiz.title || "Quiz Prático"}
                      colorText="text-zinc-200 group-hover:text-white"
                      variant="text5"
                      weight="medium"
                      fontFamily="poppins"
                      className="truncate transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1 pl-1">
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Clock size={12} />
                    <span className="text-[10px] font-medium font-poppins uppercase tracking-wider">
                      {formatDistanceToNow(new Date(quiz.completedAt), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
                    <Trophy size={10} />
                    <span className="text-[10px] font-bold font-poppins">
                      {quiz.score}/{quiz.totalQuestions}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}