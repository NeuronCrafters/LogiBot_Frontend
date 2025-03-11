import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { ButtonSocialLogin } from "@/components/components/Button/ButtonSocialLogin";
import { Input } from "@/components/components/Input/Input";
import { ButtonLogin } from "@/components/components/Button/ButtonLogin";
import { AnimatedLogo } from "../../components/components/AnimatedLogo/AnimatedLogo";
import api from "@/services/api";

function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/session", { email, password });
      const userData = response.data;
      setUser(userData);
      navigate("/chat");
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      setError("Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-b from-blue-700 to-blue-900" style={{ flex: 2 }}>
        <div className="flex items-end gap-4">
          <AnimatedLogo />
          <h1 className="text-white text-5xl lg:text-7xl font-bold">SAEL</h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#141414]">
        <div className="w-full max-w-sm p-6 bg-[#1F1F1F] rounded-lg shadow-lg">
          <h2 className="text-white text-4xl font-bold text-center">Entrar</h2>
          <p className="text-neutral-300 text-center mb-4">Preencha os dados e acesse sua conta</p>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              className="bg-neutral-800 w-full"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              className="bg-neutral-800 w-full"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <ButtonSocialLogin className="rounded-lg px-6 py-3 w-full" />

            <ButtonLogin type="submit" disabled={loading} className="w-full">
              {loading ? "Entrando..." : "Entrar"}
            </ButtonLogin>
          </form>

          <p className="text-gray-400 text-sm text-center mt-4">
            Não possui conta?{" "}
            <Link to="/signup" className="text-blue-500 no-underline hover:underline">
              Faça seu cadastro.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export { Signin };
