import { ReactNode } from "react";

const WeightType = {
  thin: "font-thin",
  extralight: "font-extralight",
  light: "font-light",
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
  black: "font-black",
};

const FontFamily = {
  poppins: "font-[Poppins]",
};

const VariantStyles = {
  title1: "text-[3.125rem]",
  title2: "text-[3rem]",
  title3: "text-[2.875rem]",
  title4: "text-[2.75rem]",
  title5: "text-[2.625rem]",
  title6: "text-[2.5rem]",
  title7: "text-[2.375rem]",
  title8: "text-[2.25rem]",
  title9: "text-[2.125rem]",
  title10: "text-[2rem]",
  title11: "text-[1.875rem]",
  text1: "text-[1.75rem]",
  text2: "text-[1.625rem]",
  text3: "text-[1.5rem]",
  text4: "text-[1.375rem]",
  text5: "text-[1.25rem]",
  text6: "text-[1.125rem]",
  text7: "text-[1rem]",
  text8: "text-[0.875rem]",
  text9: "text-[0.75rem]",
  text10: "text-xs",
};

interface TypographProps {
  text: ReactNode | string;
  colorText: string;
  variant: keyof typeof VariantStyles;
  weight: keyof typeof WeightType;
  fontFamily: keyof typeof FontFamily;
  className?: string;
  id?: string;
}

export function Typograph({
  text,
  colorText,
  variant,
  weight,
  fontFamily,
  className = "",
  id,
}: TypographProps) {
  const baseClass = `${WeightType[weight]} ${FontFamily[fontFamily]} ${VariantStyles[variant]} ${colorText} ${className}`;
  const Tag = variant.startsWith("title") ? "h1" : "p";
  return (
    <Tag className={baseClass} id={id}>
      {text}
    </Tag>
  );
}
