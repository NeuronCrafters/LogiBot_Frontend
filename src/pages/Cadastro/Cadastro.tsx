import React from "react";
import { Input } from "@/components/components/Input/Input";
import { ButtonLogin } from "@/components/components/Button/ButtonLogin";

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
          <h2 className=" font-Montserrat text-white text-4xl font-bold">Cadastro</h2>
          <p className="text-neutral-300 mb-2">
            Realize seu cadastro no site
          </p>


          <Input type="name" className="bg-neutral-800 mb-4"/>

          <Input type="email" className="bg-neutral-800 mb-4"/>
          
          <Input type="password" className="bg-neutral-800 mb-4"/>

          <Input type="password" placeholder="Confirmar senha" className="bg-neutral-800 mb-4 defaul"/>
        
          <ButtonLogin type="cadastrar"/>

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
