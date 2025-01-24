import React from "react";

function CadastroPage() {
  return (
    <div className="flex min-h-screen">
      
      <div className="hidden md:flex  flex-1 flex items-center justify-center bg-gradient-to-b from-blue-700 to-blue-900" style={{ flex: 2 }}>
        <div className="text-center">
          <h1 className="text-white text-4xl font-bold">SAEL</h1>
        </div>
      </div>

      
      <div className="flex-1 flex items-center justify-center bg-[#141414]">
        <div className="w-full max-w-sm p-8">
          <h2 className=" font-Montserrat text-white text-2xl font-bold mb-6">Entrar</h2>
          <p className="text-gray-400 mb-6">
            Acesse sua conta
          </p>

          
          <div className="rounded-xl flex items-center bg-[#222222] p-4 rounded-md mb-4 w-full" style={{ flex: 6 }}>
            <span className="text-gray-400 mr-3">
              
              <svg
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A11.956 11.956 0 0112 15c2.985 0 5.735 1.09 7.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Nome"
              className="bg-transparent text-white w-full focus:outline-none"
            />
          </div>

          
          <div className="rounded-xl flex items-center bg-[#222222] p-4 rounded-md mb-4 w-full">
            <span className="text-gray-400 mr-3">
              
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12H8m0 0v6m0-6l-8 8m8-8l8 8M8 6h8M8 6L4 10m4-4l4 4"
                />
              </svg>
            </span>
            <input
              type="email"
              placeholder="E-mail"
              className="bg-transparent text-white w-full focus:outline-none"
            />
          </div>

         
          <div className=" rounded-xl flex items-center bg-[#222222] p-4 rounded-md mb-4 w-full">
            <span className="text-gray-400 mr-3">
              
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </span>
            <input
              type="password"
              placeholder="Senha"
              className="bg-transparent text-white w-full focus:outline-none"
            />
          </div>
          <div className=" rounded-xl flex items-center bg-[#222222] p-4 rounded-md mb-4 w-full">
            <span className="text-gray-400 mr-3">
              
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </span>
            <input
              type="password"
              placeholder="Senha"
              className="bg-transparent text-white w-full focus:outline-none"
            />
          </div>

          
      

          
          <button className="w-full rounded-xl bg-blue-900 text-white px-6 py-4 rounded-md shadow-md hover:bg-blue-[#102A56]">
            CADASTRAR-SE
          </button>

          <p className="text-gray-400 text-sm text-center mt-4">
            Já possui conta?{" "}
            <a href="/login" className="text-blue-500 hover:underline">
              Faça o login.
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CadastroPage;
