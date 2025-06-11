import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  User,
  PieChart,
  LogOut,
  Settings,
  MessageSquare,
  TableProperties,
} from "lucide-react";
import { motion } from "framer-motion";
import { Typograph } from "@/components/components/Typograph/Typograph";

interface MenuOptionsProps {
  role: "student" | "teacher" | "course-coordinator" | "admin";
  logout: () => void;
}

export function MenuOptions({ role, logout }: MenuOptionsProps) {
  const location = useLocation();

//   const isAboutPage = location.pathname === "/about";
//   const isFaqPage = location.pathname === "/faq";

  const menuItems = [
    {
      show: true,
      path: "/about",
      icon: <User className="w-5 h-5" />,
      label: "Detalhes",
    },
    {
      show: ["teacher", "course-coordinator", "admin"].includes(role),
      path: "/chart",
      icon: <PieChart className="w-5 h-5" />,
      label: "Resultados",
    },
    {
      show: ["admin", "course-coordinator"].includes(role),
      path: "/crud",
      icon: <Settings className="w-5 h-5" />,
      label: "Criar",
    },
    {
      show: ["admin", "course-coordinator"].includes(role),
      path: "/list",
      icon: <TableProperties className="w-5 h-5" />,
      label: "Listar",
    },
    {
      show: true,
      path: "/chat",
      icon: <MessageSquare className="w-5 h-5" />,
      label: "Chat",
    },
    //!em desenvolvimento
    // {
    //   show: !isFaqPage,
    //   path: "/faq",
    //   icon: <HelpCircle className="w-5 h-5" />,
    //   label: "Dúvidas",
    // },
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
        .map(({ path, icon, label }) => {
          const isCurrent = location.pathname === path;

          return isCurrent ? (
            <div
              key={path}
              className="flex items-center w-full gap-2 px-4 py-2 text-gray-500 rounded-md opacity-50 cursor-not-allowed"
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
            <Link key={path} to={path}>
              <Button
                variant="ghost"
                className="flex items-center justify-start w-full gap-2 text-gray-300 hover:text-white"
              >
                {icon}
                <Typograph
                  text={label}
                  colorText="text-[#E4E4E4]"
                  variant="text4"
                  weight="regular"
                  fontFamily="poppins"
                />
              </Button>
            </Link>
          );
        })}

      <Button
        variant="ghost"
        onClick={logout}
        className="flex items-center justify-start w-full gap-2 mt-4 text-red-500 hover:text-red-300"
      >
        <LogOut className="w-5 h-5 text-red-500" />
        <Typograph
          text="Sair"
          colorText="text-[#E4E4E4]"
          variant="text4"
          weight="regular"
          fontFamily="poppins"
        />
      </Button>
    </motion.nav>
  );
}
