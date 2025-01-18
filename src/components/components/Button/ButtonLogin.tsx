import React from "react";
import { Button } from "@/components/ui/button";
import { Typograph } from "@/components/components/Typograph/Typograph";

interface ButtonLoginProps {
  label: string;
  type: "entrar" | "cadastrar";
  onClick?: () => void;
  className?: string;
}

export function ButtonLogin({ label, type, onClick, className }: ButtonLoginProps) {
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

  return (
    <Button
      onClick={handleClick}
      className={`rounded-lg px-6 py-3 w-[287px] h-[69px] ${type === "entrar"
        ? "bg-blue-500 hover:bg-blue-600 text-white"
        : "bg-transparent border border-white text-white hover:bg-white hover:text-black"
        } ${className}`}
    >
      <Typograph
        text={label}
        colorText="text-inherit"
        variant="text2"
        weight="medium"
        fontFamily="poppins"
      />
    </Button>
  );
}
