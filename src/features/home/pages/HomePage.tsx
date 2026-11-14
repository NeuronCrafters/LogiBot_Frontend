import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";
import { getResolvedPreferences } from "@/shared/preferences";
import { PreferencesMenu } from "@/shared/preferences/PreferencesControls";
import { t, useLocale } from "@/i18n";
﻿import { type MouseEvent, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { RobotAvatar } from "@/shared/mascot/RobotAvatar";
import { Footer } from "@/features/home/components/Footer";
import { useAuth } from "@/features/auth/hooks/useAuth";
import logoMascote from "@/assets/logo.svg";
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  Building2,
  CheckCircle,
  GraduationCap,
  MessageCircle,
  Play,
  Sparkles,
  Users,
} from "lucide-react";

const features = [
  {
    icon: <MessageCircle className="h-5 w-5" />,
    get title() { return t("home.chatEspecializado"); },
    get description() { return t("home.tireDuvidasSobreLogicaDeProgramacaoCom"); },
    tone: "text-blue-400 bg-blue-500/10",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    get title() { return t("home.quizAdaptativo"); },
    get description() { return t("home.pratiquePorNivelTemaESubtopicoCom"); },
    tone: "text-indigo-400 bg-indigo-500/10",
  },
  {
    icon: <BarChart2 className="h-5 w-5" />,
    get title() { return t("home.analyticsEducacional"); },
    get description() { return t("home.acompanheDesempenhoEsforcoEEvolucaoParaApoiar"); },
    tone: "text-emerald-400 bg-emerald-500/10",
  },
];

const profiles = [
  {
    icon: <GraduationCap className="h-5 w-5" />,
    get role() { return t("common.aluno"); },
    get description() { return t("home.aprendePraticaERevisaConteudosComApoio"); },
    get benefits() { return [t("home.chatSobreLogica"), t("home.quizzesGuiados"), t("home.feedbackImediato")]; },
  },
  {
    icon: <Users className="h-5 w-5" />,
    get role() { return t("common.professor"); },
    get description() { return t("home.acompanhaTurmasEIdentificaDificuldadesComMais"); },
    get benefits() { return [t("home.relatoriosPorTurma"), t("home.matrizDeEsforco"), t("home.dadosPorAluno")]; },
  },
  {
    icon: <Building2 className="h-5 w-5" />,
    get role() { return t("common.coordenador"); },
    get description() { return t("home.observaIndicadoresAmplosParaOrientarAcoesAcademicas"); },
    get benefits() { return [t("home.visaoPorCurso"), t("home.filtrosInstitucionais"), t("home.gestaoPorDados")]; },
  },
];

