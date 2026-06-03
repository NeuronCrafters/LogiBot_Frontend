import { ReactNode, useMemo, useState } from "react";
import {
  Brain,
  Menu,
  MessageCircle,
  PieChart,
  Send,
  Settings,
  TableProperties,
  User,
} from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/shared/components/layout/Sidebar";

interface AppLayoutProps {
  children?: ReactNode;
  pageTitle?: string;
  pageIcon?: ReactNode;
}

const PAGE_META: Record<string, { title: string; icon: ReactNode }> = {
  "/chat": {
    title: "Chat",
    icon: <MessageCircle className="w-4 h-4 text-blue-400" />,
  },
  "/quiz": {
    title: "Quiz",
    icon: <Brain className="w-4 h-4 text-indigo-400" />,
  },
  "/dashboard": {
    title: "Dashboard",
    icon: <PieChart className="w-4 h-4 text-blue-400" />,
  },
  "/entities/create": {
    title: "Criar Entidades",
    icon: <Settings className="w-4 h-4 text-zinc-400" />,
  },
  "/entities": {
    title: "Listar Entidades",
    icon: <TableProperties className="w-4 h-4 text-zinc-400" />,
  },
  "/profile": {
    title: "Meu Perfil",
    icon: <User className="w-4 h-4 text-zinc-400" />,
  },
  "/feedback": {
    title: "Feedback",
    icon: <Send className="w-4 h-4 text-zinc-400" />,
  },
};

export function AppLayout({ children, pageTitle, pageIcon }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const routeMeta = useMemo(
    () => PAGE_META[location.pathname],
    [location.pathname],
  );
  const title = pageTitle ?? routeMeta?.title;
  const icon = pageIcon ?? routeMeta?.icon;

  return (
    <div className="flex h-screen bg-neutral-950">
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0">
        <Sidebar />
      </aside>

      <div className="flex-1 md:my-3 md:mr-3 md:rounded-2xl bg-neutral-900 overflow-hidden flex flex-col min-w-0">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 shrink-0">
          <button
            id="chat-header-menu-button"
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
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {children ?? <Outlet />}
        </div>
      </div>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 md:hidden flex-shrink-0 bg-neutral-950">
            <Sidebar onMobileClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </div>
  );
}
