import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/use-Auth";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Separator } from "@/components/ui/separator";
import { MenuOptions } from "@/components/components/Header/HeaderOptions";

interface HeaderProps {
    isOpen: boolean;
    closeMenu: () => void;
}

export function Header({ isOpen, closeMenu }: HeaderProps) {
    const { user, logout } = useAuth();
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

                        <div className="p-6 pt-16 flex-1 overflow-y-auto">
                            <div className="flex flex-col items-center space-y-3 mb-6">
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

                            <Separator className="bg-[#2a2a2a] mb-4" />

                            <div id="header-menu-options">
                                <MenuOptions
                                    role={menuRole as
                                        | "student"
                                        | "teacher"
                                        | "course-coordinator"
                                        | "admin"}
                                    logout={() => {
                                        logout();
                                        closeMenu();
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}