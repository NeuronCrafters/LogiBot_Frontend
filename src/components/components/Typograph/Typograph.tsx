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
  montserrat: "font-[Montserrat]",
  roboto: "font-[Roboto]",
  poppins: "font-[Poppins]",
};

const VariantStyles = {
  title1: "text-[50px]",
  title2: "text-[48px]",
  title3: "text-[46px]",
  title4: "text-[44px]",
  title5: "text-[42px]",
  title6: "text-[40px]",
  title7: "text-[38px]",
  title8: "text-[36px]",
  title9: "text-[34px]",
  title10: "text-[32px]",
  title11: "text-[30px]",
  text1: "text-[28px]",
  text2: "text-[26px]",
  text3: "text-[24px]",
  text4: "text-[22px]",
  text5: "text-[20px]",
  text6: "text-[18px]",
  text7: "text-[16px]",
  text8: "text-[14px]",
  text9: "text-[12px]",
  text10: "text-[10px]",
  text11: "text-[8px]",
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

  return <Tag className={baseClass}>{text} id={id}</Tag>;
}
