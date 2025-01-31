// src/components/components/Input/Input.tsx
import React from "react";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Input as ShadcnInput } from "@/components/ui/input";

interface InputProps {
  type: "name" | "email" | "instituição" | "feedback" | "text"; // Adicionei "instituição" e "feedback"
  placeholder?: string;
  value: string; // Valor recebido como prop
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Função de mudança
  className?: string;
}

export function InputColeta({
  type,
  placeholder,
  value,
  onChange,
  className,
}: InputProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(value !== "");

  const defaultPlaceholder = {
    name: "Digite seu nome",
    email: "Digite seu e-mail",
    instituição: "Digite o nome da instituição",
    feedback: "Dê o seu feedback",
    text: placeholder || "Texto", // Adicionando um valor padrão para "text"
  };

  const defaultLabel = {
    name: "Nome",
    email: "E-mail",
    instituição: "Instituição",
    feedback: "Feedback",
    };

    return (
    <div>
        <label className="text-md font-semi font-Montserrat text-neutral-100 p-2">{defaultLabel[type]}</label>
        <div className={`relative flex flex-col bg-gray-800 rounded-lg px-4 py-3 w-full ${className}`}>

          <ShadcnInput
            type={type} // Exibe o tipo correto
            value={value} // Usando o valor do campo controlado pelo pai
            onChange={onChange} // Função de mudança passada do pai
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={defaultPlaceholder[type]} // Adiciona o placeholder padrão
            className="bg-transparent text-neutral-100 w-full placeholder-transparent focus:outline-none"
          />
        </div>
    </div>
      );
    }

export default InputColeta;