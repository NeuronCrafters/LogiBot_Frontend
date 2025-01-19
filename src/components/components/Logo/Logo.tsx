import React from "react";
import logoSimples from "@/assets/logo.svg";
import logoSAEL from "@/assets/logoSAEL.svg";

interface LogoProps {
  className?: string;
  type: "mascote" | "withName";
}

export function Logo({ className, type }: LogoProps) {
  const logos = {
    mascote: logoSimples,
    withName: logoSAEL,
  };

  return (
    <a href="/" className={`flex items-center ${className}`}>
      <img
        src={logos[type]}
        alt={type === "mascote" ? "Logo Mascote do SAEL" : "Logo Completa do SAEL"}
        className="object-contain"
      />
    </a>
  );
}
