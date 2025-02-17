import React, { useState } from "react";
import { Link } from "react-router-dom";

function WelcomeScreen() {
  const [inputText, setInputText] = useState("");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  const handleSubmit = () => {
    console.log(inputText); // Lógica para o que fazer ao clicar no ícone (por exemplo, enviar o texto)
  };

  return (
    <div className="flex min-h-screen bg-[#141414] flex-col justify-center items-center w-full max-w-full px-0 sm:px-8 md:px-16 mx-auto">
      {/* Cabeçalho com o botão "Voltar" */}
      <div className="absolute top-4 left-4 text-white text-lg">
        <Link to="/" className="flex items-center text-white text-lg space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            className="bi bi-arrow-left-circle"
            viewBox="0 0 16 16"
          >
            <path d="M8 16a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-.5-11.5a.5.5 0 0 1 .5.5v4.793l-2.146-2.146a.5.5 0 0 1-.708.708l3 3a.5.5 0 0 1 .708 0l3-3a.5.5 0 0 1-.708-.708L8 9.793V5a.5.5 0 0 1-.5-.5z" />
          </svg>
          <span>Voltar</span>
        </Link>
      </div>

      {/* Título */}
      <h2 className="text-white text-5xl sm:text-6xl font-extrabold text-center mb-6">
        Olá, Bem-vindo ao (...)
      </h2>

      {/* Logo */}
      <div className="mb-6 flex justify-center">
        <img
          src="/src/assets/logo.svg" // Caminho correto da sua logo
          alt="Logo"
          className="mx-auto"
          style={{ width: "180px", height: "auto" }} // Tamanho da logo
        />
      </div>

      {/* Texto explicativo */}
      <p className="text-neutral-300 mb-6 text-center text-lg sm:text-xl">
        Escolha um tema para começar
      </p>

      {/* Botões centralizados com tamanho igual */}
      <div className="flex justify-center gap-6 mb-6 w-full max-w-lg">
        <Link to="/programacao" className="w-full sm:w-auto">
          <button className="bg-[#003366] text-white py-4 px-10 rounded-lg text-lg w-full">
            Programação
          </button>
        </Link>
        <Link to="/logica" className="w-full sm:w-auto">
          <button className="bg-[#003366] text-white py-4 px-16 rounded-lg text-lg w-full">
            Lógica
          </button>
        </Link>
      </div>

      {/* Campo de texto fixado no fundo */}
      <div className="p-4 fixed bottom-0 left-0 right-0 bg-[#222222]">
        <div className="flex items-center p-3 rounded-full">
          <input
            type="text"
            placeholder="Comece a escrever"
            className="w-full bg-transparent text-white placeholder-gray-500 outline-none rounded-full py-3 px-6"
            value={inputText}
            onChange={handleInputChange}
          />
          <button onClick={handleSubmit} className="ml-2 text-blue-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              className="bi bi-arrow-right-circle"
              viewBox="0 0 16 16"
            >
              <path d="M8 16a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm.5-11.5a.5.5 0 0 1 .5.5v4.793l2.146-2.146a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 .708-.708L8 9.793V5a.5.5 0 0 1 .5-.5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
