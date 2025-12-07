import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import toast from "react-hot-toast";
import { publicApi } from "@/services/api/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const mutation = useMutation({
    mutationFn: async (data: { email: string; captcha: string }) => {
      const response = await publicApi.post("/password/send-reset-password", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Verifique seu e-mail");
      setEmail("");
      setCaptchaToken(null);
      recaptchaRef.current?.reset();
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || "Erro ao enviar e-mail";
      toast.error(message);
      recaptchaRef.current?.reset();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Digite seu e-mail");
      return;
    }

    if (!captchaToken) {
      toast.error("Confirme que você não é um robô");
      return;
    }

    mutation.mutate({ email, captcha: captchaToken });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white">
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
          disabled={mutation.isPending}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-50"
        >
          {mutation.isPending ? "Enviando..." : "Enviar link de redefinição"}
        </button>

        <Link to="/signin" className="block text-center text-sm text-blue-400 hover:underline">
          Voltar ao login
        </Link>
      </form>
    </div>
  );
}