import React, { useState } from "react";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";

const InputIcons = {
  name: <User className="w-6 h-6 text-gray-400" />,
  email: <Mail className="w-6 h-6 text-gray-400" />,
  password: <Lock className="w-6 h-6 text-gray-400" />,
};

interface InputProps {
  type: "name" | "email" | "password";
  placeholder?: string;
  className?: string;
}

export function Input({ type, placeholder, className }: InputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(value !== "");
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const defaultPlaceholder = {
    name: "Nome",
    email: "E-mail",
    password: "Senha",
  };

  return (
    <div
      className={`relative flex items-center bg-gray-800 rounded-lg px-4 py-3 w-[341px] h-[64px] ${className}`}
    >
      <div className="mr-3">{InputIcons[type]}</div>

      <ShadcnInput
        type={type === "password" && !showPassword ? "password" : "name"}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="bg-transparent text-white w-full placeholder-transparent focus:outline-none"
      />

      {type === "password" && (
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-6 text-gray-400 hover:text-white focus:outline-none"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
