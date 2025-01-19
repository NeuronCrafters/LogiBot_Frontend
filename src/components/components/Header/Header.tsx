import React, { useState } from "react";
import { Logo } from "@/components/components/Logo/Logo";
import { useAuthStore } from "@/stores/authStore";
import { ButtonLogin } from "../Button/ButtonLogin";
import { Menu } from "@/components/components/Menu/Menu";
import { Button } from "@/components/ui/button";
import { Menu as MenuIcon } from "lucide-react";

export function Header() {
  const { isLoggedIn } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full h-[154px] bg-[#181818] flex items-center justify-between px-8">
      <div className="flex items-center space-x-4 xl:ml-[87px] ml-[10px]">
        <Logo type="withName" className="xl:h-[240px] xl:w-[240px] lg:h-[220px] lg:w-[220px] md:h-[210px] md:w-[210px] sm:h-[200px] sm:w-[200px] h-[140px] w-[140px]" />
      </div>

      <div className="flex items-center space-x-4">
        {isLoggedIn ? (
          <Button variant="ghost" onClick={() => setIsMenuOpen((prev) => !prev)} className="p-2">
            <MenuIcon style={{ height: "40px", width: "40px", color: "white" }} />
          </Button>
        ) : (
          <div className="hidden xl:flex space-x-[44px] mr-[87px]">
            <ButtonLogin type="cadastrar" />
            <ButtonLogin type="entrar" />
          </div>
        )}
      </div>

      <Menu isOpen={isMenuOpen} closeMenu={() => setIsMenuOpen(false)} />
    </header>
  );
}
