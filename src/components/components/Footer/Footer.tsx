import React from "react";
import { Logo } from "@/components/components/Logo/Logo";
import { Typograph } from "@/components/components/Typograph/Typograph";

export function Footer() {
  return (
    <footer className="w-full bg-[#181818] text-[#E4E4E4]">
      <div className="container mx-auto py-8 px-[87px] flex flex-col lg:flex-row items-center lg:justify-between space-y-8 lg:space-y-0">
        <div className="flex justify-center">
          <Logo
            type="mascote"
            className="xl:h-[240px] xl:w-[240px] lg:h-[220px] lg:w-[220px] md:h-[210px] md:w-[210px] sm:h-[200px] sm:w-[200px] h-[140px] w-[140px]"
          />
        </div>

        <div className="flex flex-col items-center lg:flex-row lg:space-x-8 space-y-4 lg:space-y-0">
          <a href="/chat" className="hover:underline">
            <Typograph
              text="Converse com o SAEL"
              colorText="text-[#E4E4E4]"
              variant="text4"
              weight="regular"
              fontFamily="poppins"
            />
          </a>
          <a href="/admin" className="hover:underline">
            <Typograph
              text="Admin"
              colorText="text-[#E4E4E4]"
              variant="text4"
              weight="regular"
              fontFamily="poppins"
            />
          </a>
          <a href="/privacy" className="hover:underline">
            <Typograph
              text="Privacidade"
              colorText="text-[#E4E4E4]"
              variant="text4"
              weight="regular"
              fontFamily="poppins"
            />
          </a>
          <a href="/terms" className="hover:underline">
            <Typograph
              text="Termos"
              colorText="text-[#E4E4E4]"
              variant="text4"
              weight="regular"
              fontFamily="poppins"
            />
          </a>
        </div>
      </div>

      <div className="w-full bg-[#161616] py-4">
        <div className="container mx-auto text-center px-[87px]">
          <Typograph
            text="© 2025, SAEL. Todos Os Direitos Reservados."
            colorText="text-[#E4E4E4]"
            variant="text8"
            weight="regular"
            fontFamily="poppins"
          />
        </div>
      </div>
    </footer>
  );
}
