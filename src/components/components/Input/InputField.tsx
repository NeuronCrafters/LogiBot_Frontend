
import React from "react";

interface InputFieldProps {
  type: string;
  placeholder: string;
  icon: JSX.Element;
}

const InputField = ({ type, placeholder, icon }: InputFieldProps) => {
  return (
    <div className="rounded-xl flex items-center bg-[#222222] p-4 rounded-md mb-4 w-full">
      <span className="text-gray-400 mr-3">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="bg-transparent text-white w-full focus:outline-none"
      />
    </div>
  );
};

export default InputField;
