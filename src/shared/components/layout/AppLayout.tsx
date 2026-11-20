import { useDialogFocus } from "@/shared/hooks/useDialogFocus";
import { t, useLocale } from "@/i18n";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "@/shared/preferences";
import {
  Brain,
  Menu,
  MessageCircle,
  PieChart,
  Target,
  Building2,
  Send,
  Settings,
  TableProperties,
  Table2,
  Languages,
  ListOrdered,
  Library,
  ClipboardCheck,
  ClipboardList,
  User,
  ThumbsUp,
  ToggleRight,
  Database,
  Inbox,
  FlaskConical,
} from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/shared/components/layout/Sidebar";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { useFeatures } from "@/features/release/hooks/useFeatures";
import { featureForPath } from "@/features/release/featureCatalog";
import { FeatureUnavailable } from "@/features/release/components/FeatureUnavailable";
import { SandboxBanner } from "@/features/dev/components/SandboxBanner";
import { AccountSwitchOverlay } from "@/features/dev/components/AccountSwitchOverlay";

interface AppLayoutProps {
  children?: ReactNode;
  pageTitle?: string;
  pageIcon?: ReactNode;
}

// Icon colour by area: learning (emerald), teaching and management (blue), administration (violet), account (amber).
const PAGE_META: Record<string, { title: string; icon: ReactNode }> = {
  "/chat": {
    get title() { return t("common.chat"); },
    icon: <MessageCircle className="w-4 h-4 text-emerald-400" />,
  },
  "/quiz": {
    get title() { return t("common.quiz"); },
    icon: <Brain className="w-4 h-4 text-emerald-400" />,
  },
  "/practice/truth-table": {
    get title() { return t("exercises.type.truthTable"); },
    icon: <Table2 className="w-4 h-4 text-emerald-400" />,
  },
  "/practice/translation": {
    get title() { return t("exercises.type.translation"); },
    icon: <Languages className="w-4 h-4 text-emerald-400" />,
  },
  "/practice/parsons": {
    get title() { return t("exercises.type.parsons"); },
    icon: <ListOrdered className="w-4 h-4 text-emerald-400" />,
  },
  "/questions": {
    get title() { return t("questions.navLabel"); },
    icon: <Library className="w-4 h-4 text-blue-400" />,
  },
  "/questions/new": {
    get title() { return t("questions.navLabel"); },
    icon: <Library className="w-4 h-4 text-blue-400" />,
  },
  "/exams": {
    get title() { return t("exams.navLabel"); },
    icon: <ClipboardCheck className="w-4 h-4 text-emerald-400" />,
  },
  "/exams/manage": {
    get title() { return t("exams.navLabel"); },
    icon: <ClipboardList className="w-4 h-4 text-blue-400" />,
  },
  "/exams/manage/new": {
    get title() { return t("exams.navLabel"); },
    icon: <ClipboardList className="w-4 h-4 text-blue-400" />,
  },
  "/dashboard": {
    get title() { return t("common.dashboard"); },
    icon: <PieChart className="w-4 h-4 text-blue-400" />,
  },
  "/institution": {
    get title() { return t("institutions.navLabel"); },
    icon: <Building2 className="w-4 h-4 text-blue-400" />,
  },
  "/concepts": {
    get title() { return t("concepts.navLabel"); },
    icon: <Target className="w-4 h-4 text-blue-400" />,
  },
  "/entities/create": {
    get title() { return t("common.criarEntidades"); },
    icon: <Settings className="w-4 h-4 text-violet-400" />,
  },
  "/entities": {
    get title() { return t("common.listarEntidades_735"); },
    icon: <TableProperties className="w-4 h-4 text-violet-400" />,
  },
  "/profile": {
    get title() { return t("common.meuPerfil"); },
    icon: <User className="w-4 h-4 text-amber-300" />,
  },
  "/feedback": {
    get title() { return t("common.feedback"); },
    icon: <Send className="w-4 h-4 text-amber-300" />,
  },
  "/quiz/manage": {
    get title() { return t("common.quizzes"); },
    icon: <Brain className="w-4 h-4 text-blue-400" />,
  },
  "/rag": {
    get title() { return t("common.baseRag"); },
    icon: <Database className="w-4 h-4 text-blue-400" />,
  },
  "/entities/manage": {
    get title() { return t("common.gestaoAcademica"); },
    icon: <Settings className="w-4 h-4 text-violet-400" />,
  },
  "/entities/links": {
    get title() { return t("common.gestaoAcademica"); },
    icon: <Settings className="w-4 h-4 text-violet-400" />,
  },
  "/admin/feedbacks": {
    get title() { return t("common.feedbacks"); },
    icon: <Inbox className="w-4 h-4 text-violet-400" />,
  },
  "/dev": {
    get title() { return t("dev.navLabel"); },
    icon: <FlaskConical className="w-4 h-4 text-violet-400" />,
  },
  "/admin/features": {
    get title() { return t("features.admin.navLabel"); },
    icon: <ToggleRight className="w-4 h-4 text-violet-400" />,
  },
  "/admin/chat-feedback": {
    get title() { return t("chatFeedback.admin.navLabel"); },
    icon: <ThumbsUp className="w-4 h-4 text-violet-400" />,
  },
};

