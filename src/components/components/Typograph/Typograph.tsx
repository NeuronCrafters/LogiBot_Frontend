import React from "react";

enum WeightType {
  bold = "font-bold",
  medium = "font-medium",
  regular = "font-normal",
}

enum FontFamily {
  montserrat = "font-[Montserrat]",
  roboto = "font-[Roboto]",
  poppins = "font-[Poppins]",
}

interface TypographProps {
  text: string;
  colorText: string;
  variant: "title1" | "title2" | "text1" | "text2" | "text3" | "text4" | "text5";
  weight: "bold" | "medium" | "regular";
  fontFamily: "montserrat" | "roboto" | "poppins";
  className?: string;
}

export function Typograph({ text, colorText, variant, weight, fontFamily, className }: TypographProps) {
  const baseClass = `${WeightType[weight]} ${FontFamily[fontFamily]} ${colorText} ${className}`;

  if (variant === "title1") {
    return (
      <h1 className={`${baseClass} text-[25px] md:text-[70px]`}>
        {text}
      </h1>
    );
  }

  if (variant === "title2") {
    return (
      <h2 className={`${baseClass} text-[25px] md:text-[50px]`}>
        {text}
      </h2>
    );
  }

  if (variant === "text1") {
    return (
      <p className={`${baseClass} text-[20px] md:text-[30px]`}>
        {text}
      </p>
    );
  }

  if (variant === "text2") {
    return (
      <p className={`${baseClass} text-[18px] md:text-[24px]`}>
        {text}
      </p>
    );
  }

  if (variant === "text3") {
    return (
      <p className={`${baseClass} text-[16px] md:text-[22px]`}>
        {text}
      </p>
    );
  }

  if (variant === "text4") {
    return (
      <p className={`${baseClass} text-[18px] md:text-[20px]`}>
        {text}
      </p>
    );
  }

  if (variant === "text5") {
    return (
      <p className={`${baseClass} text-[18px] md:text-[30px]`}>
        {text}
      </p>
    );
  }

  return null;
}



/**
 * Componente Typograph como usar ele
 * 
 * O Typograph é usado para exibir texto estilizado com configurações específicas
 * de tamanho, peso e fonte.
 * 
 * Exemplos de uso:
 * 
 * - Texto principal (title1) com fonte Montserrat:
 *   <Typograph
 *     text="Bem-vindo ao Chat SAEL"
 *     colorText="text-primary"
 *     variant="title1"
 *     weight="bold"
 *     fontFamily="montserrat"
 *   />
 * 
 * - Texto secundário (text2) com fonte Roboto:
 *   <Typograph
 *     text="Faça login para continuar"
 *     colorText="text-gray-500"
 *     variant="text2"
 *     weight="medium"
 *     fontFamily="roboto"
 *   />
 * 
 * - Texto com fonte Poppins e classes adicionais:
 *   <Typograph
 *     text="Acesse com sua conta Google"
 *     colorText="text-muted"
 *     variant="text3"
 *     weight="regular"
 *     fontFamily="poppins"
 *     className="tracking-wide"
 *   />
 */