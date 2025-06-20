import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { AppModal } from "@/components/components/Modal/AppModal";
import { Input } from "@/components/components/Input/Input";
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
  const [loading, setLoading] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos.");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("A nova senha deve ser diferente da atual.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.patch("/password/update-password", {
        currentPassword,
        newPassword,
      });

      const msg =
        response.data?.message ||
        "Senha atualizada com sucesso. Você será deslogado em 2 segundos.";

      toast.success(msg);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        logout();
        navigate("/signin");
      }, 2000);
    } catch (err: any) {
      const errorData = err?.response?.data;
      const msg =
        errorData?.message ||
        errorData?.error ||
        "Erro ao atualizar a senha.";
      toast.error(msg);
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
      acceptLabel={loading ? "Salvando..." : "Salvar"}
      cancelLabel="Cancelar"
      disabled={loading}
    >
      <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-4 mt-4 px-3">
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
