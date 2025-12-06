import { useState, useRef } from "react";
import { publicApi } from "@/services/api/api";
import toast, { Toaster } from "react-hot-toast";
import { Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      return toast.error("Digite seu e-mail.");
    }

    if (!captchaToken) {
      return toast.error("Confirme que você não é um robô.");
    }

    try {
      setLoading(true);
      const res = await publicApi.post("/password/send-reset-password", {
        email,
        captcha: captchaToken,
      });

      if (res.status === 200) {
        toast.success("📩 Verifique seu e-mail");
      } else {
        toast.error(res.data?.error || "Erro inesperado ao enviar e-mail.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erro ao enviar e-mail.");
    } finally {
      setLoading(false);
      recaptchaRef.current?.reset();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white">
      <Toaster />
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 p-6 bg-zinc-800 rounded-xl">
        <h1 className="text-2xl font-bold text-center">Esqueci minha senha</h1>
        <input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 bg-zinc-700 rounded"
          required
        />
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
          onChange={setCaptchaToken}
          theme="dark"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
        >
          {loading ? "Enviando..." : "Enviar link de redefinição"}
        </button>
        <Link to="/signin" className="block text-center text-sm text-blue-400 hover:underline">
          Voltar ao login
        </Link>
      </form>
    </div>
  );
}