import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/services/api/api";
import toast, { Toaster } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Token inválido ou ausente.");
      setTimeout(() => navigate("/signin"), 2000);
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) return toast.error("Token ausente na URL.");
    if (newPassword.length < 8) {
      return toast.error("A senha deve ter pelo menos 8 caracteres.");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("As senhas não coincidem.");
    }

    try {
      setLoading(true);
      await api.patch("/password/reset-password", { token, newPassword });
      toast.success("Senha redefinida com sucesso!");
      setTimeout(() => navigate("/signin"), 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erro ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 text-white px-4">
      <Toaster />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 p-6 bg-zinc-800 rounded-xl shadow-lg"
      >
        <h1 className="text-2xl font-bold text-center">Redefinir Senha</h1>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nova senha (mín. 8 caracteres)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 bg-zinc-700 rounded disabled:opacity-50 pr-10"
            minLength={8}
            disabled={loading}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-400"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirme a nova senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 bg-zinc-700 rounded disabled:opacity-50 pr-10"
            minLength={8}
            disabled={loading}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute top-1/2 right-2 transform -translate-y-1/2 text-gray-400"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Redefinir Senha"}
        </button>
      </form>
    </div>
  );
}