import { useDialogFocus } from "@/shared/hooks/useDialogFocus";
import { t, useLocale } from "@/i18n";
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
    get title() { return t("common.chat"); },
    icon: <MessageCircle className="w-4 h-4 text-blue-400" />,
  },
  "/quiz": {
    get title() { return t("common.quiz"); },
    icon: <Brain className="w-4 h-4 text-indigo-400" />,
  },
  "/dashboard": {
    get title() { return t("common.dashboard"); },
    icon: <PieChart className="w-4 h-4 text-blue-400" />,
  },
  "/entities/create": {
    get title() { return t("common.criarEntidades"); },
    icon: <Settings className="w-4 h-4 text-zinc-400" />,
  },
  "/entities": {
    get title() { return t("common.listarEntidades_735"); },
    icon: <TableProperties className="w-4 h-4 text-zinc-400" />,
  },
  "/profile": {
    get title() { return t("common.meuPerfil"); },
    icon: <User className="w-4 h-4 text-zinc-400" />,
  },
  "/feedback": {
    get title() { return t("common.feedback"); },
    icon: <Send className="w-4 h-4 text-zinc-400" />,
  },
};

export function AppLayout({ children, pageTitle, pageIcon }: AppLayoutProps) {
  const locale = useLocale();

  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileDialog = useDialogFocus<HTMLElement>(mobileOpen, () => setMobileOpen(false));
  const location = useLocation();
  const routeMeta = useMemo(
    () => PAGE_META[location.pathname],
    [location.pathname],
  );
  const title = pageTitle ?? routeMeta?.title;
  const icon = pageIcon ?? routeMeta?.icon;

  return (
    <div className="flex h-screen bg-neutral-950">
      <aside className="hidden md:flex flex-col flex-shrink-0">
        <Sidebar />
      </aside>

      <div className="flex-1 md:my-3 md:mr-3 md:rounded-2xl bg-neutral-900 overflow-hidden flex flex-col min-w-0">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 shrink-0">
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
          <aside ref={mobileDialog} role="dialog" aria-modal="true" aria-label={t("navigation.open")} tabIndex={-1} className="fixed inset-y-0 left-0 z-50 md:hidden flex-shrink-0 bg-neutral-950">
            <Sidebar onMobileClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </div>
  );
}
