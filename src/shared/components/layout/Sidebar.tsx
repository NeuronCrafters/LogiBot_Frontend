import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";
import { PreferencesMenu } from "@/shared/preferences/PreferencesControls";
import { t, useLocale } from "@/i18n";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ChatHistory } from "@/features/chat/components/ChatHistory";
import { QuizHistory } from "@/features/quiz/components/QuizHistory";
import {
  PieChart,
  Target,
  Building2,
  Settings,
  TableProperties,
  User,
  Send,
  LogOut,
  X,
  Brain,
  Database,
  MessageCircle,
  Inbox,
  ToggleRight,
  FlaskConical,
  ThumbsUp,
  Table2,
  Languages,
  ListOrdered,
  Library,
  ClipboardCheck,
  ClipboardList,
  PanelLeftClose,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";

const COLLAPSED_KEY = "logibot.sidebar.collapsed";
const readCollapsed = () => {
  try { return localStorage.getItem(COLLAPSED_KEY) === "1"; } catch { return false; }
};
import logoMascote from "@/assets/logo.svg";
import { preloadPracticePage } from "@/shared/navigation/preloadPractice";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { useFeatures } from "@/features/release/hooks/useFeatures";
import { RAIL_TOGGLE_CLASS, RAIL_TOGGLE_ICON_CLASS } from "@/shared/components/layout/railToggle";
import { featureForPath } from "@/features/release/featureCatalog";

interface SidebarProps {
  onMobileClose?: () => void;
}

type Role = "student" | "teacher" | "course-coordinator" | "admin";

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  /** Loads the page code ahead, so the route fade does not fall back to the full-screen loader. */
  preload?: () => Promise<unknown>;
}
interface NavSection {
  label: string;
  items: NavItem[];
}

const STUDENT_SECTIONS: NavSection[] = [
  {
    get label() { return t("common.aprendizado"); },
    items: [
      {
        path: "/chat",
        icon: <MessageCircle className="w-4 h-4" />,
        get label() { return t("common.chat"); },
      },
      { path: "/quiz", icon: <Brain className="w-4 h-4" />, get label() { return t("common.quiz"); } },
      { path: "/practice/truth-table", icon: <Table2 className="w-4 h-4" />, get label() { return t("exercises.type.truthTable"); }, preload: preloadPracticePage },
      { path: "/practice/translation", icon: <Languages className="w-4 h-4" />, get label() { return t("exercises.type.translation"); }, preload: preloadPracticePage },
      { path: "/practice/parsons", icon: <ListOrdered className="w-4 h-4" />, get label() { return t("exercises.type.parsons"); }, preload: preloadPracticePage },
      { path: "/exams", icon: <ClipboardCheck className="w-4 h-4" />, get label() { return t("exams.navLabel"); } },
    ],
  },
  {
    get label() { return t("common.conta"); },
    items: [
      { path: "/institution", icon: <Building2 className="w-4 h-4" />, get label() { return t("institutions.navLabel"); } },
      { path: "/profile", icon: <User className="w-4 h-4" />, get label() { return t("common.perfil"); } },
      {
        path: "/feedback",
        icon: <Send className="w-4 h-4" />,
        get label() { return t("common.feedback"); },
      },
    ],
  },
];

