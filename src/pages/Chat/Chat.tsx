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
    <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full max-w-full px-0 sm:px-8 md:px-16 mx-auto">
      

      <div className="bg-neutral-900 flex absolute top-0 text-lg items-center justify-between w-full px-64 py-4">
        <button className="text-gray-200 bg-blue-800 py-2 px-10 rounded-lg text-lg font-Montserrat font-medium hover:bg-blue-900 hover:text-gray-300">
          Voltar
        </button>
        
        <button className="text-gray-200 bg-blue-800 py-2 px-10 rounded-lg text-lg font-Montserrat font-medium  hover:bg-blue-900 hover:text-gray-300">
          Nova Conversa
        </button>
        
      </div>


      <div className="flex flex-col items-center w-full py-32">
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

        <h2 className="text-white text-2xl sm:text-2xl font-extrabold text-center mb-6">
          Olá, Bem-vindo ao (...)
        </h2>

        <p className="text-neutral-300 mb-6 text-center text-lg sm:text-xl">
          Escolha um tema para começar
        </p>
      
        <div className="flex justify-center gap-6 mb-6 w-full max-w-lg">
        <Link to="/programacao" className="w-full sm:w-auto">
          <button className="bg-blue-800 text-gray-200 font-Montserrat py-2 px-10 rounded-xl text-lg w-full">
            Programação
          </button>
        </Link>
        <Link to="/logica" className="w-full sm:w-auto">
          <button className="bg-blue-800 text-gray-200 py-2 px-16 font-Montserrat rounded-xl text-lg w-full">
            Lógica
          </button>
        </Link>
        </div>

      </div>

      {/* Campo de texto fixado no fundo */}
      <div className="p-4 fixed bottom-0 left-0 right-0 bg-neutral-900">

        <div className="flex justify-center bg-[#1F2732] size-14 rounded-full w-full max-w-lg mx-auto">
          <div className="flex items-center p-3 rounded-full">
          <input
            type="text"
            placeholder="Comece a escrever"
            className="w-full bg-transparent text-gray-200 outline-none rounded-full py-3 px-6"
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
    </div>
  );
}

export default WelcomeScreen;
