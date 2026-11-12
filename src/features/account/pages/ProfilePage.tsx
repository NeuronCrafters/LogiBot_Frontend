import { apiError } from "@/shared/lib/apiError";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";
import { PreferencesControls } from "@/shared/preferences/PreferencesControls";
import { t, useLocale } from "@/i18n";
﻿import { useState, type ReactNode } from "react";
import { logger } from "@/shared/lib/logger";
import {
  BookOpen,
  GraduationCap,
  KeyRound,
  Loader2,
  Mail,
  Pencil,
  School,
  ShieldCheck,
  User as UserIcon,
  Users,
} from "lucide-react";
import { toast } from "@/shared/lib/toast";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { api } from "@/shared/api/httpClient";
import { Avatar } from "@/shared/components/Avatar";
import { Typograph } from "@/shared/components/Typography";
import { DisciplineCode } from "@/features/account/components/DisciplineCode";
import { EditNameModal } from "@/features/account/components/EditNameModal";
import { EditEmailModal } from "@/features/account/components/EditEmailModal";
import { EditPasswordModal } from "@/features/account/components/EditPasswordModal";

interface DisciplineObject {
  id: string;
  name: string;
}

const translateRole = (r: string) =>
  ({
    student: t("common.estudante"),
    professor: t("common.professor"),
    teacher: t("common.professor"),
    "course-coordinator": t("common.coordenadorDeCurso"),
    admin: t("common.administrador"),
  })[r] ?? r;

function isDisciplineObj(d: unknown): d is DisciplineObject {
  return d !== null && typeof d === "object" && "id" in d && "name" in d;
}

function getNames(value: unknown): string {
  if (!Array.isArray(value)) return typeof value === "string" ? value : "-";
  const names = value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "name" in item)
        return String((item as { name?: unknown }).name ?? "");
      return "";
    })
    .filter(Boolean);
  return names.length > 0 ? names.join(", ") : "-";
}

