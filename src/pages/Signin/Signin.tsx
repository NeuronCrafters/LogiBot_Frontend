import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-Auth";
import { Input } from "@/components/components/Input/Input";
import { AnimatedLogo } from "../../components/components/AnimatedLogo/AnimatedLogo";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { AppModal } from "@/components/components/Modal/AppModal";
import { toast } from "react-hot-toast";
import { useMultiPageTour } from "@/hooks/useMultiPageTour";
import { ArrowLeft } from "lucide-react";

function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [redirectTo, setRedirectTo] = useState<"/signup" | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();
  useMultiPageTour("guest");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalEmail = email.replace(/\s/g, "");
    const finalPassword = password.replace(/\s/g, "");
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
        title="Consentimento para coleta de dados"
        description="O LogiBots.AI coleta dados de uso com finalidade educacional e para melhorar a sua experiência, tudo em conformidade com a LGPD."
        onConfirm={handleAcceptConsent}
        onClose={() => setShowConsent(false)}
      />

      {/* Left panel — sem Link para não redirecionar ao clicar */}
      <div className="hidden md:flex" style={{ flex: 2 }}>
        <div className="relative flex flex-col h-full w-full items-center justify-center bg-gradient-to-b from-blue-800 to-blue-950 p-12">
          {/* Brand — apenas texto */}
          <div className="absolute top-12 left-12">
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
                text="Entrar"
                colorText="text-white"
                variant="text2"
                weight="bold"
                fontFamily="poppins"
                className="mb-1"
              />
              <Typograph
                text="Preencha os dados e acesse sua conta"
                colorText="text-neutral-400"
                variant="text8"
                weight="regular"
                fontFamily="poppins"
              />
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <Input
                type="email"
                className="w-full"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value.replace(/\s/g, ""))}
                required
                id="signin-email-input"
              />

              <Input
                type="password"
                className="w-full"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\s/g, ""))}
                required
                id="signin-password-input"
              />

              <button
                id="signin-submit-button"
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-[Poppins] font-semibold text-base rounded-md transition-colors border border-blue-400/40 shadow-md shadow-blue-900/30"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <p className="mt-5 text-center text-gray-400 text-[12px] font-[Poppins]">
              Não possui conta?{" "}
              <a
                href="#"
                onClick={handleOpenConsent("/signup")}
                className="text-blue-400 hover:underline"
              >
                Faça seu cadastro
              </a>
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

export { Signin };
