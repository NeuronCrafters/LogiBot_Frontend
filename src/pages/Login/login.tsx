import React from "react";
import { Link } from "react-router-dom";
import {ButtonSocialLogin}from "@/components/components/Button/ButtonSocialLogin"; // Importe o componente de botão
import { Input } from "@/components/components/Input/Input";
import { ButtonLogin } from "@/components/components/Button/ButtonLogin";

function Login() {
  return (
    <div className="flex min-h-screen">
      <div
        className="hidden md:flex flex-1 flex items-center justify-center bg-gradient-to-b from-blue-700 to-blue-900"
        style={{ flex: 2 }}
      >
        <div className="text-center">
          <h1 className="text-white text-4xl font-bold">SAEL</h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#141414]">
        <div className="w-full max-w-sm p-8">
          <h2 className="font-Montserrat text-white text-2xl font-bold text-4xl">Entrar</h2>
          <p className="text-neutral-300 mb-2">Prencha os dados e acesse sua conta</p>

          <Input type="email" className="bg-neutral-800 mb-4"/>

          <Input type="password" className="bg-neutral-800 mb-4"/>

          <ButtonSocialLogin className="rounded-lg px-6 py-3 mb-4" />

          <ButtonLogin type="entrar"/>

          <p className="text-gray-400 text-sm text-center mt-4">
            Não possui conta?{" "}
            <Link to="/cadastro" className="text-blue-500 hover:underline">
              Faça seu cadastro.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