export function Profile() {
  useLocale();

  const { user, setUser, loading } = useAuth();
  const [showEditName, setShowEditName] = useState(false);
  const [showEditEmail, setShowEditEmail] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  if (loading)
    return (
      <div className="flex min-h-full items-center justify-center bg-neutral-900">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-surface px-4 py-3 text-zinc-400 shadow-lg">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          <span className="font-[Poppins] text-sm">{t("account.carregandoPerfil")}</span>
        </div>
      </div>
    );

  if (!user)
    return (
      <div className="flex min-h-full items-center justify-center bg-neutral-900 px-4">
        <Typograph
          text={t("account.erroAoCarregarOsDados")}
          colorText="text-red-400"
          variant="text5"
          weight="medium"
          fontFamily="poppins"
        />
      </div>
    );

  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const occupation = roles.map(translateRole).join(", ");
  const isAdmin = roles.includes("admin");
  const isProfessor = roles.includes("professor") || roles.includes("teacher");
  const schoolName = getNames(user.schoolName);
  const courseName = getNames(user.courseName);
  const className = getNames(user.className);
  const profCourses = getNames(user.courses);
  const profClasses = getNames(user.classes);
  const disciplineObjects: DisciplineObject[] = Array.isArray(user.disciplines)
    ? user.disciplines.reduce<DisciplineObject[]>((acc, d) => {
        if (isDisciplineObj(d)) acc.push(d);
        else if (typeof d === "string") acc.push({ id: d, name: d });
        return acc;
      }, [])
    : [];
  const profDisciplines =
    disciplineObjects.length > 0
      ? disciplineObjects.map((d) => d.name).join(", ")
      : "-";

  const handleUpdateName = async (newName: string) => {
    try {
      const response = await api.patch("/account/name", {
        userId: user._id,
        name: newName,
      });
      if (setUser && response.data.user)
        setUser({ ...user, ...response.data.user });
      toast.success({ key: "account.nomeAtualizadoComSucesso", params: {} });
    } catch (error: any) {
      logger.error("Profile", "Erro ao atualizar nome.", error);
      toast.error(apiError(error, "account.erroAoAtualizarNome"));
      throw error;
    }
  };

  const handleUpdateEmail = async (newEmail: string) => {
    try {
      const response = await api.patch("/account/email", {
        userId: user._id,
        email: newEmail,
      });
      if (setUser && response.data.user)
        setUser({ ...user, ...response.data.user });
      toast.success({ key: "account.eMailAtualizadoComSucesso", params: {} });
    } catch (error: any) {
      logger.error("Profile", "Erro ao atualizar e-mail.", error);
      toast.error(apiError(error, "account.erroAoAtualizarEMail"));
      throw error;
    }
  };

  const handleUpdatePassword = async (currentPass: string, newPass: string) => {
    try {
      await api.patch("/account/password", {
        currentPassword: currentPass,
        newPassword: newPass,
      });
      toast.success({ key: "account.senhaAlteradaComSucesso", params: {} });
    } catch (error: any) {
      logger.error("Profile", "Erro ao alterar senha.", error);
      toast.error(error.response?.data?.error || t("account.erroAoAlterarSenha"));
      throw error;
    }
  };

  return (
    <>
      <main className="flex min-h-0 flex-1 items-start overflow-y-auto px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto my-auto flex w-full max-w-5xl flex-col gap-5">
          <section className="rounded-2xl border border-white/10 bg-surface p-5 shadow-lg shadow-black/10 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-24 w-24 shrink-0 rounded-2xl border border-white/10 bg-neutral-950 p-2 shadow-lg shadow-black/20">
                  <Avatar
                    seed={user._id}
                    backgroundColor="#18181b"
                    className="h-full w-full rounded-xl"
                  />
                </div>
                <div className="min-w-0">
                  <p className="mb-2 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {t("account.perfilDaConta")}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="break-words font-[Poppins] text-2xl font-semibold text-white sm:text-3xl">
                      {user.name}
                    </h1>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0 text-zinc-500" />
                      <span className="break-all">{user.email}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-neutral-950/60 px-4 py-3 lg:w-72">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {t("account.identificador")}</div>
                <p className="mt-1 max-w-[18rem] truncate font-mono text-xs text-zinc-300">
                  {user._id.toUpperCase()}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-neutral-950/60 p-5">
            <h2 className="mb-3 font-semibold text-white">{t("language.label")}</h2>
            <LanguageSwitcher details />
          </section>
          <section className="rounded-xl border border-white/10 bg-neutral-950/60 p-5">
            <h2 className="mb-4 font-semibold text-white">{t("preferences.titulo")}</h2>
            <PreferencesControls />
          </section>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
            <div className="space-y-5">
              <Panel
                icon={<UserIcon className="h-5 w-5 text-blue-400" />}
                title={t("account.informacoesPessoais")}
                subtitle={t("account.dadosPrincipaisUsadosNaSuaConta")}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile
                    label={t("common.nomeCompleto")}
                    value={user.name}
                    actionLabel={t("account.editName")}
                    onAction={() => setShowEditName(true)}
                  />
                  <InfoTile
                    label={t("common.email")}
                    value={user.email}
                    actionLabel={t("account.editEmail")}
                    onAction={() => setShowEditEmail(true)}
                  />
                  <InfoTile label={t("account.ocupacaoPrincipal")} value={occupation} />
                </div>
              </Panel>

              {!isAdmin && (
                <Panel
                  icon={<GraduationCap className="h-5 w-5 text-emerald-400" />}
                  title={t("account.dadosAcademicos")}
                  subtitle={t("account.vinculosCarregadosAPartirDaSuaInstituicao")}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoTile
                      icon={<School className="h-4 w-4 text-emerald-400" />}
                      label={t("account.instituicao")}
                      value={schoolName}
                    />
                    {isProfessor ? (
                      <>
                        <InfoTile
                          icon={<BookOpen className="h-4 w-4 text-blue-400" />}
                          label={t("account.cursosMinistrados")}
                          value={profCourses}
                        />
                        <InfoTile
                          icon={<Users className="h-4 w-4 text-indigo-400" />}
                          label={t("common.turmas")}
                          value={profClasses}
                        />
                        <div className="rounded-xl border border-white/10 bg-neutral-950/60 p-4 sm:col-span-2">
                          <div className="mb-2 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-emerald-400" />
                            <span className="font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
                              {t("common.disciplinas")}</span>
                          </div>
                          {disciplineObjects.length > 0 ? (
                            <DisciplineCode
                              text={profDisciplines}
                              disciplines={disciplineObjects}
                            />
                          ) : (
                            <p className="font-[Poppins] text-sm text-zinc-300">
                              -
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <InfoTile
                          icon={<BookOpen className="h-4 w-4 text-blue-400" />}
                          label={t("common.curso")}
                          value={courseName}
                        />
                        <InfoTile
                          icon={<Users className="h-4 w-4 text-indigo-400" />}
                          label={t("common.turma")}
                          value={className}
                        />
                      </>
                    )}
                  </div>
                </Panel>
              )}
            </div>

            <aside className="space-y-5">
              <Panel
                icon={<ShieldCheck className="h-5 w-5 text-amber-400" />}
                title={t("account.seguranca")}
                subtitle={t("account.mantenhaOAcessoDaContaProtegido")}
              >
                <div className="rounded-xl border border-white/10 bg-neutral-950/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-[Poppins] text-sm font-semibold text-white">
                        {t("common.senhaDeAcesso")}</p>
                      <p className="mt-1 font-[Poppins] text-xs leading-relaxed text-zinc-500">
                        {t("account.useUmaSenhaForteEDiferenteDas")}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 w-full gap-2 border-white/10 bg-white/5 text-sm text-white hover:bg-white/10"
                    onClick={() => setShowEditPassword(true)}
                  >
                    <KeyRound className="h-4 w-4" />
                    {t("account.alterarSenha_73")}</Button>
                </div>
              </Panel>
            </aside>
          </div>
        </div>
      </main>

      <EditNameModal
        isOpen={showEditName}
        onClose={() => setShowEditName(false)}
        currentName={user.name}
        onSave={handleUpdateName}
      />
      <EditEmailModal
        isOpen={showEditEmail}
        onClose={() => setShowEditEmail(false)}
        currentEmail={user.email}
        onSave={handleUpdateEmail}
      />
      <EditPasswordModal
        isOpen={showEditPassword}
        onClose={() => setShowEditPassword(false)}
        onSave={handleUpdatePassword}
      />
    </>
  );
}

function Panel({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  useLocale();

  return (
    <section className="rounded-2xl border border-white/10 bg-surface p-5 shadow-lg shadow-black/10">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
          {icon}
        </div>
        <div>
          <h2 className="font-[Poppins] text-base font-semibold text-white">
            {title}
          </h2>
          <p className="mt-1 font-[Poppins] text-xs leading-relaxed text-zinc-500">
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function InfoTile({
  icon,
  label,
  value,
  actionLabel,
  onAction,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  useLocale();

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-950/60 p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <span className="font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {label}
          </span>
        </div>
        {onAction && actionLabel && (
          <button
            type="button"
            aria-label={actionLabel}
            title={actionLabel}
            onClick={onAction}
            className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="break-words font-[Poppins] text-sm font-medium leading-relaxed text-zinc-200">
        {value}
      </p>
    </div>
  );
}
