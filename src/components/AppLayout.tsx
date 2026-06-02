import { ReactNode, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart2,
  Brain,
  LayoutGrid,
  Menu,
  MessageCircle,
  Send,
  Settings,
  TableProperties,
  User,
} from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar/Sidebar";

interface AppLayoutProps {
  children?: ReactNode;
  pageTitle?: string;
  pageIcon?: ReactNode;
}

const PAGE_META: Record<string, { title: string; icon: ReactNode }> = {
  "/about": {
    title: "Meu Perfil",
    icon: <User className="w-4 h-4 text-gray-400" />,
  },
  "/inicio": {
    title: "Inicio",
    icon: <LayoutGrid className="w-4 h-4 text-gray-400" />,
  },
  "/chat": {
    title: "Chat",
    icon: <MessageCircle className="w-4 h-4 text-blue-400" />,
  },
  "/chart": {
    title: "Dashboard",
    icon: <BarChart2 className="w-4 h-4 text-blue-400" />,
  },
  "/crud": {
    title: "Cadastro",
    icon: <Settings className="w-4 h-4 text-gray-400" />,
  },
  "/list": {
    title: "Listagem",
    icon: <TableProperties className="w-4 h-4 text-gray-400" />,
  },
  "/feedbacks/send": {
    title: "Feedback",
    icon: <Send className="w-4 h-4 text-gray-400" />,
  },
  "/quiz": {
    title: "Quiz",
    icon: <Brain className="w-4 h-4 text-indigo-400" />,
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
        {/* Desktop sidebar — IS the background */}
        <aside className="hidden md:flex flex-col w-56 flex-shrink-0">
          <Sidebar />
        </aside>

        {/* Main content panel — inset card floating over the sidebar background */}
        <div className="flex-1 my-3 mr-3 rounded-2xl bg-neutral-900 overflow-hidden flex flex-col min-w-0">
          {/* Top bar — mobile only */}
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

          {/* Page content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {children ?? <Outlet />}
          </div>
        </div>

      {/* Mobile sidebar — drawer (needs its own bg since it floats above content) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 md:hidden flex-shrink-0 bg-neutral-950"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Sidebar onMobileClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
