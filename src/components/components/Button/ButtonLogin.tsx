import React from "react";
import { Button } from "@/components/ui/button";
import { Typograph } from "@/components/components/Typograph/Typograph";

interface ButtonLoginProps {
  type: "entrar" | "cadastrar";
  onClick?: () => void;
  className?: string;
}

export function ButtonLogin({ type, onClick, className }: ButtonLoginProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }

    if (type === "entrar") {
      window.location.href = "/chat";
    } else if (type === "cadastrar") {
      window.location.href = "/signin";
    }
  };

  const label = type === "entrar" ? "Entrar" : "Cadastrar-se";

  return (
    <Button
      onClick={handleClick}
      className={`rounded-lg px-6 py-3 w-[341px] h-[64px] ${type === "entrar" || type === "cadastrar"
        ? "bg-blue-800 hover:bg-blue-900 text-white"
        : "bg-transparent border border-white text-white hover:bg-white hover:text-black"
        } ${className}`}
    >

      <Typograph
        text={label}
        colorText="text-inherit"
        variant="text4"
        weight="medium"
        fontFamily="poppins"
      />
    </Button>
  );
}
