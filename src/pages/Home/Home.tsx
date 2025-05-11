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
          title="Bem-vindo ao SAEL"
          description="O SAEL é um sistema de apoio acadêmico gratuito. Para usar todas as funcionalidades, é necessário criar uma conta gratuita."
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
          className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 transition"
        >
          Jogar
        </button>
      </header>

      <main className="flex-1 flex flex-col md:flex-row items-center justify-center text-center p-6 gap-10">
        <div className="w-full md:w-1/2 flex flex-col items-center">
          <Typograph
            text="Bem-vindo ao SAEL"
            colorText="text-white"
            variant="title10"
            weight="bold"
            fontFamily="poppins"
            className="mb-4"
          />
          <Typograph
            text="SAEL é um sistema de apoio acadêmico. Com nosso suporte, você irá aprender assuntos de lógica de programação, além de reforçar sua base com atividades."
            colorText="text-white"
            variant="text5"
            weight="regular"
            fontFamily="poppins"
            className="max-w-md"
          />
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <AnimatedLogo />
        </div>
      </main>

      <Footer />
    </div>
  );
}
