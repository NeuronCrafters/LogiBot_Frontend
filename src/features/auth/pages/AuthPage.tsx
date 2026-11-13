import { apiError } from "@/shared/lib/apiError";
import { LanguageSwitcher } from "@/i18n/LanguageSwitcher";
import { PreferencesMenu } from "@/shared/preferences/PreferencesControls";
import { t, useLocale } from "@/i18n";
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
import logoMascote from "@/assets/logo.svg";
import { AppModal } from "@/shared/components/feedback/AppModal";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { api } from "@/shared/api/httpClient";

type AuthMode = "signin" | "signup";

interface AuthPageProps {
  mode: AuthMode;
}

export function AuthPage({ mode }: AuthPageProps) {
  useLocale();

  const isSignup = mode === "signup";
  const expired = new URLSearchParams(window.location.search).get("expired") === "1";
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
      toast.success({ key: "auth.loginRealizadoComSucesso", params: {} });
    } catch (error: any) {
      toast.error(error?.message || t("auth.erroAoFazerLogin"));
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

    if (!finalName) return toast.error({ key: "auth.nomeEObrigatorio", params: {} });
    if (!nameRegex.test(finalName))
      return toast.error(
        { key: "auth.nomeInvalidoUseAoMenos3Caracteres", params: {} },
      );
    if (!finalEmail) return toast.error({ key: "auth.eMailEObrigatorio", params: {} });
    if (!emailRegex.test(finalEmail))
      return toast.error({ key: "auth.formatoDeEMailInvalido", params: {} });
    if (!finalPassword) return toast.error({ key: "auth.senhaEObrigatoria", params: {} });
    if (finalPassword.length < 12)
      return toast.error({ key: "auth.aSenhaDeveTerPeloMenos12", params: {} });
    if (!finalCode) return toast.error({ key: "auth.codigoDeAcessoEObrigatorio", params: {} });

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
        apiError(err, "auth.erroAoRealizarOCadastro"),
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
    <div className="relative flex min-h-[100dvh] min-w-0 flex-col bg-neutral-950 font-[Poppins] text-white">
      <div className="absolute inset-x-0 top-0 flex min-w-0 items-start justify-end gap-2 px-4 py-3 sm:px-6"><PreferencesMenu /><LanguageSwitcher /></div>
      <AppModal
        isOpen={showConsent}
        type="consent"
        title={t("auth.consentimentoParaColetaDeDados")}
        description={t("auth.oLogibotAiColetaDadosDeUso")}
        onConfirm={handleAcceptConsent}
        onClose={() => setShowConsent(false)}
      />

      <main className="flex w-full min-w-0 flex-1 flex-col px-4 py-16 sm:px-6">
        <div className="my-auto grid w-full min-w-0 max-w-lg grid-cols-1 self-center overflow-hidden rounded-3xl border border-white/10 bg-surface shadow-2xl shadow-black/30 lg:max-w-4xl lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
          <section className="relative hidden min-h-[560px] min-w-0 flex-col items-center justify-center overflow-hidden border-r border-white/10 bg-neutral-950/60 p-8 lg:flex">
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
              <div className="flex h-52 w-52 items-center justify-center rounded-[2rem] border border-white/10 bg-surface shadow-xl shadow-black/20">
                <AnimatedLogo className="scale-[0.78]" />
              </div>
              <h1 className="mt-8 max-w-xs text-2xl font-semibold leading-tight text-white">
                {t("auth.aprendaLogicaComApoioInteligente")}</h1>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">
                {t("auth.entreParaContinuarSuaJornadaNoLogibot")}</p>
            </div>
          </section>

          <section className="flex min-w-0 items-center justify-center px-5 py-8 sm:min-h-[560px] sm:p-10">
            <div className="w-full min-w-0 max-w-sm">
              <div className="mb-6 lg:hidden">
                <Link
                  to="/"
                  className="mx-auto flex w-fit flex-col items-center gap-2 text-lg font-bold text-white"
                >
                  <img
                    src={logoMascote}
                    alt={t("common.logoMascoteDoLogibot")}
                    width={121}
                    height={123}
                    className="brand-mark h-auto w-24 max-w-full shrink-0 object-contain"
                  />
                  <span>LogiBot.AI</span>
                </Link>
              </div>

              <div className="mb-6 text-center lg:text-left">
                <h2 className="text-2xl font-semibold text-white">
                  {isSignup ? t("common.criarConta") : t("common.entrar")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {isSignup
                    ? t("auth.preenchaSeusDadosDeAcesso")
                    : t("auth.acesseSuaContaDoLogibotAi")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="min-w-0 space-y-3">
            {!isSignup && expired && <p role="status" className="mb-4 text-base leading-relaxed text-zinc-400">{t("auth.sessionExpired")}</p>}
                {isSignup && (
                  <AuthInput
                    id="signup-name-input"
                    icon={<User className="h-4 w-4" />}
                    type="text"
                    label={t("common.nomeCompleto")}
                    autoComplete="name"
                    value={name}
                    onChange={setName}
                    required
                  />
                )}
                <AuthInput
                  id={isSignup ? "signup-email-input" : "signin-email-input"}
                  icon={<Mail className="h-4 w-4" />}
                  type="email"
                  label={t("common.email")}
                  placeholder={t("auth.exemploDeEmail")}
                  autoComplete={isSignup ? "email" : "username"}
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
                  label={t("common.senha")}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  describedBy={isSignup ? "signup-password-hint" : undefined}
                  value={password}
                  onChange={(value) => setPassword(value.replace(/\s/g, ""))}
                  required
                />
                {isSignup && (
                  <>
                    <p id="signup-password-hint" className="pl-1 text-xs text-zinc-500">
                      {t("auth.aSenhaDeveTerNoMinimo12")}</p>
                    <AuthInput
                      id="signup-code-input"
                      icon={<FileText className="h-4 w-4" />}
                      type="text"
                      label={t("auth.codigoDeAcesso")}
                      autoComplete="off"
                      value={code}
                      onChange={(value) => setCode(value.replace(/\s/g, ""))}
                      required
                    />
                  </>
                )}
                <button
                  id={
                    isSignup ? "signup-submit-button" : "signin-submit-button"
                  }
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-400/40 bg-blue-600 text-sm font-semibold text-on-accent shadow-md shadow-blue-900/30 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? isSignup
                      ? t("auth.cadastrando")
                      : t("auth.entrando")
                    : isSignup
                      ? t("common.criarConta")
                      : t("common.entrar")}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              {/* {!isSignup && <Link to="/forgot-password" className="mt-4 block text-center text-xs text-blue-300 underline">{t("auth.forgotPassword")}</Link>} */}
              <p className="mt-5 text-center text-xs text-zinc-500">
                {isSignup ? t("auth.jaPossuiConta") : t("auth.naoPossuiConta")}{" "}
                {isSignup ? (
                  <Link
                    to="/signin"
                    className="text-blue-400 underline hover:text-blue-300"
                  >
                    {t("auth.facaLogin")}</Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConsent(true)}
                    className="text-blue-400 underline underline-offset-2 transition-colors hover:text-blue-300"
                  >
                    {t("auth.facaSeuCadastro")}</button>
                )}
              </p>

              <Link
                to="/"
                className="mx-auto mt-6 flex min-h-[44px] w-fit items-center justify-center gap-1.5 px-2 text-xs text-zinc-600 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                {t("auth.voltarParaAPaginaInicial")}</Link>
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
  label,
  placeholder,
  autoComplete,
  value,
  onChange,
  required,
  describedBy,
}: {
  id: string;
  icon: ReactNode;
  type: "text" | "email" | "password";
  label: string;
  placeholder?: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  describedBy?: string;
}) {
  useLocale();

  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className="block pl-1 text-sm font-medium text-zinc-300">
        {label}
      </label>
      <div className="flex h-14 w-full min-w-0 items-center gap-3 rounded-xl border border-control bg-neutral-950/60 px-3 text-zinc-400 transition-colors focus-within:border-blue-400 focus-within:text-blue-400 focus-within:ring-1 focus-within:ring-blue-400">
        <span className="shrink-0" aria-hidden="true">{icon}</span>
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
          spellCheck={type === "text" ? undefined : false}
          autoCapitalize={type === "text" ? undefined : "none"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          className="h-full w-full min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-zinc-600 sm:text-sm"
        />
        {type === "password" && (
          <button
            type="button"
            aria-label={showPassword ? t("auth.ocultarSenha") : t("auth.mostrarSenha")}
            aria-pressed={showPassword}
            aria-controls={id}
            onClick={() => setShowPassword((current) => !current)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
