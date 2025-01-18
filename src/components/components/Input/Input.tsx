import React, { useState } from "react";
import { Typograph } from "@/components/components/Typograph/Typograph";
import userIcon from "@/assets/user.svg";
import emailIcon from "@/assets/email.svg";
import passwordIcon from "@/assets/password.svg";

const InputIcons = {
  text: userIcon,
  email: emailIcon,
  password: passwordIcon,
};

interface InputProps {
  type: "text" | "email" | "password";
  placeholder?: string;
  className?: string;
}

export function Input({ type, placeholder, className }: InputProps) {
  const [value, setValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const defaultPlaceholder = {
    text: "Nome",
    email: "E-mail",
    password: "Senha",
  };

  return (
    <div
      className={`relative flex items-center bg-gray-800 rounded-lg px-4 py-3 w-[341px] h-[64px] ${className}`}
    >
      <img
        src={InputIcons[type]}
        alt={`${type} icon`}
        className="w-6 h-6 mr-3"
      />

      <input
        type={type}
        value={value}
        onChange={handleChange}
        className="bg-transparent text-white w-full placeholder-transparent focus:outline-none"
      />

      {!value && (
        <div className="absolute left-12 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <Typograph
            text={placeholder || defaultPlaceholder[type]}
            colorText="text-white"
            variant="text3"
            weight="medium"
            fontFamily="poppins"
          />
        </div>
      )}
    </div>
  );
}
