import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { historyService } from "@/services/api/api_history";
import { GraduationCap, Loader2, AlertCircle, Plus } from "lucide-react";
import { motion } from "framer-motion";
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
      } catch {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (userId) fetchHistory();
    return () => { isMounted = false; };
  }, [userId]);

  const handleSelect = (quizId: string) => {
    navigate(`/quiz/results/${quizId}`);
    closeMenu?.();
  };

  const handleNewQuiz = () => {
    navigate("/quiz");
    closeMenu?.();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-[Poppins]">Carregando quizzes...</span>
      </div>
    );
  }

  const hasNoQuizzes = !Array.isArray(quizzes) || quizzes.length === 0;

  return (
    <div className="flex flex-col w-full gap-1">
      <Button
        onClick={handleNewQuiz}
        className="w-full h-9 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-[Poppins] font-medium rounded-lg border border-indigo-500/30 transition-colors gap-1.5 mb-1"
      >
        <Plus size={14} />
        Novo quiz
      </Button>

      {error ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2 px-4 text-center">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-xs text-zinc-500 font-[Poppins]">Erro ao carregar histórico.</span>
        </div>
      ) : hasNoQuizzes ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2 px-4 text-center">
          <GraduationCap className="w-5 h-5 text-zinc-700" />
          <span className="text-xs text-zinc-500 font-[Poppins]">Nenhum quiz realizado.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {quizzes.map((quiz, index) => (
            <motion.div
              key={quiz.quizId || index}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              onClick={() => handleSelect(quiz.quizId)}
              className="group flex items-start gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
            >
              <GraduationCap size={14} className="text-indigo-400 shrink-0 mt-0.5" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-[Poppins] text-zinc-300 group-hover:text-white truncate leading-snug transition-colors">
                  {quiz.title || "Quiz Prático"}
                </span>
                <div className="flex items-center gap-2 leading-snug">
                  <span className="text-[11px] text-zinc-600 font-[Poppins]">
                    {formatDistanceToNow(new Date(quiz.completedAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-[Poppins] font-semibold">
                    {quiz.score}/{quiz.totalQuestions}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
