import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-Auth";
import { api } from "@/services/api/api";
import { Input } from "@/components/components/Input/Input";
import { ButtonLogin } from "@/components/components/Button/ButtonLogin";
import { AnimatedLogo } from "@/components/components/AnimatedLogo/AnimatedLogo";
import { Typograph } from "@/components/components/Typograph/Typograph";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      name,
      email,
      password,
      code,
    };

    try {
      await api.post("/users", payload);
      await login(email, password);
    } catch (error: any) {
      console.error("Erro ao cadastrar:", error);
      const errorMessage = error.response?.data?.message || "Erro ao realizar o cadastro.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div
        className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-b from-blue-700 to-blue-900"
        style={{ flex: 2 }}
      >
        <AnimatedLogo />
        <Typograph
          text="SAEL"
          colorText="text-slate-100"
          variant="title10"
          weight="bold"
          fontFamily="poppins"
          className="mt-12 ml-8"
        />
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#141414]">
        <div className="w-full max-w-sm p-6 bg-[#1F1F1F] rounded-lg shadow-lg">
          <Typograph
            text="Cadastro"
            colorText="text-white"
            variant="text2"
            weight="bold"
            fontFamily="poppins"
            className="text-start"
          />
          <Typograph
            text="Realize seu cadastro"
            colorText="text-neutral-300"
            variant="text7"
            weight="regular"
            fontFamily="poppins"
            className="mb-2 text-start"
          />

          {error && (
            <Typograph
              text={error}
              colorText="text-red-500"
              variant="text9"
              weight="medium"
              fontFamily="poppins"
              className="mb-4"
            />
          )}

          <form onSubmit={handleRegister}>
            <Input
              type="text"
              placeholder="Nome completo"
              className="bg-neutral-800 mb-4"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              className="bg-neutral-800 mb-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Senha"
              className="bg-neutral-800 mb-4"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              type="text"
              placeholder="Código"
              className="bg-neutral-800 mb-4"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />

            <ButtonLogin
              type="submit"
              disabled={loading}
              className="bg-blue-700 hover:bg-blue-800 text-slate-100 hover:text-slate-300"
            >
              {loading ? "Cadastrando..." : "Cadastrar"}
            </ButtonLogin>
          </form>

          <Typograph
            text={
              <>
                Já possui conta?{" "}
                <Link to="/signin" className="text-blue-500 no-underline">
                  Faça Login
                </Link>
              </>
            }
            colorText="text-gray-400"
            variant="text9"
            weight="regular"
            fontFamily="poppins"
            className="text-center mt-4"
          />
        </div>
      </div>
    </div>
  );
}

export { Signup };