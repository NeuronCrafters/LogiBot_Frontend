import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-Auth";
import { ButtonSocialLogin } from "@/components/components/Button/ButtonSocialLogin";
import { Input } from "@/components/components/Input/Input";
import { ButtonLogin } from "@/components/components/Button/ButtonLogin";
import { AnimatedLogo } from "../../components/components/AnimatedLogo/AnimatedLogo";
import { Infos } from "@/components/components/Infos/Infos";

function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConsent, setShowConsent] = useState(false);
  const [redirectToSignup, setRedirectToSignup] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      setError("Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptConsent = () => {
    setShowConsent(false);
    if (redirectToSignup) {
      navigate("/signup");
    }
  };

  // const handleDeclineConsent = () => {
  //   setShowConsent(false);
  // };

  const handleOpenConsent = (e: React.MouseEvent) => {
    e.preventDefault();
    setRedirectToSignup(true);
    setShowConsent(true);
  };

  return (
    <div className="relative flex min-h-screen">
      {showConsent && (
        <Infos type="consent" onAccept={handleAcceptConsent} />
      )}

      <div
        className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-b from-blue-700 to-blue-900"
        style={{ flex: 2 }}
      >
        <AnimatedLogo />
        <h1 className="text-slate-100 text-5xl lg:text-6xl font-bold mt-12 ml-8">
          SAEL
        </h1>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#141414]">
        <div className="w-full max-w-sm p-6 bg-[#1F1F1F] rounded-lg shadow-lg">
          <h2 className="text-white text-4xl font-bold text-start">Entrar</h2>
          <p className="text-neutral-300 text-start mb-4">
            Preencha os dados e acesse sua conta
          </p>

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

            <ButtonLogin
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-slate-100 hover:text-slate-300"
            >
              {loading ? "Entrando..." : "Entrar"}
            </ButtonLogin>
          </form>

          <p className="text-gray-400 text-sm text-center mt-4">
            Não possui conta? {" "}
            <a
              href="#"
              onClick={handleOpenConsent}
              className="text-blue-500 no-underline hover:underline"
            >
              Faça seu cadastro.
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export { Signin };
