import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/shared/lib/toast";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { AnimatedLogo } from "@/shared/components/AnimatedLogo";
import { AppModal } from "@/shared/components/feedback/AppModal";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { api } from "@/shared/api/httpClient";

type AuthMode = "signin" | "signup";

interface AuthPageProps {
  mode: AuthMode;
}

export function AuthPage({ mode }: AuthPageProps) {
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  const handleLogin = async () => {
    const finalEmail = email.replace(/\s/g, "");
    const finalPassword = password.replace(/\s/g, "");
    setLoading(true);
    try {
      await login(finalEmail, finalPassword);
      toast.success("Login realizado com sucesso.");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    const finalName = name.trim();
    const finalEmail = email.replace(/\s/g, "");
    const finalPassword = password.replace(/\s/g, "");
    const finalCode = code.replace(/\s/g, "");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s]{3,}$/;

    if (!finalName) return toast.error("Nome é obrigatório.");
    if (!nameRegex.test(finalName))
      return toast.error(
        "Nome inválido. Use ao menos 3 caracteres e evite símbolos especiais.",
      );
    if (!finalEmail) return toast.error("E-mail é obrigatório.");
    if (!emailRegex.test(finalEmail))
      return toast.error("Formato de e-mail inválido.");
    if (!finalPassword) return toast.error("Senha é obrigatória.");
    if (finalPassword.length < 12)
      return toast.error("A senha deve ter pelo menos 12 caracteres.");
    if (!finalCode) return toast.error("Código de acesso é obrigatório.");

    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: finalName,
        email: finalEmail,
        password: finalPassword,
        code: finalCode,
      });
      await login(finalEmail, finalPassword);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Erro ao realizar o cadastro.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSignup) await handleSignup();
    else await handleLogin();
  };

  const handleAcceptConsent = () => {
    setShowConsent(false);
    navigate("/signup");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <AppModal
        isOpen={showConsent}
        type="consent"
        title="Consentimento para coleta de dados"
        description="O LogiBot.AI coleta dados de uso com finalidade educacional e para melhorar a sua experiência, tudo em conformidade com a LGPD."
        onConfirm={handleAcceptConsent}
        onClose={() => setShowConsent(false)}
      />

      <main className="flex min-h-screen font-[Poppins] sm:items-center sm:justify-center sm:px-6 sm:py-8">
        <div className="grid w-full sm:max-w-4xl overflow-hidden sm:rounded-2xl sm:border sm:border-white/10 bg-[#1f1f1f] sm:shadow-2xl sm:shadow-black/30 lg:grid-cols-[0.9fr_1fr]">
          <section className="relative hidden min-h-[560px] flex-col items-center justify-center overflow-hidden border-r border-white/10 bg-neutral-950/60 p-8 lg:flex">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-blue-500/10 blur-3xl" />
            <Link
              to="/"
              className="absolute left-8 top-8 flex items-center gap-2"
            >
              <span className="font-[Poppins] text-lg font-bold text-white">
                LogiBot.AI
              </span>
            </Link>
            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-52 w-52 items-center justify-center rounded-[2rem] border border-white/10 bg-[#1f1f1f] shadow-xl shadow-black/20">
                <AnimatedLogo className="scale-[0.78]" />
              </div>
              <h1 className="mt-8 max-w-xs text-2xl font-semibold leading-tight text-white">
                Aprenda lógica com apoio inteligente.
              </h1>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">
                Entre para continuar sua jornada no LogiBot.AI.
              </p>
            </div>
          </section>

          <section className="flex flex-1 min-h-screen sm:min-h-[560px] items-center justify-center p-6 sm:p-8">
            <div className="w-full max-w-sm">
              <div className="mb-8 lg:hidden">
                <Link
                  to="/"
                  className="mx-auto flex w-fit items-center gap-2 text-lg font-bold text-white"
                >
                  LogiBot.AI
                </Link>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-white">
                  {isSignup ? "Criar conta" : "Entrar"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {isSignup
                    ? "Preencha seus dados de acesso."
                    : "Acesse sua conta do LogiBot.AI."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {isSignup && (
                  <AuthInput
                    id="signup-name-input"
                    icon={<User className="h-4 w-4" />}
                    type="text"
                    placeholder="Nome completo"
                    value={name}
                    onChange={setName}
                    required
                  />
                )}
                <AuthInput
                  id={isSignup ? "signup-email-input" : "signin-email-input"}
                  icon={<Mail className="h-4 w-4" />}
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(value) => setEmail(value.replace(/\s/g, ""))}
                  required
                />
                <AuthInput
                  id={
                    isSignup ? "signup-password-input" : "signin-password-input"
                  }
                  icon={<Lock className="h-4 w-4" />}
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(value) => setPassword(value.replace(/\s/g, ""))}
                  required
                />
                {isSignup && (
                  <>
                    <AuthInput
                      id="signup-code-input"
                      icon={<FileText className="h-4 w-4" />}
                      type="text"
                      placeholder="Código de acesso"
                      value={code}
                      onChange={(value) => setCode(value.replace(/\s/g, ""))}
                      required
                    />
                    <p className="pl-1 text-xs text-zinc-500">
                      A senha deve ter no mínimo 12 caracteres.
                    </p>
                  </>
                )}
                <button
                  id={
                    isSignup ? "signup-submit-button" : "signin-submit-button"
                  }
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-blue-400/40 bg-blue-600 text-sm font-semibold text-white shadow-md shadow-blue-900/30 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? isSignup
                      ? "Cadastrando..."
                      : "Entrando..."
                    : isSignup
                      ? "Criar conta"
                      : "Entrar"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-zinc-500">
                {isSignup ? "Já possui conta?" : "Não possui conta?"}{" "}
                {isSignup ? (
                  <Link
                    to="/signin"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Faça login
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConsent(true)}
                    className="text-blue-400 transition-colors hover:text-blue-300"
                  >
                    Faça seu cadastro
                  </button>
                )}
              </p>

              <Link
                to="/"
                className="mt-8 flex items-center justify-center gap-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar para a página inicial
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function AuthInput({
  id,
  icon,
  type,
  placeholder,
  value,
  onChange,
  required,
}: {
  id: string;
  icon: ReactNode;
  type: "text" | "email" | "password";
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-neutral-950/60 px-3 text-zinc-400 transition-colors focus-within:border-blue-500/60 focus-within:text-blue-400">
      {icon}
      <input
        id={id}
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
      />
      {type === "password" && (
        <button
          type="button"
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          onClick={() => setShowPassword((current) => !current)}
          className="rounded-md p-1 text-zinc-500 transition-colors hover:text-white"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}
