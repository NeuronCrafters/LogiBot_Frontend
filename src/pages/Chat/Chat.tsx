import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Send, Menu as MenuIcon } from "lucide-react";
import { Menu } from "@/components/components/Menu/Menu";
import { useAuthStore } from "@/stores/authStore";

const subjects: { [key: string]: string[] } = {
  Programação: ["JavaScript", "Python", "Java"],
  Lógica: ["Algoritmos", "Estruturas de Dados", "Complexidade"],
};

function Chat() {
  const [inputText, setInputText] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const { isAuthenticated } = useAuthStore();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  const handleSubmit = () => {
    console.log(inputText);
  };

  const handleSubjectClick = (subject: string) => {
    setSelectedSubject(subject);
  };

  // const handleBackClick = () => {
  //   setSelectedSubject(null);
  // };

  return (
    <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full max-w-full px-0 sm:px-8 md:px-16 mx-auto">

      {/* Header com botão do menu */}
      <div className="absolute bg-[#141414] w-full justify-between flex border-b-[0.5px] border-neutral-800 px-6 py-4">
        <p className="font-Montserrat text-neutral-200 font-semibold text-2xl">
          CHAT SAEL
        </p>

        {isAuthenticated && (
          <button onClick={() => setMenuOpen(true)} className="text-white">
            <MenuIcon size={28} />
          </button>
        )}
      </div>

      {!inputText && (
        <div className="flex flex-col items-center w-full h-screen py-32">
          <Link to="/" className="flex items-center text-white text-lg space-x-2">
            <div className="mb-6 flex justify-center">
              <img
                src="/src/assets/logo.svg"
                alt="Logo"
                className="mx-auto"
                style={{ width: "100px", height: "auto" }}
              />
            </div>
          </Link>

          <h2 className="text-white text-xl sm:text-2xl font-extrabold text-center">
            Olá, Bem-vindo ao (...)
          </h2>

          <p className="text-neutral-300 mb-6 text-center text-sm sm:text-xl">
            Escolha um tema para começar
          </p>

          {!selectedSubject ? (
            <div className="justify-center px-8 gap-2 sm:gap-6 w-full max-w-lg grid grid-cols-2">
              {Object.keys(subjects).map((subject) => (
                <button
                  key={subject}
                  className="bg-blue-800 text-gray-200 font-Montserrat py-4 sm:py-4 rounded-full text-sm w-full"
                  onClick={() => handleSubjectClick(subject)}
                >
                  {subject}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              <div className="justify-center px-8 gap-2 sm:gap-6 w-full max-w-lg grid grid-cols-2">
                {subjects[selectedSubject!].map((subsubject) => (
                  <button
                    key={subsubject}
                    className="bg-blue-800 text-gray-200 font-Montserrat py-4 rounded-full text-sm w-full"
                  >
                    {subsubject}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Campo de texto fixado no fundo */}
      <div className="fixed bottom-0 left-0 right-0 mb-8 px-4">
        <div className="flex justify-center bg-[#1a1f27] size-14 rounded-full w-full max-w-lg mx-auto">
          <div className="flex items-center p-2 rounded-full w-full">
            <input
              type="text"
              placeholder="Comece a escrever"
              className="w-full bg-transparent text-gray-200 outline-none rounded-full py-3 px-6"
              value={inputText}
              onChange={handleInputChange}
            />
            <button onClick={handleSubmit} className="text-neutral-200 bg-blue-700 rounded-full p-2">
              <Send strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Menu Lateral */}
      <Menu isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />
    </div>
  );
}

export { Chat };
