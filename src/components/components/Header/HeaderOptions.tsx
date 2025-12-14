import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    User,
    PieChart,
    Settings,
    MessageSquare,
    TableProperties,
    Send,
} from "lucide-react";
import { motion } from "framer-motion";
import { Typograph } from "@/components/components/Typograph/Typograph";

interface MenuOptionsProps {
    role: "student" | "teacher" | "course-coordinator" | "admin";
}

export function MenuOptions({ role }: MenuOptionsProps) {
    const location = useLocation();

    const menuItems = [
        { show: true, path: "/about", icon: <User className="w-5 h-5" />, label: "Perfil", id: "menu-option-detalhes" },
        { show: ["teacher", "course-coordinator", "admin"].includes(role), path: "/chart", icon: <PieChart className="w-5 h-5" />, label: "Resultados", id: "menu-option-resultados" },
        { show: ["admin", "course-coordinator"].includes(role), path: "/crud", icon: <Settings className="w-5 h-5" />, label: "Criar Entidades", id: "menu-option-criar" },
        { show: ["admin", "teacher", "course-coordinator"].includes(role), path: "/list", icon: <TableProperties className="w-5 h-5" />, label: "Listar Entidades", id: "menu-option-listar" },
        { show: true, path: "/chat", icon: <MessageSquare className="w-5 h-5" />, label: "Chat e Quiz", id: "menu-option-chat" },
        { show: true, path: "/feedbacks/send", icon: <Send className="w-5 h-5" />, label: "Feedback", id: "menu-option-feedback" },
    ];

    return (
        <motion.nav
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col space-y-3 bg-[#141414] p-4 rounded-xl shadow-xl"
        >
            {menuItems
                .filter((item) => item.show)
                .map(({ path, icon, label, id }) => {
                    const isCurrent = location.pathname === path;

                    return isCurrent ? (
                        <div
                            key={path}
                            id={id}
                            className="flex items-center w-full gap-2 px-4 py-2 text-gray-500 bg-[#1f1f1f]/50 rounded-md cursor-not-allowed border border-transparent"
                        >
                            {icon}
                            <Typograph
                                text={label}
                                colorText="text-[#A1A1A1]"
                                variant="text4"
                                weight="regular"
                                fontFamily="poppins"
                            />
                        </div>
                    ) : (
                        <Link key={path} to={path} id={id}>
                            <Button
                                variant="ghost"
                                className="flex items-center justify-start w-full gap-2 text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-all duration-200"
                            >
                                {icon}
                                <Typograph
                                    text={label}
                                    colorText="text-[#E4E4E4] group-hover:text-white"
                                    variant="text4"
                                    weight="regular"
                                    fontFamily="poppins"
                                />
                            </Button>
                        </Link>
                    );
                })}
        </motion.nav>
    );
}