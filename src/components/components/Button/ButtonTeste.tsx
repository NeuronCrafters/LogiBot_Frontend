
import React from "react";

interface ButtonProps {
  text: string;
  onClick?: () => void;
  className?: string;
}

const Button = ({ text, onClick, className }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl bg-blue-900 text-white px-6 py-4 rounded-md shadow-md hover:bg-blue-[#102A56] ${className}`}
    >
      {text}
    </button>
  );
};

export default Button;