function buildStaffSections(role: Role): NavSection[] {
  const gestao: NavItem[] = [];
  if (["teacher", "course-coordinator", "admin"].includes(role))
    gestao.push({
      path: "/dashboard",
      icon: <PieChart className="w-4 h-4" />,
      label: t("common.dashboard"),
    });
  gestao.push({
    path: "/institution",
    icon: <Building2 className="w-4 h-4" />,
    label: t("institutions.navLabel"),
  });
  if (["teacher", "course-coordinator", "admin"].includes(role))
    gestao.push({
      path: "/concepts",
      icon: <Target className="w-4 h-4" />,
      label: t("concepts.navLabel"),
    });
  if (["teacher", "course-coordinator", "admin"].includes(role))
    gestao.push({
      path: "/quiz/manage",
      icon: <Brain className="w-4 h-4" />,
      label: t("common.quizzes"),
    });
  if (["teacher", "course-coordinator", "admin"].includes(role))
    gestao.push({
      path: "/questions",
      icon: <Library className="w-4 h-4" />,
      label: t("questions.navLabel"),
    });
  if (["teacher", "course-coordinator", "admin"].includes(role))
    gestao.push({
      path: "/exams/manage",
      icon: <ClipboardList className="w-4 h-4" />,
      label: t("exams.navLabel"),
    });
  if (["teacher", "course-coordinator", "admin"].includes(role))
    gestao.push({
      path: "/rag",
      icon: <Database className="w-4 h-4" />,
      label: t("common.baseRag"),
    });
  if (["admin", "course-coordinator"].includes(role))
    gestao.push({
      path: "/entities/manage",
      icon: <Settings className="w-4 h-4" />,
      label: t("common.gestaoAcademica"),
    });
  if (role === "admin")
    gestao.push({
      path: "/admin/feedbacks",
      icon: <Inbox className="w-4 h-4" />,
      label: t("common.feedbacks"),
    });
  if (role === "admin")
    gestao.push({
      path: "/admin/chat-feedback",
      icon: <ThumbsUp className="w-4 h-4" />,
      label: t("chatFeedback.admin.navLabel"),
    });
  if (role === "admin")
    gestao.push({
      path: "/admin/features",
      icon: <ToggleRight className="w-4 h-4" />,
      label: t("features.admin.navLabel"),
    });
  if (["admin", "teacher", "course-coordinator"].includes(role))
    gestao.push({
      path: "/entities",
      icon: <TableProperties className="w-4 h-4" />,
      label: t("common.listarEntidades_735"),
    });
  return [
    { label: t("common.gestao"), items: gestao },
    {
      label: t("common.conta"),
      items: [
        {
          path: "/profile",
          icon: <User className="w-4 h-4" />,
          label: t("common.perfil"),
        },
        {
          path: "/feedback",
          icon: <Send className="w-4 h-4" />,
          label: t("common.feedback"),
        },
      ],
    },
  ];
}

