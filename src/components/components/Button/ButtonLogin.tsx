import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Typograph } from "@/components/components/Typograph/Typograph";
import React from "react";

type UnifiedButtonType = "entrar" | "cadastrar" | "submit";

interface UnifiedButtonProps {
  type: UnifiedButtonType;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  id?: string;
}

export function ButtonLogin({
  type,
  onClick,
  className = "",
  disabled = false,
  children,
  id,
}: UnifiedButtonProps) {
  const handleClick = () => {
    if (onClick) onClick();

    if (type === "entrar") {
      window.location.href = "/chat";
    } else if (type === "cadastrar") {
      window.location.href = "/signin";
    }
  };

  const buttonText = children
    ? children
    : type === "entrar"
      ? "entrar"
      : type === "cadastrar"
        ? "cadastrar-se"
        : "enviar";

  const baseStyles =
    "w-[341px] h-[64px] px-6 py-3 rounded-lg transition-colors duration-300 text-base font-semibold";
  const variantStyles =
    type === "entrar"
      ? "bg-blue-500 hover:bg-blue-600 text-white border border-blue-400/40 shadow-md shadow-blue-900/30"
      : type === "cadastrar"
        ? "bg-transparent border border-white/40 text-white hover:bg-white/10 hover:border-white/60"
        : "bg-green-500 hover:bg-green-600 text-white border border-green-400/40 shadow-md shadow-green-900/30";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Button
        id={id}
        onClick={type === "submit" ? onClick : handleClick}
        type={type === "submit" ? "submit" : "button"}
        disabled={disabled}
        className={`${baseStyles} ${variantStyles} ${className}`}
      >
        <Typograph
          text={buttonText}
          colorText="text-inherit"
          variant="text4"
          weight="medium"
          fontFamily="poppins"
        />
      </Button>
    </motion.div>
  );
}
