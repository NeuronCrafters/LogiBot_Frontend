import { Languages, ListOrdered, Table2 } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import { t, useLocale, type MessageKey } from "@/i18n";
import { PageHeader, Panel } from "@/components/AppUI";
import { TruthTableExercise } from "@/features/exercises/components/TruthTableExercise";
import { TranslationExercise } from "@/features/exercises/components/TranslationExercise";
import { ParsonsExercise } from "@/features/exercises/components/ParsonsExercise";

/** Each exercise type is its own learning option, with its own title and description. */
const EXERCISES = {
  "truth-table": { Component: TruthTableExercise, Icon: Table2, key: "truthTable" },
  translation: { Component: TranslationExercise, Icon: Languages, key: "translation" },
  parsons: { Component: ParsonsExercise, Icon: ListOrdered, key: "parsons" },
} as const;

export function PracticePage() {
  useLocale();
  const { exercise } = useParams();
  const current = exercise && Object.prototype.hasOwnProperty.call(EXERCISES, exercise)
    ? EXERCISES[exercise as keyof typeof EXERCISES]
    : null;
  if (!current) return <Navigate to="/practice/truth-table" replace />;
  const { Component, Icon, key } = current;

  return (
    <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <PageHeader
          icon={<Icon aria-hidden="true" className="h-5 w-5" />}
          title={t(`exercises.${key}.title` as MessageKey)}
          description={`${t(`exercises.${key}.pageDescription` as MessageKey)} ${t("exercises.recordNotice")}`}
        />
        <Panel>
          <Component key={exercise} embedded />
        </Panel>
      </div>
    </main>
  );
}
