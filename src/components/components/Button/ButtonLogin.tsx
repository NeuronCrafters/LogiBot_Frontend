import React from "react";
import { Button } from "@/components/ui/button";
import { Typograph } from "@/components/components/Typograph/Typograph";

interface ButtonLoginProps {
  type: "entrar" | "cadastrar" | "submit";
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function ButtonLogin({ type, onClick, className, disabled, children }: ButtonLoginProps) {
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
      onClick={type === "submit" ? undefined : handleClick}
      type={type === "submit" ? "submit" : "button"}
      disabled={disabled}
      className={`rounded-lg px-6 py-3 w-[341px] h-[64px] ${type === "entrar"
        ? "bg-blue-500 hover:bg-blue-600 text-white"
        : type === "cadastrar"
          ? "bg-transparent border border-white text-white hover:bg-white hover:text-black"
          : "bg-green-500 hover:bg-green-600 text-white"
        } ${className}`}
    >
      <Typograph
        text={children || (type === "entrar" ? "Entrar" : type === "cadastrar" ? "Cadastrar-se" : "Enviar")}
        colorText="text-inherit"
        variant="text4"
        weight="medium"
        fontFamily="poppins"
      />
    </Button>
  );
}
