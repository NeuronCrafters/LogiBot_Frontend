import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Trash } from "lucide-react";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { ButtonRainbow } from "@/components/components/Button/ButtonRainbow";

interface AppModalProps {
  isOpen: boolean;
  type: "consent" | "info" | "delete" | "create" | "update" | "password";
  title?: string;
  description?: string;
  acceptLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

const defaultConfig = {
  consent: {
    acceptLabel: "Aceito os termos",
    cancelLabel: "Não aceito",
  },
  info: {
    acceptLabel: "Fechar",
    cancelLabel: "",
  },
  delete: {
    acceptLabel: "Excluir",
    cancelLabel: "Cancelar",
  },
  create: {
    acceptLabel: "Salvar",
    cancelLabel: "Cancelar",
  },
  update: {
    acceptLabel: "Atualizar",
    cancelLabel: "Cancelar",
  },
  password: {
    acceptLabel: "Salvar",
    cancelLabel: "Cancelar",
  },
};

export function AppModal({
  isOpen,
  type,
  title,
  description,
  acceptLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  onClose,
  children,
  disabled = false,
}: AppModalProps) {
  if (!isOpen) return null;

  const config = defaultConfig[type];

  const handleConfirm = () => {
    if (disabled) return;
    if (onConfirm) onConfirm();
    else if (onClose) onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        <Card className="rounded-2xl shadow-2xl bg-[#1F1F1F] border border-neutral-700 text-white">
          <CardContent className="p-6 sm:p-8 space-y-6 text-center">
            {type === "delete" && (
              <Trash className="w-12 h-12 text-red-500 mx-auto" />
            )}

            {title && (
              <Typograph
                text={title}
                colorText="text-white"
                variant="text2"
                weight="bold"
                fontFamily="poppins"
              />
            )}

            {description && (
              <Typograph
                text={description}
                colorText="text-white/90"
                variant="text6"
                weight="regular"
                fontFamily="poppins"
              />
            )}

            {children && <div>{children}</div>}

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              {type !== "info" && (
                <ButtonRainbow
                  variant="outline"
                  onClick={handleCancel}
                >
                  {cancelLabel ?? config.cancelLabel}
                </ButtonRainbow>
              )}
              <ButtonRainbow
                variant={type === "delete" ? "destructive" : "default"}
                onClick={handleConfirm}
                disabled={disabled}
              >
                {acceptLabel ?? config.acceptLabel}
              </ButtonRainbow>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}