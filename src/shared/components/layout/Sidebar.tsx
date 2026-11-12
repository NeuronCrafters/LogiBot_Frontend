import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";
import { PreferencesMenu } from "@/shared/preferences/PreferencesControls";
import { t, useLocale } from "@/i18n";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ChatHistory } from "@/features/chat/components/ChatHistory";
import { QuizHistory } from "@/features/quiz/components/QuizHistory";
import {
  PieChart,
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
} from "lucide-react";
import logoMascote from "@/assets/logo.svg";

interface SidebarProps {
  onMobileClose?: () => void;
}

type Role = "student" | "teacher" | "course-coordinator" | "admin";

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
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
    ],
  },
  {
    get label() { return t("common.conta"); },
    items: [
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
  if (["teacher", "course-coordinator", "admin"].includes(role))
    gestao.push({
      path: "/quiz/manage",
      icon: <Brain className="w-4 h-4" />,
      label: t("common.quizzes"),
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
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  useLocale();

  return (
    <Link
      id={`menu-option-${item.path.replace(/^\//, "").replace(/\//g, "-")}`}
      to={item.path}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-[Poppins] transition-colors ${active ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
    >
      <span className={active ? "text-white" : "text-zinc-500"}>
        {item.icon}
      </span>
      {item.label}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  useLocale();

  return (
    <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-600 font-[Poppins]">
      {label}
    </p>
  );
}

export function Sidebar({ onMobileClose }: SidebarProps) {
  useLocale();

  const { user, logout } = useAuth();
  const location = useLocation();
  const [historyFilter, setHistoryFilter] = useState<"chat" | "quiz">("chat");

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
  const allSections = isStudent ? STUDENT_SECTIONS : buildStaffSections(role);
  const contaSection = allSections.find((s) => s.items.some(item => item.path === "/profile"));
  const sections = allSections.filter((s) => !s.items.some(item => item.path === "/profile"));

  const handleLogout = () => {
    logout();
    onMobileClose?.();
  };

  return (
    <div className="flex flex-col h-full w-60">
      <div className="flex items-center gap-2.5 px-4 py-4 shrink-0">
        <img
          src={logoMascote}
          alt={t("common.logibot")}
          className="brand-mark h-7 w-7 object-contain"
        />
        <span className="font-[Poppins] font-bold text-base text-white leading-none">
          LogiBot.AI
        </span>
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

      <div className="flex items-start gap-2 px-4 pb-3"><PreferencesMenu className="shrink-0" /><div className="min-w-0 flex-1"><LanguageSwitcher /></div></div>
      <nav id="header-menu-options" className="px-2 shrink-0 space-y-4">
        {sections.map((section, si) => (
          <div key={si}>
            <SectionLabel label={section.label} />
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  item={item}
                  active={location.pathname === item.path}
                  aria-label={t("navigation.close")}
            onClick={onMobileClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {isStudent && (
        <div className="flex-1 flex flex-col min-h-0 mt-4 border-t border-white/5">
          <div className="px-2 pt-3 pb-2 shrink-0 space-y-2">
            <SectionLabel label={t("common.historico")} />
            <div className="flex bg-white/5 rounded-lg p-1 gap-1">
              <button
                onClick={() => setHistoryFilter("chat")}
                className={`flex items-center justify-center gap-1.5 flex-1 h-7 text-xs rounded-md transition-colors font-[Poppins] ${historyFilter === "chat" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <MessageCircle size={11} />
                {t("common.chat")}</button>
              <button
                onClick={() => setHistoryFilter("quiz")}
                className={`flex items-center justify-center gap-1.5 flex-1 h-7 text-xs rounded-md transition-colors font-[Poppins] ${historyFilter === "quiz" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <Brain size={11} />
                {t("common.quiz")}</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {historyFilter === "chat" ? (
              <ChatHistory userId={user._id} closeMenu={onMobileClose} />
            ) : (
              <QuizHistory userId={user._id} closeMenu={onMobileClose} />
            )}
          </div>
        </div>
      )}

      {!isStudent && <div className="flex-1" />}

      <div className="px-2 pb-3 pt-3 border-t border-white/5 shrink-0">
        {contaSection && (
          <div className="mb-2">
            <SectionLabel label={contaSection.label} />
            <div className="space-y-0.5">
              {contaSection.items.map((item) => (
                <NavLink
                  key={item.path}
                  item={item}
                  active={location.pathname === item.path}
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
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors font-[Poppins]"
        >
          <LogOut size={15} />
          {t("common.sairDaConta")}</button>
      </div>
    </div>
  );
}
