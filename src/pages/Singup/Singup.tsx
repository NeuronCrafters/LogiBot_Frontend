import React, { useState } from "react";
// import { Captcha } from "@/components/components/Security/Captcha";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-Auth";
import { api } from "@/services/api/api";
import { Input } from "@/components/components/Input/Input";
import { ButtonLogin } from "@/components/components/Button/ButtonLogin";
import { AnimatedLogo } from "@/components/components/AnimatedLogo/AnimatedLogo";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { toast } from "react-hot-toast";
import { useMultiPageTour } from "@/hooks/useMultiPageTour";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  // const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  useMultiPageTour('guest');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const finalName = name.trim();
    const finalEmail = email.replace(/\s/g, '');
    const finalPassword = password.replace(/\s/g, '');
    const finalCode = code.replace(/\s/g, '');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s]{3,}$/;

    if (!finalName) {
      toast.error("Nome é obrigatório.");
      return;
    } else if (!nameRegex.test(finalName)) {
      toast.error("Nome inválido! Use ao menos 3 caracteres e evite símbolos especiais.");
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


    // Validação do reCAPTCHA desabilitada temporariamente
    /*
    if (!captchaToken) {
      toast.error("Por favor, confirme o captcha.");
      return;
    }
    */

    setLoading(true);
    try {
      await api.post("/users", {
        name: finalName,
        email: finalEmail,
        password: finalPassword,
        code: finalCode,
        // recaptchaToken: captchaToken, // Desabilitado
      });

      await login(finalEmail, finalPassword, "captcha-disabled");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Erro ao realizar o cadastro.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen">
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

      <div className="flex-1 flex items-center justify-center bg-[#141414]">
        <div className="w-[90%] md:w-full max-w-sm p-6 bg-[#1F1F1F] rounded-lg shadow-lg">
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
              className="w-full mb-4 bg-neutral-800"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              id="signup-name-input"
            />

            <Input
              type="email"
              placeholder="Email"
              className="w-full mb-4 bg-neutral-800"
              value={email}
              onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))}
              required
              id="signup-email-input"
            />

            <Input
              type="password"
              placeholder="Senha"
              className="w-full mb-4 bg-neutral-800"
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))}
              required
              id="signup-password-input"
            />

            <Input
              type="text"
              placeholder="Código"
              className="w-full mb-4 bg-neutral-800"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
              required
              id="signup-code-input"
            />

            <ButtonLogin
              id="signup-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-slate-100 hover:text-slate-300"
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
          {/* <Captcha onChange={setCaptchaToken} /> */}
        </div>
      </div >
    </div >
  );
}

export { Signup };