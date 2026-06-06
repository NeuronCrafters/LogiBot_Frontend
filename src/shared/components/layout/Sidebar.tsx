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
  Clock,
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
    label: "Aprendizado",
    items: [
      {
        path: "/chat",
        icon: <MessageCircle className="w-4 h-4" />,
        label: "Chat",
      },
      { path: "/quiz", icon: <Brain className="w-4 h-4" />, label: "Quiz" },
    ],
  },
  {
    label: "Conta",
    items: [
      { path: "/profile", icon: <User className="w-4 h-4" />, label: "Perfil" },
      {
        path: "/feedback",
        icon: <Send className="w-4 h-4" />,
        label: "Feedback",
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
      label: "Dashboard",
    });
  if (["teacher", "course-coordinator", "admin"].includes(role))
    gestao.push({
      path: "/quiz/manage",
      icon: <Brain className="w-4 h-4" />,
      label: "Quizzes",
    });
  if (["teacher", "course-coordinator", "admin"].includes(role))
    gestao.push({
      path: "/rag",
      icon: <Database className="w-4 h-4" />,
      label: "Base RAG",
    });
  if (["admin", "course-coordinator"].includes(role))
    gestao.push({
      path: "/entities/manage",
      icon: <Settings className="w-4 h-4" />,
      label: "Gestão Acadêmica",
    });
  if (role === "admin")
    gestao.push({
      path: "/admin/feedbacks",
      icon: <Inbox className="w-4 h-4" />,
      label: "Feedbacks",
    });
  if (["admin", "teacher", "course-coordinator"].includes(role))
    gestao.push({
      path: "/entities",
      icon: <TableProperties className="w-4 h-4" />,
      label: "Listar Entidades",
    });
  return [
    { label: "Gestão", items: gestao },
    {
      label: "Conta",
      items: [
        {
          path: "/profile",
          icon: <User className="w-4 h-4" />,
          label: "Perfil",
        },
        {
          path: "/feedback",
          icon: <Send className="w-4 h-4" />,
          label: "Feedback",
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
  return (
    <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 font-[Poppins]">
      {label}
    </p>
  );
}

export function Sidebar({ onMobileClose }: SidebarProps) {
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
  const contaSection = allSections.find((s) => s.label === "Conta");
  const sections = allSections.filter((s) => s.label !== "Conta");

  const handleLogout = () => {
    logout();
    onMobileClose?.();
  };

  return (
    <div className="flex flex-col h-full w-56">
      <div className="flex items-center gap-2.5 px-4 py-4 shrink-0">
        <img
          src={logoMascote}
          alt="LogiBots"
          className="h-7 w-7 object-contain"
        />
        <span className="font-[Poppins] font-bold text-[16px] text-white leading-none">
          LogiBots.AI
        </span>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="ml-auto p-1 text-zinc-500 hover:text-white transition-colors rounded"
          >
            <X size={18} />
          </button>
        )}
      </div>

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
                  onClick={onMobileClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {isStudent && (
        <div className="flex-1 flex flex-col min-h-0 mt-4 border-t border-white/5">
          <div className="px-2 pt-4 pb-2 shrink-0">
            <div className="flex items-center justify-between px-1 mb-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-zinc-600" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 font-[Poppins]">
                  Histórico
                </p>
              </div>
            </div>
            <div className="flex bg-white/5 rounded-lg p-1 gap-1">
              <button
                onClick={() => setHistoryFilter("chat")}
                className={`flex items-center justify-center gap-1.5 flex-1 h-7 text-xs rounded-md transition-colors font-[Poppins] ${historyFilter === "chat" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <MessageCircle size={11} />
                Chat
              </button>
              <button
                onClick={() => setHistoryFilter("quiz")}
                className={`flex items-center justify-center gap-1.5 flex-1 h-7 text-xs rounded-md transition-colors font-[Poppins] ${historyFilter === "quiz" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <Brain size={11} />
                Quiz
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2 [&::-webkit-scrollbar]:hidden">
            {historyFilter === "chat" ? (
              <ChatHistory userId={user._id} closeMenu={onMobileClose} />
            ) : (
              <QuizHistory userId={user._id} closeMenu={onMobileClose} />
            )}
          </div>
        </div>
      )}

      {!isStudent && <div className="flex-1" />}

      <div className="px-2 pb-1 pt-3 border-t border-white/5 shrink-0">
        {contaSection && (
          <div className="mb-2">
            <SectionLabel label={contaSection.label} />
            <div className="space-y-0.5">
              {contaSection.items.map((item) => (
                <NavLink
                  key={item.path}
                  item={item}
                  active={location.pathname === item.path}
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
          Sair da conta
        </button>
      </div>
    </div>
  );
}
