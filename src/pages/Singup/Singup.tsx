import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-Auth";
import { api } from "@/services/api/api";
import { Input } from "@/components/components/Input/Input";
import { AnimatedLogo } from "@/components/components/AnimatedLogo/AnimatedLogo";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { toast } from "react-hot-toast";
import { useMultiPageTour } from "@/hooks/useMultiPageTour";
import { CheckCircle, ArrowLeft } from "lucide-react";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  useMultiPageTour("guest");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const finalName = name.trim();
    const finalEmail = email.replace(/\s/g, "");
    const finalPassword = password.replace(/\s/g, "");
    const finalCode = code.replace(/\s/g, "");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s]{3,}$/;

    if (!finalName) {
      toast.error("Nome é obrigatório.");
      return;
    } else if (!nameRegex.test(finalName)) {
      toast.error(
        "Nome inválido! Use ao menos 3 caracteres e evite símbolos especiais.",
      );
      return;
    }

    if (!finalEmail) {
      toast.error("E-mail é obrigatório.");
      return;
    } else if (!emailRegex.test(finalEmail)) {
      toast.error("Formato de e-mail inválido.");
      return;
    }

    if (!finalPassword) {
      toast.error("Senha é obrigatória.");
      return;
    } else if (finalPassword.length < 12) {
      toast.error("A senha deve ter pelo menos 12 caracteres!");
      return;
    }

    setLoading(true);
    try {
      await api.post("/users", {
        name: finalName,
        email: finalEmail,
        password: finalPassword,
        code: finalCode,
      });

      await login(finalEmail, finalPassword);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "Erro ao realizar o cadastro.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    "Chatbot especializado em lógica de programação",
    "Quizzes com feedback imediato e personalizado",
    "Painel de analytics para professores e coordenadores",
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left panel — sem Link para não redirecionar ao clicar */}
      <div className="hidden md:flex" style={{ flex: 2 }}>
        <div className="flex flex-col h-full w-full items-center justify-between bg-gradient-to-b from-blue-800 to-blue-950 p-12">
          {/* Brand — apenas texto */}
          <div className="self-start">
            <span className="font-[Poppins] font-bold text-[22px] text-white leading-none">
              LogiBots.AI
            </span>
          </div>

          {/* Mascote + tagline */}
          <div className="flex flex-col items-center gap-6 text-center">
            <AnimatedLogo className="scale-150" />
            <div className="mt-6 space-y-2">
              <Typograph
                text="Aprenda Lógica de Programação com IA"
                colorText="text-white"
                variant="title11"
                weight="bold"
                fontFamily="poppins"
                className="leading-tight text-center"
              />
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-3 w-full">
            {features.map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-300 shrink-0" />
                <span className="text-blue-100 text-sm font-[Poppins]">
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-[#141414] px-4">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile-only brand */}
          <div className="flex md:hidden items-center justify-center">
            <span className="font-[Poppins] font-bold text-[20px] text-white leading-none">
              LogiBots.AI
            </span>
          </div>

          {/* Card */}
          <div className="p-8 bg-[#1F1F1F] rounded-2xl border border-white/5 shadow-2xl">
            <div className="mb-6">
              <Typograph
                text="Criar conta"
                colorText="text-white"
                variant="text2"
                weight="bold"
                fontFamily="poppins"
                className="mb-1"
              />
              <Typograph
                text="Preencha os dados para começar"
                colorText="text-neutral-400"
                variant="text8"
                weight="regular"
                fontFamily="poppins"
              />
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-[12px] font-[Poppins] text-center">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3">
              <Input
                type="text"
                placeholder="Nome completo"
                className="w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                id="signup-name-input"
              />

              <Input
                type="email"
                placeholder="E-mail"
                className="w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value.replace(/\s/g, ""))}
                required
                id="signup-email-input"
              />

              <Input
                type="password"
                placeholder="Senha"
                className="w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\s/g, ""))}
                required
                id="signup-password-input"
              />

              <Input
                type="text"
                placeholder="Código de acesso"
                className="w-full"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
                required
                id="signup-code-input"
              />

              <p className="text-gray-500 text-[11px] font-[Poppins] pl-1">
                A senha deve ter no mínimo 12 caracteres.
              </p>

              <button
                id="signup-submit-button"
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-[Poppins] font-semibold text-base rounded-md transition-colors border border-blue-400/40 shadow-md shadow-blue-900/30"
              >
                {loading ? "Cadastrando..." : "Criar conta"}
              </button>
            </form>

            <p className="mt-5 text-center text-gray-400 text-[12px] font-[Poppins]">
              Já possui conta?{" "}
              <Link to="/signin" className="text-blue-400 hover:underline">
                Faça login
              </Link>
            </p>
          </div>

          <Link to="/" className="flex items-center justify-center gap-1.5 text-gray-600 hover:text-gray-400 transition-colors text-[11px] font-[Poppins]">
            <ArrowLeft className="w-3 h-3" />
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}

export { Signup };