function NavLink({
  item,
  active,
  onClick,
  compact = false,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
  /** Icon rail: the name fades out but stays the link's accessible name, and shows as a tooltip. */
  compact?: boolean;
}) {
  useLocale();
  const preload = item.preload;
  const warmUp = preload ? () => { void preload().catch(() => {}); } : undefined;

  return (
    <Link
      id={`menu-option-${item.path.replace(/^\//, "").replace(/\//g, "-")}`}
      to={item.path}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      onPointerEnter={warmUp}
      onFocus={warmUp}
      title={compact ? item.label : undefined}
      className={`relative flex min-h-9 items-center rounded-lg text-sm font-[Poppins] transition-colors ${compact ? "mx-auto h-10 w-10 justify-center" : "gap-3 px-3 py-2"} ${active ? "bg-blue-500/15 font-medium text-white ring-1 ring-inset ring-blue-400/30" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
    >
      <span className={cn("shrink-0", active ? "text-blue-300" : "text-zinc-500")}>
        {item.icon}
      </span>
      <span className={cn("side-rail-fade whitespace-nowrap", compact && "pointer-events-none absolute left-full opacity-0")}>{item.label}</span>
    </Link>
  );
}

function SectionLabel({ label, compact = false }: { label: string; compact?: boolean }) {
  useLocale();

  return (
    <p aria-hidden={compact || undefined} className={cn("side-rail-fade px-3 mb-1 whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-zinc-600 font-[Poppins]", compact && "opacity-0")}>
      {label}
    </p>
  );
}

export function Sidebar({ onMobileClose }: SidebarProps) {
  useLocale();

  const { user, logout } = useAuth();
  const { isEnabled } = useFeatures();
  const location = useLocation();
  // Desktop only: the menu collapses to an icon rail (the phone keeps its drawer).
  const collapsible = !onMobileClose;
  const [collapsedState, setCollapsedState] = useState(readCollapsed);
  const collapsed = collapsible && collapsedState;
  const toggleCollapsed = () => setCollapsedState((current) => {
    try { localStorage.setItem(COLLAPSED_KEY, current ? "0" : "1"); } catch { /* storage unavailable */ }
    return !current;
  });
  const [historyFilter, setHistoryFilter] = useState<"chat" | "quiz">(() =>
    location.pathname === "/quiz" || location.pathname.startsWith("/quiz/") ? "quiz" : "chat",
  );
  useEffect(() => {
    if (location.pathname === "/quiz" || location.pathname.startsWith("/quiz/")) setHistoryFilter("quiz");
    else if (location.pathname === "/chat" || location.pathname.startsWith("/chat/")) setHistoryFilter("chat");
  }, [location.pathname]);

  if (!user) return null;

  const rawRoles = Array.isArray(user.role) ? user.role : [user.role];
  const role: Role = rawRoles.includes("admin")
    ? "admin"
    : rawRoles.includes("course-coordinator")
      ? "course-coordinator"
      : rawRoles.includes("professor") || rawRoles.includes("teacher")
        ? "teacher"
        : "student";
  const isStudent = role === "student";
  // Features not released for the person disappear from the menu (and their pages are blocked).
  const released = (item: NavItem) => {
    const feature = featureForPath(item.path);
    return !feature || isEnabled(feature);
  };
  const ownerItem: NavItem = { path: "/dev", icon: <FlaskConical className="w-4 h-4" />, label: t("dev.navLabel") };
  const allSections = (isStudent ? STUDENT_SECTIONS : buildStaffSections(role))
    // Releasing features and the test environment belong to the platform owner only.
    .map((section) => {
      const items = section.items.filter((item) => item.path !== "/admin/features" || user.isOwner);
      return user.isOwner && section.items.some((item) => item.path === "/admin/chat-feedback") ? { label: section.label, items: [...items, ownerItem] } : { label: section.label, items };
    })
    .map((section) => ({ label: section.label, items: section.items.filter(released) }))
    .filter((section) => section.items.length > 0);
  const chatHistory = isEnabled("chat");
  const quizHistory = isEnabled("quiz");
  const historyShown = !chatHistory ? "quiz" : !quizHistory ? "chat" : historyFilter;
  // Only the most specific item is current (/entities/manage must not also light up /entities).
  const matches = (path: string) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const activePath = allSections
    .reduce((all, section) => all.concat(section.items.map((item) => item.path)), [] as string[])
    .filter(matches)
    .sort((a, b) => b.length - a.length)[0];
  const contaSection = allSections.find((s) => s.items.some(item => item.path === "/profile"));
  const sections = allSections.filter((s) => !s.items.some(item => item.path === "/profile"));

  const handleLogout = () => {
    logout();
    onMobileClose?.();
  };

  return (
    <div data-collapsed={collapsed || undefined} className={cn("side-rail flex h-full flex-col overflow-hidden", collapsed ? "w-16" : "w-60")}>
      <div className={cn("flex shrink-0 gap-2.5 py-4", collapsed ? "flex-col items-center px-2" : "items-center px-4")}>
        <img
          src={logoMascote}
          alt={t("common.logibot")}
          className="brand-mark h-7 w-7 object-contain"
        />
        {!collapsed && (
          <span className="font-[Poppins] font-bold text-base text-white leading-none whitespace-nowrap">
            LogiBots.AI
          </span>
        )}
        {!onMobileClose && isEnabled("notifications") && <NotificationBell className={collapsed ? "" : "ml-auto"} />}
        {collapsible && (
          <button type="button" onClick={toggleCollapsed} aria-expanded={!collapsed} data-sidebar-toggle
            aria-label={collapsed ? t("navigation.expandMenu") : t("navigation.collapseMenu")} title={collapsed ? t("navigation.expandMenu") : t("navigation.collapseMenu")}
            className={RAIL_TOGGLE_CLASS}>
            <PanelLeftClose aria-hidden="true" className={cn("side-rail-icon", RAIL_TOGGLE_ICON_CLASS, collapsed && "rotate-180")} />
          </button>
        )}
        {onMobileClose && (
          <button
            aria-label={t("navigation.close")}
            onClick={onMobileClose}
            className="ml-auto p-1 text-zinc-500 hover:text-white transition-colors rounded"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className={cn("flex items-start gap-2 pb-3", collapsed ? "justify-center px-2" : "px-4")}>
        <PreferencesMenu className="shrink-0" />
        {!collapsed && <div className="min-w-0 flex-1"><LanguageSwitcher /></div>}
      </div>
      <nav id="header-menu-options" className="px-2 shrink-0 space-y-4">
        {sections.map((section, si) => (
          <div key={si}>
            <SectionLabel label={section.label} compact={collapsed} />
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  item={item}
                  compact={collapsed}
                  active={item.path === activePath}
                  aria-label={t("navigation.close")}
            onClick={onMobileClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {isStudent && !collapsed && (chatHistory || quizHistory) && (
        <div className="flex-1 flex flex-col min-h-0 mt-4 border-t border-white/5">
          <div className="px-2 pt-3 pb-2 shrink-0 space-y-2">
            <SectionLabel label={t("common.historico")} />
            {chatHistory && quizHistory && <div className="flex bg-white/5 rounded-lg p-1 gap-1">
              <button
                onClick={() => setHistoryFilter("chat")}
                aria-pressed={historyFilter === "chat"}
                className={`flex items-center justify-center gap-1.5 flex-1 h-7 text-xs rounded-md transition-colors font-[Poppins] ${historyFilter === "chat" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <MessageCircle size={11} />
                {t("common.chat")}</button>
              <button
                onClick={() => setHistoryFilter("quiz")}
                aria-pressed={historyFilter === "quiz"}
                className={`flex items-center justify-center gap-1.5 flex-1 h-7 text-xs rounded-md transition-colors font-[Poppins] ${historyFilter === "quiz" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <Brain size={11} />
                {t("common.quiz")}</button>
            </div>}
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {historyShown === "chat" ? (
              <ChatHistory userId={user._id} closeMenu={onMobileClose} />
            ) : (
              <QuizHistory userId={user._id} closeMenu={onMobileClose} />
            )}
          </div>
        </div>
      )}

      {(!isStudent || collapsed || !(chatHistory || quizHistory)) && <div className="flex-1" />}

      <div className="px-2 pb-3 pt-3 border-t border-white/5 shrink-0">
        {contaSection && (
          <div className="mb-2">
            <SectionLabel label={contaSection.label} compact={collapsed} />
            <div className="space-y-0.5">
              {contaSection.items.map((item) => (
                <NavLink
                  key={item.path}
                  item={item}
                  compact={collapsed}
                  active={item.path === activePath}
                  aria-label={t("navigation.close")}
            onClick={onMobileClose}
                />
              ))}
            </div>
          </div>
        )}
        <button
          id="header-logout-button"
          onClick={handleLogout}
          title={collapsed ? t("common.sairDaConta") : undefined}
          className={cn("relative flex items-center text-sm text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors font-[Poppins]", collapsed ? "mx-auto h-10 w-10 justify-center" : "w-full gap-2.5 px-3 py-2")}
        >
          <LogOut size={15} className="shrink-0" />
          <span className={cn("side-rail-fade whitespace-nowrap", collapsed && "pointer-events-none absolute left-full opacity-0")}>{t("common.sairDaConta")}</span></button>
      </div>
    </div>
  );
}
