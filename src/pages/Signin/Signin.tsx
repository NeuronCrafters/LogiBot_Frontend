import { useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Captcha } from "@/components/components/Security/Captcha";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-Auth";
import { Input } from "@/components/components/Input/Input";
import { ButtonLogin } from "@/components/components/Button/ButtonLogin";
import { AnimatedLogo } from "../../components/components/AnimatedLogo/AnimatedLogo";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { AppModal } from "@/components/components/Modal/AppModal";

function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConsent, setShowConsent] = useState(false);
  const [redirectToSignup, setRedirectToSignup] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      alert("Por favor, confirme o captcha.");
      return;
    }

    try {
      await login(email, password, captchaToken);
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } catch (error) {
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    }
  };

  const handleAcceptConsent = () => {
    setShowConsent(false);
    if (redirectToSignup) {
      navigate("/signup");
    }
  };

  const handleOpenConsent = (e: React.MouseEvent) => {
    e.preventDefault();
    setRedirectToSignup(true);
    setShowConsent(true);
  };

  return (
    <div className="relative flex min-h-screen">
      <AppModal
        isOpen={showConsent}
        type="consent"
        title="Consentimento para Coleta de Dados"
        description="O LogiBot coleta dados de uso com finalidade educacional e para melhorar a sua experiência. Tudo em conformidade com a LGPD."
        onConfirm={handleAcceptConsent}
        onClose={() => setShowConsent(false)}
      />

      <Link to="/" className="flex-1 hidden md:flex" style={{ flex: 2 }}>
        <div className="items-center justify-center flex-1 flex bg-gradient-to-b from-blue-700 to-blue-900">
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
        <div className="w-full max-w-sm p-6 bg-[#1F1F1F] rounded-lg shadow-lg">
          <Typograph
            text="Entrar"
            colorText="text-white"
            variant="text2"
            weight="bold"
            fontFamily="poppins"
            className="text-start"
          />
          <Typograph
            text="Preencha os dados e acesse sua conta"
            colorText="text-neutral-300"
            variant="text7"
            weight="regular"
            fontFamily="poppins"
            className="mb-4 text-start"
          />

          {error && (
            <Typograph
              text={error}
              colorText="text-red-500"
              variant="text9"
              weight="medium"
              fontFamily="poppins"
              className="text-center"
            />
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              className="w-full bg-neutral-800"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              className="w-full bg-neutral-800"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <ButtonLogin
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-slate-100 hover:text-slate-300"
            >
              {loading ? "Entrando..." : "Entrar"}
            </ButtonLogin>
          </form>

          <Typograph
            text={
              <>
                Não possui conta?{" "}
                <a
                  href="#"
                  onClick={handleOpenConsent}
                  className="text-blue-500 no-underline hover:underline"
                >
                  Faça seu cadastro.
                </a>
              </>
            }
            colorText="text-gray-400"
            variant="text9"
            weight="regular"
            fontFamily="poppins"
            className="mt-4 text-center"
          />

          <Captcha ref={recaptchaRef} onChange={setCaptchaToken} />
        </div>
      </div>
    </div>
  );
}

export { Signin };
