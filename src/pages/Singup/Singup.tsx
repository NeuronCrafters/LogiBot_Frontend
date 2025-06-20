import React, { useState } from "react";
import { Captcha } from "@/components/components/Security/Captcha";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-Auth";
import { api } from "@/services/api/api";
import { Input } from "@/components/components/Input/Input";
import { ButtonLogin } from "@/components/components/Button/ButtonLogin";
import { AnimatedLogo } from "@/components/components/AnimatedLogo/AnimatedLogo";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { toast } from "react-hot-toast";


function Signup() {
  /* ── form states ─────────────────────────────────────────────── */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  /* ── ui feedback ─────────────────────────────────────────────── */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();

  /* ── submit ──────────────────────────────────────────────────── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]{3,}$/;

    if (!name.trim()) {
      toast.error("Nome é obrigatório.");
      return;
    } else if (!nameRegex.test(name.trim())) {
      toast.error("Use ao menos 3 letras e evite símbolos.");
      return;
    }

    if (!email) {
      toast.error("E-mail é obrigatório.");
      return;
    } else if (!emailRegex.test(email)) {
      toast.error("Formato de e-mail inválido.");
      return;
    }

    if (!password) {
      toast.error("Senha é obrigatória.");
      return;
    } else if (password.length < 6) {
      toast.error("Use pelo menos 6 caracteres.");
      return;
    }

    if (!code) {
      toast.error("Código é obrigatório.");
      return;
    }

    if (!captchaToken) {
      toast.error("Por favor, confirme o captcha.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/users", {
        name,
        email,
        password,
        code,
        recaptchaToken: captchaToken,
      });

      await login(email, password, captchaToken);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Erro ao realizar o cadastro.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };


  /* ── render ──────────────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen">
      {/* --- Lado esquerdo (logo) -------------------------------- */}
      <Link to="/" className="flex-1 hidden md:flex" style={{ flex: 2 }}>
        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-blue-700 to-blue-900">
          <AnimatedLogo />
          <Typograph
            text="LogiBots.AI"
            colorText="text-slate-100"
            variant="title10"
            weight="bold"
            fontFamily="poppins"
            className="mt-12 ml-8"
          />
        </div>
      </Link>

      {/* --- Formulário ----------------------------------------- */}
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
              className="mb-4 text-center"
            />
          )}

          <form onSubmit={handleRegister}>
            <Input
              type="text"
              placeholder="Nome completo"
              className="mb-4 bg-neutral-800"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              type="email"
              placeholder="Email"
              className="mb-4 bg-neutral-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              placeholder="Senha"
              className="mb-4 bg-neutral-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              type="text"
              placeholder="Código"
              className="mb-4 bg-neutral-800"
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
            className="mt-4 text-center"
          />

          {/* captcha centralizado */}
          <Captcha onChange={setCaptchaToken} />
        </div>
      </div>
    </div>
  );
}

export { Signup };
