import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  BookOpen,
  Trophy,
  History,
  MessageSquare,
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
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
// REMOVIDO: TabsContent da importação abaixo
import { Tabs, TabsList, TabsTrigger } from "../../ui/tabs";
import { UserAnalysisData, SubjectCounts } from "../../../@types/userAnalysis";

const subjectLabels: Record<keyof SubjectCounts, string> = {
  variaveis: "Variáveis",
  listas: "Listas & Arrays",
  condicionais: "Condicionais",
  operadores_logicos: "Lógica Booleana",
  funcoes: "Funções",
  repeticao: "Loops",
  verificacoes: "Verificações",
};

interface StudySessionHistoryProps {
  data: UserAnalysisData;
}

export function StudySessionHistory({ data }: StudySessionHistoryProps) {
  const [activeTab, setActiveTab] = useState("all");

  const allSessions = useMemo(() => {
    if (!data?.sessions) return [];
    return [...data.sessions].sort((a, b) =>
      new Date(b.sessionStart).getTime() - new Date(a.sessionStart).getTime()
    );
  }, [data]);

  const filteredSessions = useMemo(() => {
    return allSessions.filter(session => {
      const hasChat = Object.values(session.subjectCountsChat || {}).some(v => (v as number) > 0);
      const hasQuiz = (session.totalCorrectAnswers + session.totalWrongAnswers) > 0;

      if (activeTab === "chat") return hasChat;
      if (activeTab === "quiz") return hasQuiz;
      return true;
    });
  }, [allSessions, activeTab]);

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
    <Card className="w-full h-full bg-[#1e1e1e] border-zinc-800 text-zinc-100 flex flex-col">
      <CardHeader className="pb-3 border-b border-zinc-800 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <History className="text-blue-500" />
              Histórico de Sessões
            </CardTitle>
            <p className="text-xs text-zinc-500 mt-1">
              {data.name} • {data.className}
            </p>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900 text-zinc-400">
            <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100">
              Geral
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-blue-400 gap-2">
              <MessageSquare size={14} /> Chat
            </TabsTrigger>
            <TabsTrigger value="quiz" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-green-400 gap-2">
              <GraduationCap size={14} /> Quiz
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 flex flex-col items-center gap-2">
                <History size={32} className="opacity-20" />
                <p>Nenhuma atividade encontrada neste filtro.</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-2">
                {filteredSessions.map((session, index) => {
                  const sessionDate = new Date(session.sessionStart);
                  const accuracy = calculateAccuracy(session.totalCorrectAnswers, session.totalWrongAnswers);
                  const totalQuestions = session.totalCorrectAnswers + session.totalWrongAnswers;

                  const activeTopics = Object.entries(session.subjectCountsChat || {})
                    .filter(([_, count]) => (count as number) > 0)
                    .map(([key, count]) => ({
                      key: key as keyof SubjectCounts,
                      count: count as number
                    }));

                  const showChatContent = (activeTab === "all" || activeTab === "chat") && activeTopics.length > 0;
                  const showQuizContent = (activeTab === "all" || activeTab === "quiz") && totalQuestions > 0;

                  return (
                    <AccordionItem
                      key={index}
                      value={`item-${index}`}
                      className="border border-zinc-800 rounded-lg bg-zinc-900/50 px-2"
                    >
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-zinc-800 p-2 rounded-md">
                              {totalQuestions > 0 && activeTopics.length === 0 ? (
                                <GraduationCap size={16} className="text-green-400" />
                              ) : activeTopics.length > 0 && totalQuestions === 0 ? (
                                <MessageSquare size={16} className="text-blue-400" />
                              ) : (
                                <Calendar size={16} className="text-zinc-400" />
                              )}
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-medium text-zinc-200">
                                {format(sessionDate, "dd 'de' MMMM", { locale: ptBR })}
                              </span>
                              <span className="text-xs text-zinc-500">
                                {format(sessionDate, "HH:mm")} • {formatDuration(session.sessionDuration)}
                              </span>
                            </div>
                          </div>

                          <div className="hidden sm:flex items-center gap-2">
                            {showChatContent && (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                                {activeTopics.length} Tópicos
                              </Badge>
                            )}
                            {showQuizContent && (
                              <Badge variant="outline" className={`
                                ${accuracy >= 70 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}
                              `}>
                                {accuracy}% Acerto
                              </Badge>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="pb-4 pt-1">
                        <div className="space-y-4 px-2">

                          {showChatContent && (
                            <div className="space-y-2">
                              <h4 className="text-xs uppercase text-zinc-500 font-bold flex items-center gap-1">
                                <BookOpen size={12} /> Assuntos do Chat
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {activeTopics.map((topic) => (
                                  <Badge key={topic.key} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300">
                                    {subjectLabels[topic.key] || topic.key}
                                    <span className="ml-1 opacity-50 text-[10px]">({topic.count})</span>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {showQuizContent && (
                            <div className={`space-y-2 ${showChatContent ? 'pt-2 border-t border-zinc-800' : ''}`}>
                              <h4 className="text-xs uppercase text-zinc-500 font-bold flex items-center gap-1">
                                <Trophy size={12} /> Desempenho no Quiz
                              </h4>

                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1 text-green-400">
                                  <CheckCircle2 size={16} />
                                  <span className="font-bold">{session.totalCorrectAnswers}</span>
                                </div>
                                <div className="flex items-center gap-1 text-red-400">
                                  <XCircle size={16} />
                                  <span className="font-bold">{session.totalWrongAnswers}</span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-zinc-400">
                                  <span>Precisão</span>
                                  <span>{accuracy}%</span>
                                </div>
                                <Progress value={accuracy} className="h-2 bg-zinc-800" indicatorClassName={accuracy >= 70 ? "bg-green-500" : "bg-orange-500"} />
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}