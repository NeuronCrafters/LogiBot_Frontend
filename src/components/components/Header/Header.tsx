import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Menu as MenuIcon, History as HistoryIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-Auth";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Separator } from "@/components/ui/separator";
import { MenuOptions } from "@/components/components/Header/HeaderOptions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudySessionHistory } from "../UserAnalysis/UserAnalysis";

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

    const analysisData = {
        userId: user._id,
        name: user.name,
        className: "Turma A",
        totalUsageTime: 0,
        sessions: (user as any).sessions || []
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/50 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeMenu}
                    />

                    <motion.div
                        className="fixed inset-y-0 right-0 w-[350px] bg-[#1f1f1f] z-50 shadow-xl flex flex-col"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                onClick={closeMenu}
                                className="text-white hover:text-gray-300 transition-colors"
                            >
                                <X size={28} />
                            </button>
                        </div>

                        <div className="flex flex-col h-full pt-16">

                            <div className="px-6 flex flex-col items-center space-y-3 mb-6 shrink-0">
                                <div className="rainbow-avatar w-32 h-32 rounded-full">
                                    <Avatar
                                        seed={user._id}
                                        backgroundColor="#2a2a2a"
                                        className="w-full h-full rounded-full"
                                    />
                                </div>

                                <Typograph
                                    text={user.name}
                                    colorText="text-[#E4E4E4]"
                                    variant="text2"
                                    weight="bold"
                                    fontFamily="poppins"
                                />

                                <Typograph
                                    text={rawRoles
                                        .map((r) =>
                                            r === "admin"
                                                ? "Administrador"
                                                : r === "professor"
                                                    ? "Professor"
                                                    : r === "course-coordinator"
                                                        ? "Coordenador de Curso"
                                                        : "Estudante"
                                        )
                                        .join(", ")}
                                    colorText="text-gray-400"
                                    variant="text4"
                                    weight="regular"
                                    fontFamily="poppins"
                                />
                            </div>

                            <Tabs
                                defaultValue="menu"
                                value={activeTab}
                                onValueChange={setActiveTab}
                                className="flex-1 flex flex-col overflow-hidden"
                            >
                                <div className="px-6 mb-4">
                                    <TabsList className="grid w-full grid-cols-2 bg-[#2a2a2a] text-gray-400">
                                        <TabsTrigger
                                            value="menu"
                                            className="data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white"
                                        >
                                            <MenuIcon size={16} className="mr-2" /> Menu
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="history"
                                            className="data-[state=active]:bg-[#3a3a3a] data-[state=active]:text-white"
                                        >
                                            <HistoryIcon size={16} className="mr-2" /> Histórico
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <Separator className="bg-[#2a2a2a]" />

                                <TabsContent value="menu" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
                                    <div id="header-menu-options">
                                        <MenuOptions
                                            role={menuRole as any}
                                            logout={() => {
                                                logout();
                                                closeMenu();
                                            }}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="history" className="flex-1 overflow-hidden mt-0 h-full">
                                    <div className="h-full w-full pb-4">
                                        <StudySessionHistory data={analysisData} />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}