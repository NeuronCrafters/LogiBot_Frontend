import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-Auth";
import { ChatHistory } from "@/components/History/Chat/ChatHistory";
import { QuizHistory } from "@/components/History/Quiz/QuizHistory";
import {
  LayoutGrid,
  PieChart,
  Settings,
  TableProperties,
  User,
  Send,
  LogOut,
  X,
  Brain,
  MessageCircle,
} from "lucide-react";
import logoMascote from "@/assets/logo.svg";

interface SidebarProps {
  onMobileClose?: () => void;
}

type Role = "student" | "teacher" | "course-coordinator" | "admin";

const NAV_ITEMS = [
  {
    path: "/inicio",
    icon: <LayoutGrid className="w-4 h-4" />,
    label: "Início",
    show: (_: Role) => true,
  },
  {
    path: "/chart",
    icon: <PieChart className="w-4 h-4" />,
    label: "Dashboard",
    show: (r: Role) => ["teacher", "course-coordinator", "admin"].includes(r),
  },
  {
    path: "/crud",
    icon: <Settings className="w-4 h-4" />,
    label: "Criar Entidades",
    show: (r: Role) => ["admin", "course-coordinator"].includes(r),
  },
  {
    path: "/list",
    icon: <TableProperties className="w-4 h-4" />,
    label: "Listar Entidades",
    show: (r: Role) => ["admin", "teacher", "course-coordinator"].includes(r),
  },
  {
    path: "/about",
    icon: <User className="w-4 h-4" />,
    label: "Perfil",
    show: (_: Role) => true,
  },
  {
    path: "/feedbacks/send",
    icon: <Send className="w-4 h-4" />,
    label: "Feedback",
    show: (_: Role) => true,
  },
];

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
  const visibleNav = NAV_ITEMS.filter((item) => item.show(role));

  const handleLogout = () => {
    logout();
    onMobileClose?.();
  };

  return (
    <div className="flex flex-col h-full w-56">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-3 shrink-0">
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

      {/* Nav */}
      <nav id="header-menu-options" className="px-2 py-3 space-y-0.5 shrink-0">
        {visibleNav.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === "/inicio" &&
              ["/chat", "/quiz"].includes(location.pathname));
          return (
            <Link
              id={`menu-option-${item.path.replace(/^\//, "").replace(/\//g, "-")}`}
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-[Poppins] transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* History — students only */}
      {isStudent && (
        <div className="flex-1 flex flex-col min-h-0 border-t border-white/5">
          <div className="px-4 py-3 shrink-0">
            <span className="text-[11px] text-zinc-500 font-[Poppins] font-semibold uppercase tracking-wider">
              Histórico
            </span>
          </div>

          <div className="px-2 pb-2 shrink-0">
            <div className="flex bg-white/5 rounded-lg p-1 gap-1">
              <button
                onClick={() => setHistoryFilter("chat")}
                className={`flex items-center justify-center gap-1.5 flex-1 h-7 text-xs rounded-md transition-colors font-[Poppins] ${
                  historyFilter === "chat"
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <MessageCircle size={12} />
                Chat
              </button>
              <button
                onClick={() => setHistoryFilter("quiz")}
                className={`flex items-center justify-center gap-1.5 flex-1 h-7 text-xs rounded-md transition-colors font-[Poppins] ${
                  historyFilter === "quiz"
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Brain size={12} />
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

      {/* Logout */}
      <div className="p-3 border-t border-white/5 shrink-0">
        <button
          id="header-logout-button"
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg transition-colors font-[Poppins]"
        >
          <LogOut size={15} />
          Sair da conta
        </button>
      </div>
    </div>
  );
}
