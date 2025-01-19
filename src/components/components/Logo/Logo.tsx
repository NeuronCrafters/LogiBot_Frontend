import React from "react";
import logo from "@/assets/logoSAEL.svg";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <a href="/" className={`flex items-center ${className}`}>
      <img
        src={logo}
        alt="Logo do SAEL"
      />
    </a>
  );
}
