import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Menu as MenuIcon, History as HistoryIcon, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-Auth";
import { Separator } from "@/components/ui/separator";
import { MenuOptions } from "./HeaderOptions";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudySessionHistory } from "../UserAnalysis/UserAnalysis";
import { Button } from "@/components/ui/button";

interface HeaderProps {
    isOpen: boolean;
    closeMenu: () => void;
}

export function Header({ isOpen, closeMenu }: HeaderProps) {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState("menu");

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

    const displayCourseName = Array.isArray(user.courseName)
        ? user.courseName.join(", ")
        : user.courseName ?? "-";

    const analysisData = {
        userId: user._id,
        name: user.name,
        className: displayCourseName,
        totalUsageTime: 0,
        sessions: (user as any).sessions || []
    };

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
                                <TabsList className="grid w-full grid-cols-2 bg-[#2a2a2a] text-zinc-400">
                                    <TabsTrigger
                                        value="menu"
                                        className="data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white hover:text-white transition-colors"
                                    >
                                        <MenuIcon size={16} className="mr-2" /> Menu
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="history"
                                        className="data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white hover:text-white transition-colors"
                                    >
                                        <HistoryIcon size={16} className="mr-2" /> Histórico
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <Separator className="bg-zinc-800 shrink-0" />

                        <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
                            <div
                                className={`flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none] ${activeTab === "menu" ? "block" : "hidden"}`}
                            >
                                <MenuOptions
                                    role={menuRole as any}
                                />
                            </div>

                            <div
                                className={`flex-1 h-full overflow-hidden flex flex-col ${activeTab === "history" ? "flex" : "hidden"}`}
                            >
                                <div className="flex-1 w-full overflow-y-auto px-1 pb-4">
                                    <StudySessionHistory data={analysisData} />
                                </div>
                            </div>
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