export function Home() {
  useLocale();

  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  if (!loading && isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  const handleStart = () => navigate("/signin");
  const scrollToSection = async (id: string) => {
    await document.fonts?.ready;
    navigate({ hash: `#${id}` }, { replace: true });
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({
      behavior: getResolvedPreferences().reduceMotion ? "auto" : "smooth", block: "start",
    }));
  };
  const handleSectionLink = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void scrollToSection(event.currentTarget.hash.slice(1));
  };

  return (
    <div className="home-page min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/85 backdrop-blur-xl">
        <div className="mx-auto grid h-16 w-full max-w-7xl grid-cols-[auto_minmax(0,1fr)] items-center gap-2 px-3 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <a href="/" className="flex w-fit items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 sm:h-10 sm:w-10">
              <img
                src={logoMascote}
                alt={t("common.logibot")}
                className="brand-mark h-6 w-6 object-contain"
              />
            </span>
            <span className="hidden sm:inline font-[Poppins] text-base font-bold text-white">
              LogiBot.AI
            </span>
          </a>
          <nav aria-label={t("home.sectionNavigation")} className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 font-[Poppins] text-sm font-medium text-zinc-200 lg:flex">
            <a href="#features" onClick={handleSectionLink} className="flex min-h-10 items-center rounded-full px-3 py-2 transition-colors hover:bg-white/10 hover:text-white">
              {t("home.recursos")}</a>
            <a href="#profiles" onClick={handleSectionLink} className="flex min-h-10 items-center rounded-full px-3 py-2 transition-colors hover:bg-white/10 hover:text-white">
              {t("home.perfis")}</a>
            <a href="#start" onClick={handleSectionLink} className="flex min-h-10 items-center rounded-full px-3 py-2 transition-colors hover:bg-white/10 hover:text-white">
              {t("home.comecar")}</a>
          </nav>
          <div className="flex min-w-0 items-center justify-self-end gap-1 sm:gap-2">
          <PreferencesMenu className="shrink-0" /><LanguageSwitcher compact />
          <button
            id="play-button"
            onClick={handleStart}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-blue-400/40 bg-blue-600 px-2 font-[Poppins] text-xs font-semibold text-on-accent shadow-md shadow-blue-900/30 transition-colors hover:bg-blue-700 sm:gap-2 sm:px-4 sm:text-sm"
          >
            {t("common.entrar")}<ArrowRight className="hidden h-4 w-4 sm:block" />
          </button>
          </div>
        </div>
        <nav aria-label={t("home.sectionNavigation")} className="grid h-12 grid-cols-3 items-center gap-1 border-t border-white/5 px-3 font-[Poppins] text-xs font-medium text-zinc-300 lg:hidden">
          <a href="#features" onClick={handleSectionLink} className="flex min-h-11 items-center justify-center rounded-lg transition-colors hover:bg-white/5 hover:text-white">{t("home.recursos")}</a>
          <a href="#profiles" onClick={handleSectionLink} className="flex min-h-11 items-center justify-center rounded-lg transition-colors hover:bg-white/5 hover:text-white">{t("home.perfis")}</a>
          <a href="#start" onClick={handleSectionLink} className="flex min-h-11 items-center justify-center rounded-lg transition-colors hover:bg-white/5 hover:text-white">{t("home.comecar")}</a>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="home-hero mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-5 py-8 text-center sm:px-8 sm:py-12 lg:py-16">
            <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 max-w-4xl rounded-full bg-blue-500/10 blur-3xl" />
            <div className="relative flex w-full flex-col items-center">
              <div
                id="animated-logo"
                className="mb-5 flex h-36 w-36 items-center justify-center sm:h-56 sm:w-56"
              >
                <RobotAvatar variant="head" className="h-full w-full" />
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-[Poppins] text-xs font-medium text-zinc-300">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                {t("home.plataformaDeIaParaLogicaDeProgramacao")}</div>
              <h1
                id="welcome-title"
                className="mt-5 max-w-4xl font-[Poppins] text-3xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl"
              >
                {t("home.aprendaPratiqueEAcompanheEvolucaoComO")}</h1>
              <p className="mt-5 max-w-2xl font-[Poppins] text-base leading-relaxed text-zinc-400 sm:text-lg">
                {t("home.umAmbienteEducacionalComChatInteligenteQuizzes")}</p>
              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <button
                  onClick={handleStart}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-blue-400/40 bg-blue-600 px-6 font-[Poppins] text-sm font-semibold text-on-accent shadow-md shadow-blue-900/30 transition-colors hover:bg-blue-700"
                >
                  {t("home.comecarAgora")}<Play className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { void scrollToSection("features"); }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 font-[Poppins] text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {t("home.verRecursos")}<ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <SectionShell
          id="features"
          eyebrow={t("home.resourcesEyebrow")}
          title={t("home.umFluxoCompletoParaEstudarEAcompanhar")}
          description={t("home.asPrincipaisExperienciasDoProdutoSeguemA")}
        >
          <div className="grid gap-5 md:grid-cols-3 lg:gap-6">
            {features.map((feature) => (
              <InfoCard key={feature.title}>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.tone}`}
                >
                  {feature.icon}
                </div>
                <h3 className="font-[Poppins] text-base font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="font-[Poppins] text-sm leading-relaxed text-zinc-400">
                  {feature.description}
                </p>
              </InfoCard>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          id="profiles"
          eyebrow={t("home.profilesEyebrow")}
          title={t("home.feitoParaQuemAprendeEParaQuem")}
          description={t("home.alunoProfessorECoordenacaoEnxergamOQue")}
        >
          <div className="grid gap-5 md:grid-cols-3 lg:gap-6">
            {profiles.map((profile) => (
              <InfoCard key={profile.role}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-blue-400">
                  {profile.icon}
                </div>
                <div>
                  <h3 className="font-[Poppins] text-base font-semibold text-white">
                    {profile.role}
                  </h3>
                  <p className="mt-2 font-[Poppins] text-sm leading-relaxed text-zinc-400">
                    {profile.description}
                  </p>
                </div>
                <ul className="space-y-2">
                  {profile.benefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-2 font-[Poppins] text-sm text-zinc-400"
                    >
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </InfoCard>
            ))}
          </div>
        </SectionShell>

        <section id="start" aria-labelledby="start-title" className="home-section border-b border-white/10 px-5 py-12 sm:px-8 lg:py-16">
          <div className="mx-auto w-full max-w-7xl rounded-3xl border border-white/10 bg-surface p-7 shadow-lg shadow-black/10 sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2 id="start-title" className="font-[Poppins] text-3xl font-semibold leading-tight text-white sm:text-4xl">
                  {t("home.comeceAUsarOLogibotAiHoje")}</h2>
                <p className="mt-4 font-[Poppins] text-base leading-relaxed text-zinc-400">
                  {t("home.crieSuaContaParaAcessarOChat")}</p>
              </div>
              <button
                onClick={handleStart}
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-400/40 bg-blue-600 px-6 py-3 font-[Poppins] text-sm font-semibold text-on-accent shadow-md shadow-blue-900/30 transition-colors hover:bg-blue-700 lg:w-auto"
              >
                {t("home.criarContaGratuita")}<ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  useLocale();

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="home-section border-b border-white/10 px-5 py-12 sm:px-8 lg:py-16">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 max-w-3xl lg:mb-10">
          <p className="mb-4 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-blue-400">
            {eyebrow}
          </p>
          <h2 id={`${id}-title`} className="font-[Poppins] text-3xl font-semibold leading-tight text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 font-[Poppins] text-base leading-relaxed text-zinc-400">
            {description}
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}

function InfoCard({ children }: { children: ReactNode }) {
  useLocale();

  return (
    <article className="flex h-full flex-col gap-5 rounded-2xl border border-white/10 bg-surface p-6 shadow-lg shadow-black/10 transition-[transform,background-color,border-color] duration-300 hover:-translate-y-1 hover:border-blue-400/25 sm:min-h-[15rem] lg:p-8">
      {children}
    </article>
  );
}
