import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppModal } from "@/components/components/Modal/AppModal";
import { Input } from "@/components/components/Input/Input";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { api } from "@/services/api/api";
import { useAuth } from "@/hooks/use-Auth";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleChangePassword = async () => {
    setError("");
    setSuccessMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Preencha todos os campos.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.patch("/password/update-password", {
        currentPassword,
        newPassword,
      });

      setSuccessMessage(
        response.data.message || "Senha atualizada com sucesso."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      /* ---------------- logout automático ---------------- */
      setTimeout(() => {
        logout();            // limpa token / contexto
        navigate("/signin"); // direciona para login
      }, 2000);              // 2 s para o usuário ler a mensagem
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Erro ao atualizar a senha.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      type="password"
      title="Alterar senha"
      description="Atualize sua senha com segurança. Use uma senha forte e única."
      onConfirm={handleChangePassword}
      acceptLabel="Salvar"
      cancelLabel="Cancelar"
      disabled={loading}
    >
      <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-4 mt-4 px-3">
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

        {successMessage && (
          <Typograph
            text={successMessage}
            colorText="text-green-500"
            variant="text9"
            weight="medium"
            fontFamily="poppins"
            className="text-center"
          />
        )}

        <Input
          type="password"
          placeholder="Senha atual"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full bg-neutral-800"
        />

        <Input
          type="password"
          placeholder="Nova senha"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full bg-neutral-800"
        />

        <Input
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-neutral-800"
        />
      </div>
    </AppModal>
  );
}
