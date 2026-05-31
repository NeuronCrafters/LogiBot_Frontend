import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-Auth";
import { Input } from "@/components/components/Input/Input";
import { ButtonLogin } from "@/components/components/Button/ButtonLogin";
import { AnimatedLogo } from "../../components/components/AnimatedLogo/AnimatedLogo";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { AppModal } from "@/components/components/Modal/AppModal";
import { toast } from "react-hot-toast";
import { useMultiPageTour } from "@/hooks/useMultiPageTour";

function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [redirectTo, setRedirectTo] = useState<"/signup" | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();
  useMultiPageTour('guest');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();


    const finalEmail = email.replace(/\s/g, '');
    const finalPassword = password.replace(/\s/g, '');

    try {
      setLoading(true);
      await login(finalEmail, finalPassword);
      toast.success("login realizado com sucesso");
    } catch (error: any) {
      const msg = error?.message || "erro ao fazer login";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConsent = (route: "/signup") => (e: React.MouseEvent) => {
    e.preventDefault();
    setRedirectTo(route);
    setShowConsent(true);
  };

  const handleAcceptConsent = () => {
    setShowConsent(false);
    if (redirectTo) navigate(redirectTo);
  };

  return (
    <div className="relative flex min-h-screen">
      <AppModal
        isOpen={showConsent}
        type="consent"
        title="consentimento para coleta de dados"
        description="o logibot coleta dados de uso com finalidade educacional e para melhorar a sua experiência, tudo em conformidade com a lgpd"
        onConfirm={handleAcceptConsent}
        onClose={() => setShowConsent(false)}
      />

      <Link to="/" className="flex-1 hidden md:flex" style={{ flex: 2 }}>
        <div className="items-center justify-center flex-1 flex bg-gradient-to-b from-blue-700 to-blue-900">
          <AnimatedLogo />
          <Typograph
            text="logibots.ai"
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
            text="entrar"
            colorText="text-white"
            variant="text2"
            weight="bold"
            fontFamily="poppins"
            className="text-start"
          />
          <Typograph
            text="preencha os dados e acesse sua conta"
            colorText="text-neutral-300"
            variant="text7"
            weight="regular"
            fontFamily="poppins"
            className="mb-4 text-start"
          />

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              className="w-full bg-neutral-800"
              placeholder="e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))}
              required
              id="signin-email-input"
            />

            <Input
              type="password"
              className="w-full bg-neutral-800"
              placeholder="senha"
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))}
              required
              id="signin-password-input"
            />

            <ButtonLogin
              id="signin-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-slate-100 hover:text-slate-300"
            >
              {loading ? "entrando..." : "entrar"}
            </ButtonLogin>
          </form>

          <Typograph
            id="signin-signup-link"
            text={
              <>
                não possui conta?{" "}
                <a
                  href="#"
                  onClick={handleOpenConsent("/signup")}
                  className="text-blue-500 no-underline hover:underline"
                >
                  faça seu cadastro
                </a>
              </>
            }
            colorText="text-gray-400"
            variant="text9"
            weight="regular"
            fontFamily="poppins"
            className="mt-4 text-center"
          />

        </div>
      </div>
    </div>
  );
}

export { Signin };
