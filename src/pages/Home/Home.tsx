import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatedLogo } from "@/components/components/AnimatedLogo/AnimatedLogo";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Footer } from "@/components/components/Footer/Footer";
import { AppModal } from "@/components/components/Modal/AppModal";

export function Home() {
  const [showInfo, setShowInfo] = useState(false);
  const navigate = useNavigate();

  const handlePlayClick = () => {
    setShowInfo(true);
  };

  const handleAccept = () => {
    setShowInfo(false);
    navigate("/signin");
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-[#141414] text-white">
      {showInfo && (
        <AppModal
          isOpen={true}
          type="info"
          title="Bem-vindo ao LogiBots.IA"
          description="O LogiBots.IA é um sistema de apoio acadêmico gratuito. Para usar todas as funcionalidades, é necessário criar uma conta gratuita."
          onConfirm={handleAccept}
          onClose={() => setShowInfo(false)}
        />
      )}

      <header className="w-full p-6 flex justify-between items-center bg-[#1F1F1F] shadow-lg">
        <Typograph
          text="Sistema de Apoio ao Ensino de Lógica"
          colorText="text-white"
          variant="text4"
          weight="bold"
          fontFamily="poppins"
        />
        <button
          onClick={handlePlayClick}
          className="px-4 py-2 transition bg-blue-500 rounded hover:bg-blue-600"
        >
          Jogar
        </button>
      </header>

      <main className="flex flex-col items-center justify-center flex-1 gap-10 p-6 text-center md:flex-row">
        <div className="flex flex-col items-center w-full md:w-1/2">
          <Typograph
            text="Bem-vindo ao LogiBots.IA"
            colorText="text-white"
            variant="title10"
            weight="bold"
            fontFamily="poppins"
            className="mb-4"
          />
          <Typograph
            text="LogiBots.IA é um sistema de apoio acadêmico. Com nosso suporte, você irá aprender assuntos de lógica de programação, além de reforçar sua base com atividades."
            colorText="text-white"
            variant="text5"
            weight="regular"
            fontFamily="poppins"
            className="max-w-md"
          />
        </div>
        <div className="flex items-center justify-center w-full md:w-1/2">
          <AnimatedLogo />
        </div>
      </main>

      <Footer />
    </div>
  );
}
