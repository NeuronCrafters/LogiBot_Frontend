import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { PageHeader, Panel } from "@/components/AppUI";
import { toast } from "@/shared/lib/toast";
import { apiError } from "@/shared/lib/apiError";
import type { QuestionIssue } from "@/shared/logic/questionCore";
import { questionBankApi } from "@/features/questions/api/questionBankApi";
import { QuestionForm } from "@/features/questions/components/QuestionForm";
import { useManagedDisciplines } from "@/features/questions/hooks/useManagedDisciplines";
import type { QuestionPayload, QuestionValidationResponse } from "@/features/questions/types";

export function QuestionEditorPage() {
  useLocale();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { disciplines } = useManagedDisciplines();
  const existing = useQuery({ queryKey: ["question", id], queryFn: () => questionBankApi.get(id!), enabled: !!id });
  const [serverIssues, setServerIssues] = useState<QuestionIssue[] | null>(null);

  const save = useMutation({
    mutationFn: (payload: QuestionPayload) => (id ? questionBankApi.update(id, payload) : questionBankApi.create(payload)),
    onSuccess: () => {
      toast.success({ key: "questions.editor.saved" });
      queryClient.invalidateQueries({ queryKey: ["questionBank"] });
      navigate("/questions");
    },
    onError: (error) => {
      const data = (error as { response?: { data?: Partial<QuestionValidationResponse> } }).response?.data;
      if (data && Array.isArray(data.issues)) setServerIssues(data.issues);
      else toast.error(apiError(error));
    },
  });

  // An admin or coordinator may edit a question of a discipline outside their own list.
  const options = useMemo(() => {
    const current = existing.data;
    if (!current || disciplines.some((discipline) => discipline.id === current.disciplineId)) return disciplines;
    return [...disciplines, { id: current.disciplineId, name: current.disciplineName }];
  }, [disciplines, existing.data]);

  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Link to="/questions" className="inline-flex min-h-[2.75rem] items-center gap-2 font-[Poppins] text-sm text-zinc-300 hover:text-white">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          {t("questions.editor.back")}
        </Link>
        <PageHeader icon={<FileQuestion aria-hidden="true" className="h-5 w-5" />} title={id ? t("questions.editor.editTitle") : t("questions.editor.newTitle")} />
        <Panel>
          {id && existing.isError ? (
            <p role="alert" className="font-[Poppins] text-sm text-red-300">{t("questions.editor.loadError")}</p>
          ) : id && !existing.data ? (
            <p role="status" className="font-[Poppins] text-sm text-zinc-400">{t("common.carregando")}</p>
          ) : (
            <QuestionForm
              key={existing.data?.id ?? "new"}
              initial={existing.data}
              disciplines={options}
              saving={save.isPending}
              serverIssues={serverIssues}
              onSubmit={(payload) => { setServerIssues(null); save.mutate(payload); }}
            />
          )}
        </Panel>
      </div>
    </main>
  );
}
