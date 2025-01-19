import React from "react";
import { Logo } from "@/components/components/Logo/Logo";
import { useAuthStore } from "@/stores/authStore";
import { ButtonLogin } from "../Button/ButtonLogin";

export function Header() {
  const { isLoggedIn } = useAuthStore();

  return (
    <header className="w-full h-[154px] bg-[#181818] flex items-center justify-between px-8">
      <div className="flex items-center space-x-4 xl:ml-[87px] ml-[10px]">
        <Logo className="xl:h-[240px] xl:w-[240px] lg:h-[220px] lg:w-[220px] md:h-[210px] md:w-[210px] sm:h-[200px] sm:w-[200px] h-[140px] w-[140px]" />
      </div>

      <div className="flex items-center space-x-4">
        {isLoggedIn ? (
          <>

          </>
        ) : (
          <div className="hidden xl:flex space-x-[44px] mr-[87px]">
            <ButtonLogin type="cadastrar" />
            <ButtonLogin type="entrar" />
          </div>
        )}
      </div>
    </header>
  );
}
