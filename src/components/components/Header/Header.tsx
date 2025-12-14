import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Menu as MenuIcon, History as HistoryIcon, LogOut, MessageSquare, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/use-Auth";
import { Separator } from "@/components/ui/separator";
import { MenuOptions } from "./HeaderOptions";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { ChatHistory } from "@/components/components/History/Chat/ChatHistory";
import { QuizHistory } from "@/components/components/History/Quiz/QuizHistory";

interface HeaderProps {
    isOpen: boolean;
    closeMenu: () => void;
}

export function Header({ isOpen, closeMenu }: HeaderProps) {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState("menu");
    const [historyFilter, setHistoryFilter] = useState<"chat" | "quiz">("chat");

    if (!user) return null;

    const rawRoles = Array.isArray(user.role) ? user.role : [user.role];
    const isAdmin = rawRoles.includes("admin");
    const isCoordinator = rawRoles.includes("course-coordinator");
    const isProfessor = rawRoles.includes("professor");

    const menuRole = isAdmin
        ? "admin"
        : isCoordinator
            ? "course-coordinator"
            : isProfessor
                ? "teacher"
                : "student";

    const isStudent = menuRole === "student";

    const displayCourseName = Array.isArray(user.courseName)
        ? user.courseName.join(", ")
        : user.courseName ?? "-";

    const handleLogout = () => {
        logout();
        closeMenu();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeMenu}
                    />

                    <motion.div
                        className="fixed inset-y-0 right-0 w-[320px] sm:w-[350px] bg-[#1f1f1f] z-50 shadow-2xl flex flex-col border-l border-zinc-800"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <div className="pt-4 px-4 pb-2 shrink-0 bg-[#1f1f1f] z-20">
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={closeMenu}
                                    aria-label="Fechar menu"
                                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <Tabs
                                defaultValue="menu"
                                value={activeTab}
                                onValueChange={setActiveTab}
                                className="w-full"
                            >
                                <TabsList className={`grid w-full bg-[#2a2a2a] text-zinc-400 ${isStudent ? "grid-cols-2" : "grid-cols-1"}`}>
                                    <TabsTrigger
                                        value="menu"
                                        className="data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white hover:text-white transition-colors"
                                    >
                                        <MenuIcon size={16} className="mr-2" /> Menu
                                    </TabsTrigger>

                                    {isStudent && (
                                        <TabsTrigger
                                            value="history"
                                            className="data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white hover:text-white transition-colors"
                                        >
                                            <HistoryIcon size={16} className="mr-2" /> Histórico
                                        </TabsTrigger>
                                    )}
                                </TabsList>
                            </Tabs>
                        </div>

                        <Separator className="bg-zinc-800 shrink-0" />

                        <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
                            <div
                                className={`flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none] ${activeTab === "menu" ? "block" : "hidden"}`}
                            >
                                <MenuOptions role={menuRole as any} />
                            </div>

                            {isStudent && (
                                <div
                                    className={`flex-1 h-full overflow-hidden flex flex-col ${activeTab === "history" ? "flex" : "hidden"}`}
                                >
                                    <div className="px-6 pt-6 pb-2 shrink-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <HistoryIcon className="text-blue-500" size={20} />
                                            <Typograph
                                                text="Histórico de Sessões"
                                                colorText="text-white"
                                                variant="text5"
                                                weight="bold"
                                                fontFamily="poppins"
                                            />
                                        </div>
                                        <Typograph
                                            text={`${user.name} • ${displayCourseName}`}
                                            colorText="text-zinc-500"
                                            variant="text7"
                                            weight="medium"
                                            fontFamily="poppins"
                                        />
                                    </div>

                                    <div className="px-6 py-2 shrink-0">
                                        <div className="flex p-1 bg-[#2a2a2a] rounded-lg">
                                            <button
                                                onClick={() => setHistoryFilter("chat")}
                                                className={`flex-1 py-1.5 text-xs font-medium font-poppins rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${historyFilter === "chat"
                                                    ? "bg-[#3a3a3a] text-white shadow-sm"
                                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                                                    }`}
                                            >
                                                <MessageSquare size={14} className={historyFilter === "chat" ? "text-blue-400" : ""} />
                                                Chat
                                            </button>
                                            <button
                                                onClick={() => setHistoryFilter("quiz")}
                                                className={`flex-1 py-1.5 text-xs font-medium font-poppins rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${historyFilter === "quiz"
                                                    ? "bg-[#3a3a3a] text-white shadow-sm"
                                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                                                    }`}
                                            >
                                                <GraduationCap size={14} className={historyFilter === "quiz" ? "text-purple-400" : ""} />
                                                Quiz
                                            </button>
                                        </div>
                                    </div>

                                    <Separator className="bg-zinc-800 mt-2 shrink-0" />

                                    <div className="flex-1 w-full overflow-y-auto px-1 pb-4 pt-4">
                                        {historyFilter === "chat" ? (
                                            <ChatHistory
                                                userId={user._id}
                                                closeMenu={closeMenu}
                                            />
                                        ) : (
                                            <QuizHistory
                                                userId={user._id}
                                                closeMenu={closeMenu}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {activeTab === "menu" && (
                            <div className="p-4 border-t border-zinc-800 bg-[#1a1a1a] shrink-0">
                                <Button
                                    id="header-logout-button"
                                    variant="ghost"
                                    onClick={handleLogout}
                                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30 gap-3 h-12 transition-all duration-200"
                                >
                                    <LogOut size={18} />
                                    <span className="font-medium font-poppins">Sair da Conta</span>
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}