import React from "react";
import { Typograph } from "@/components/components/Typograph/Typograph";

interface ButtonLoginProps {
  label: string;
  type: "entrar" | "cadastrar";
  onClick?: () => void;
  className?: string;
}

export function ButtonLogin({ label, type, onClick, className }: ButtonLoginProps) {
  const baseStyles = "rounded-lg px-6 py-3 flex items-center justify-center";
  const typeStyles =
    type === "entrar"
      ? "bg-blue-500 hover:bg-blue-600 text-white w-[205px] h-[62px]"
      : "bg-transparent border border-white text-white hover:bg-white hover:text-black w-[205px]";

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${typeStyles} ${className}`}
    >
      <Typograph
        text={label}
        colorText="text-inherit"
        variant="text2"
        weight="medium"
        fontFamily="poppins"
      />
    </button>
  );
}
