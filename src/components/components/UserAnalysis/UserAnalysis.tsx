import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  GraduationCap
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../ui/accordion";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";
import { Progress } from "../../ui/progress";
import { UserAnalysisData } from "../../../@types/userAnalysis";

interface StudySessionHistoryProps {
  data: UserAnalysisData;
}

export function StudySessionHistory({ data }: StudySessionHistoryProps) {

  const allSessions = useMemo(() => {
    if (!data?.sessions) return [];
    return [...data.sessions].sort((a, b) =>
      new Date(b.sessionStart).getTime() - new Date(a.sessionStart).getTime()
    );
  }, [data]);

  const quizSessions = useMemo(() => {
    return allSessions.filter(session => {
      const totalQuestions = session.totalCorrectAnswers + session.totalWrongAnswers;
      return totalQuestions > 0;
    });
  }, [allSessions]);

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0 min";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  };

  const calculateAccuracy = (correct: number, wrong: number) => {
    const total = correct + wrong;
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  };

  return (
    <div className="w-full h-full flex flex-col pr-4">


      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="pb-4">
            {quizSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 px-6 text-center">
                <GraduationCap className="w-8 h-8 text-zinc-700" />
                <p className="text-zinc-500 text-sm font-poppins">Nenhum quiz realizado.</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-2">
                {quizSessions.map((session, index) => {
                  const sessionDate = new Date(session.sessionStart);
                  const accuracy = calculateAccuracy(session.totalCorrectAnswers, session.totalWrongAnswers);

                  return (
                    <AccordionItem
                      key={index}
                      value={`item-${index}`}
                      className="border border-transparent hover:border-zinc-700 rounded-xl bg-[#2a2a2a] px-2 transition-all duration-200"
                    >
                      <AccordionTrigger className="hover:no-underline py-3 px-2">
                        <div className="flex items-center justify-between w-full pr-2">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                              <GraduationCap size={16} />
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-medium text-zinc-200 font-poppins">
                                {format(sessionDate, "dd 'de' MMMM", { locale: ptBR })}
                              </span>
                              <span className="text-xs text-zinc-500 font-poppins">
                                {format(sessionDate, "HH:mm")} • {formatDuration(session.sessionDuration)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <Badge variant="outline" className={`
                              ${accuracy >= 70 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}
                            `}>
                              {accuracy}%
                            </Badge>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="pb-4 pt-1 px-2">
                        <div className="space-y-4">
                          <div className="space-y-2 pt-2 border-t border-zinc-800">
                            <h4 className="text-xs uppercase text-zinc-500 font-bold flex items-center gap-1 font-poppins">
                              <Trophy size={12} /> Desempenho
                            </h4>

                            <div className="flex items-center gap-4 text-sm font-poppins">
                              <div className="flex items-center gap-1 text-green-400">
                                <CheckCircle2 size={16} />
                                <span className="font-bold">{session.totalCorrectAnswers} Acertos</span>
                              </div>
                              <div className="flex items-center gap-1 text-red-400">
                                <XCircle size={16} />
                                <span className="font-bold">{session.totalWrongAnswers} Erros</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Progress value={accuracy} className="h-2 bg-zinc-800" indicatorClassName={accuracy >= 70 ? "bg-green-500" : "bg-orange-500"} />
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}