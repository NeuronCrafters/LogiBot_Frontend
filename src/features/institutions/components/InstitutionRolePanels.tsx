import { useId, useState } from "react";
import { BookOpen, GraduationCap, UserRound, Users } from "lucide-react";
import { t, useLocale } from "@/i18n";
import { cn } from "@/shared/lib/cn";
import type { InstitutionPageData } from "@/features/institutions/api/institutionsApi";
import { fieldClass } from "@/features/institutions/components/TextField";
import { WeeklySection } from "@/features/institutions/components/InstitutionPanels";

const box = "rounded-2xl border border-white/10 bg-surface p-4 sm:p-5";

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-white/10 bg-surface p-6 text-center text-sm text-zinc-400">{children}</p>;
}

/* ── Aluno: minha turma ── */
export function MyClassPanel({ data }: { data: InstitutionPageData }) {
  useLocale();
  const id = useId();
  const own = data.myClass;
  if (!own) return <Empty>{t("institutions.myClass.none")}</Empty>;
  return (
    <div className="space-y-4 font-[Poppins]">
      <section className={box} aria-labelledby={id}>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{own.course}</p>
        <h2 id={id} className="flex items-center gap-2 text-lg font-semibold text-white">
          <GraduationCap aria-hidden="true" className="h-5 w-5 text-blue-300" />{own.name}
        </h2>
        <p className="text-xs text-zinc-400">{t("institutions.myClass.hint")}</p>
        {own.disciplines.length === 0 ? <p className="mt-3 text-sm text-zinc-400">{t("institutions.myClass.noSubjects")}</p> : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {own.disciplines.map((subject) => (
              <li key={subject.id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-surface-sunken p-3">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-zinc-300"><BookOpen className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white">{subject.name}</h3>
                  <p className="text-xs text-zinc-400">
                    {subject.professors.length
                      ? t("institutions.myClass.professor", { names: subject.professors.join(", ") })
                      : t("institutions.myClass.noProfessor")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ── Aluno: colegas ── */
export function ClassmatesPanel({ data }: { data: InstitutionPageData }) {
  useLocale();
  const own = data.myClass;
  if (!own) return <Empty>{t("institutions.myClass.none")}</Empty>;
  return (
    <div className="font-[Poppins]">
      <h2 className="text-base font-semibold text-white">{t("institutions.classmates.title", { name: own.name })}</h2>
      <p className="text-xs text-zinc-400">{t("institutions.classmates.hint", { count: own.classmates.length })}</p>
      {own.classmates.length === 0 ? <p className="mt-3 text-sm text-zinc-400">{t("institutions.classmates.empty")}</p> : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {own.classmates.map((name, index) => (
            <li key={`${name}-${index}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface-sunken px-3 py-2.5 text-sm text-zinc-100">
              <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-zinc-300"><UserRound className="h-4 w-4" /></span>
              <span className="min-w-0 break-words">{name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Professor: minhas turmas e atividade por disciplina ── */
export function TeachingPanel({ data }: { data: InstitutionPageData }) {
  useLocale();
  const id = useId();
  const teaching = data.teaching!;
  const [subjectId, setSubjectId] = useState(teaching.disciplines[0]?.id ?? "");
  const subject = teaching.disciplines.find((item) => item.id === subjectId) ?? teaching.disciplines[0];
  if (!teaching.classes.length && !teaching.disciplines.length) return <Empty>{t("institutions.teaching.none")}</Empty>;
  return (
    <div className="space-y-4 font-[Poppins]">
      <section className={box} aria-labelledby={`${id}-classes`}>
        <h2 id={`${id}-classes`} className="text-base font-semibold text-white">{t("institutions.teaching.classesTitle")}</h2>
        <p className="text-xs text-zinc-400">{t("institutions.teaching.classesHint")}</p>
        {teaching.classes.length === 0 ? <p className="mt-3 text-sm text-zinc-400">{t("institutions.teaching.noClasses")}</p> : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {teaching.classes.map((row) => (
              <li key={row.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface-sunken p-3">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-zinc-300"><Users className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white">{row.name}</h3>
                  <p className="text-xs text-zinc-400">{row.course} · {t("institutions.teaching.students", { count: row.students })}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {subject && (
        <WeeklySection weeks={subject.weeks} students={subject.students.length || null} title={t("institutions.teaching.weeksTitle", { name: subject.name })}
          hint={t("institutions.teaching.weeksHint")} empty={t("institutions.teaching.weeksEmpty")}>
          {teaching.disciplines.length > 1 && (
            <div className="mb-3 grid max-w-xs gap-1.5">
              <label htmlFor={`${id}-subject`} className="text-sm font-medium text-zinc-200">{t("institutions.teaching.subject")}</label>
              <select id={`${id}-subject`} value={subject.id} onChange={(event) => setSubjectId(event.target.value)} className={cn(fieldClass, "h-11")}>
                {teaching.disciplines.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.course}</option>)}
              </select>
            </div>
          )}
        </WeeklySection>
      )}
    </div>
  );
}

/* ── Professor: alunos por disciplina ── */
export function StudentsPanel({ data }: { data: InstitutionPageData }) {
  useLocale();
  const teaching = data.teaching!;
  if (!teaching.disciplines.length) return <Empty>{t("institutions.teaching.none")}</Empty>;
  return (
    <div className="space-y-4 font-[Poppins]">
      <div>
        <h2 className="text-base font-semibold text-white">{t("institutions.tab.students")}</h2>
        <p className="text-xs text-zinc-400">{t("institutions.teaching.studentsHint")}</p>
      </div>
      {teaching.disciplines.map((subject) => (
        <section key={subject.id} aria-label={subject.name} className={box}>
          <h3 className="text-sm font-semibold text-white">{subject.name}</h3>
          <p className="text-xs text-zinc-400">
            {subject.course}{subject.classes.length ? ` · ${t("institutions.teaching.classesOf", { names: subject.classes.join(", ") })}` : ""} · {t("institutions.teaching.students", { count: subject.students.length })}
          </p>
          {subject.students.length === 0 ? <p className="mt-3 text-sm text-zinc-400">{t("institutions.teaching.noStudents")}</p> : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">{t("institutions.teaching.studentsOf", { name: subject.name })}</caption>
                <thead><tr className="bg-surface-raised text-left text-zinc-300">
                  <th scope="col" className="px-3 py-2">{t("institutions.col.student")}</th><th scope="col" className="px-3 py-2">{t("institutions.col.class")}</th>
                </tr></thead>
                <tbody>{subject.students.map((student, index) => (
                  <tr key={`${student.name}-${index}`} className="border-t border-white/5 text-zinc-200">
                    <th scope="row" className="px-3 py-2 text-left font-medium text-white">{student.name}</th>
                    <td className="px-3 py-2">{student.className}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
