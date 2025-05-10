import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface InfosProps {
  type: "consent" | "signup";
  onAccept?: () => void;
}

const configMap = {
  consent: {
    title: "Consentimento para Coleta de Dados",
    message:
      "O SAEL coleta dados de uso com finalidade educacional e para melhorar a sua experiência. Tudo em conformidade com a LGPD.",
    acceptLabel: "Aceito os termos",
    declineLabel: "Não aceito",
  },
  signup: {
    title: "Bem-vindo ao SAEL",
    message:
      "O SAEL é um sistema de apoio acadêmico gratuito. Para usar todas as funcionalidades, é necessário criar uma conta gratuita.",
    acceptLabel: "Fechar",
    declineLabel: "",
  },
};

function Infos({ type, onAccept }: InfosProps) {
  const navigate = useNavigate();
  const config = configMap[type];

  const handleDecline = () => {
    // No modal de consentimento, voltar à Home
    navigate("/", { state: { skipInfoModal: true } });
  };

  const handleAccept = () => {
    if (onAccept) return onAccept();
    if (type === "consent") navigate("/signup");
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
            <h2 className="text-2xl font-bold tracking-tight">{config.title}</h2>
            <p className="text-sm sm:text-base leading-relaxed text-white/90">
              {config.message}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <Button
                onClick={handleAccept}
                className="w-full sm:w-auto border border-white"
                variant="default"
              >
                {config.acceptLabel}
              </Button>

              {type === "consent" && (
                <Button
                  onClick={handleDecline}
                  className="w-full sm:w-auto border border-white text-white"
                  variant="outline"
                >
                  {config.declineLabel}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export { Infos };
