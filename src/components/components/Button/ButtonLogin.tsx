import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Typograph } from "@/components/components/Typograph/Typograph";
import googleLogo from "@/assets/googleLogo.svg";
import React from "react";

type UnifiedButtonType = "entrar" | "cadastrar" | "submit" | "google";

interface UnifiedButtonProps {
  type: UnifiedButtonType;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function ButtonLogin({
  type,
  onClick,
  className = "",
  disabled = false,
  children,
}: UnifiedButtonProps) {
  const handleClick = () => {
    if (onClick) onClick();

    if (type === "entrar") {
      window.location.href = "/chat";
    } else if (type === "cadastrar") {
      window.location.href = "/signin";
    } else if (type === "google") {
      window.location.href = "/chat";
    }
  };

  const buttonText = children
    ? children
    : type === "entrar"
      ? "Entrar"
      : type === "cadastrar"
        ? "Cadastrar-se"
        : type === "submit"
          ? "Enviar"
          : "Entrar com o Google";

  const baseStyles =
    "w-[341px] h-[64px] px-6 py-3 rounded-lg transition-colors duration-300 text-base font-medium";
  const variantStyles =
    type === "entrar"
      ? "bg-blue-500 hover:bg-blue-600 text-white"
      : type === "cadastrar"
        ? "bg-transparent border border-white text-white hover:bg-white hover:text-black"
        : type === "submit"
          ? "bg-green-500 hover:bg-green-600 text-white"
          : "bg-white text-black border border-gray-300 hover:bg-gray-100";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Button
        onClick={type === "submit" ? onClick : handleClick}
        type={type === "submit" ? "submit" : "button"}
        disabled={disabled}
        className={`${baseStyles} ${variantStyles} ${className} ${type === "google" ? "flex items-center justify-center gap-3" : ""
          }`}
      >
        {type === "google" && (
          <img
            src={googleLogo}
            alt="Google Logo"
            className="w-6 h-6"
          />
        )}
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
