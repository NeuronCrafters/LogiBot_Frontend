import { t, useLocale } from "@/i18n";
import React, { ChangeEvent, useState } from "react";
import { Typograph } from "@/shared/components/Typography";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Eye, EyeOff, User, Mail, Lock, FileText } from "lucide-react";

const InputIcons = {
  name: <User className="w-6 h-6 text-gray-400" />,
  email: <Mail className="w-6 h-6 text-gray-400" />,
  password: <Lock className="w-6 h-6 text-gray-400" />,
  text: <FileText className="w-6 h-6 text-gray-400" />,
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  type: "text" | "name" | "email" | "password";
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function Input({
  type,
  placeholder,
  className,
  value,
  onChange,
  required,
  ...props
}: InputProps) {
  useLocale();

  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(!!value);
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const defaultPlaceholder = {
    name: t("common.nome"),
    email: t("common.email"),
    password: t("common.senha"),
    text: t("common.digiteAqui"),
  };

  return (
    <div
      className={`relative flex items-center bg-surface border border-white/10 rounded-lg px-4 py-3 w-[341px] h-[64px] ${className}`}
    >
      <div className="mr-3">{InputIcons[type]}</div>
      <ShadcnInput
        aria-label={placeholder || defaultPlaceholder[type]}
        type={type === "password" && !showPassword ? "password" : "text"}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        required={required}
        className="bg-transparent text-white w-full placeholder-transparent focus:outline-none focus:ring-0 focus:border-transparent"
        {...props}
      />
      {type === "password" && (
        <button
          aria-label={t(showPassword ? "auth.ocultarSenha" : "auth.mostrarSenha")}
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-6 text-gray-400 hover:text-white focus:outline-none"
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      )}
      {!isFocused && !value && (
        <div className="absolute left-14 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <Typograph
            text={placeholder || defaultPlaceholder[type]}
            colorText="text-gray-400"
            variant="text6"
            weight="medium"
            fontFamily="poppins"
          />
        </div>
      )}
    </div>
  );
}