const DRAWER_CLOSE_MS = 180;

export function AppLayout({ children, pageTitle, pageIcon }: AppLayoutProps) {
  const locale = useLocale();

  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileDialog = useDialogFocus<HTMLElement>(mobileOpen, () => setMobileOpen(false));
  // Keeps the drawer mounted while it slides out, so closing it does not cut abruptly.
  const reduceMotion = useReducedMotion();
  const [drawerMounted, setDrawerMounted] = useState(false);
  useEffect(() => {
    if (mobileOpen) {
      setDrawerMounted(true);
      return;
    }
    const timer = window.setTimeout(() => setDrawerMounted(false), reduceMotion ? 0 : DRAWER_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [mobileOpen, reduceMotion]);
  const drawerState = mobileOpen ? "open" : "closing";
  useEffect(() => {
    const drawer = mobileDialog.current;
    if (!drawer) return;
    if (drawerState === "closing") drawer.setAttribute("inert", "");
    else drawer.removeAttribute("inert");
  }, [drawerState, drawerMounted, mobileDialog]);
  const location = useLocation();
  const { isEnabled } = useFeatures();
  const pageFeature = featureForPath(location.pathname);
  const blocked = pageFeature !== null && !isEnabled(pageFeature);
  // Longest matching section, so nested pages (/quiz/123, /exams/manage/1/review) keep their title.
  const routeMeta = useMemo(() => {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    const key = Object.keys(PAGE_META)
      .filter((item) => path === item || path.startsWith(`${item}/`))
      .sort((a, b) => b.length - a.length)[0];
    return key ? PAGE_META[key] : undefined;
  }, [location.pathname]);
  const title = pageTitle ?? routeMeta?.title;
  const icon = pageIcon ?? routeMeta?.icon;

  return (
    <div className="flex h-screen bg-neutral-950">
      <AccountSwitchOverlay />
      <aside className="hidden md:flex flex-col flex-shrink-0">
        <Sidebar />
      </aside>

      <div className="flex-1 md:my-3 md:mr-3 md:rounded-2xl bg-neutral-900 overflow-hidden flex flex-col min-w-0">
        <SandboxBanner />
        <div data-mobile-header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 shrink-0">
          <button
            id="chat-header-menu-button"
            aria-label={t("navigation.open", {}, locale)}
            className="text-zinc-400 hover:text-white transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} />
          </button>
          {icon && (
            <span className="flex items-center gap-2 text-white/60">
              {icon}
              {title && (
                <span className="font-[Poppins] font-medium text-sm">
                  {title}
                </span>
              )}
            </span>
          )}
          {isEnabled("notifications") && <NotificationBell className="ml-auto" />}
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {blocked ? <FeatureUnavailable /> : children ?? <Outlet />}
        </div>
      </div>

      {(mobileOpen || drawerMounted) && (
        <>
          <div
            data-state={drawerState}
            className="mobile-drawer-backdrop fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            ref={mobileDialog}
            role={mobileOpen ? "dialog" : undefined}
            aria-modal={mobileOpen ? true : undefined}
            aria-label={mobileOpen ? t("navigation.open") : undefined}
            aria-hidden={mobileOpen ? undefined : true}
            data-state={drawerState}
            tabIndex={-1}
            className="mobile-drawer fixed inset-y-0 left-0 z-50 md:hidden flex-shrink-0 bg-neutral-950"
          >
            <Sidebar onMobileClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </div>
  );
}
