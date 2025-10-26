import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatedLogo } from "@/components/components/AnimatedLogo/AnimatedLogo";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Footer } from "@/components/components/Footer/Footer";
import { AppModal } from "@/components/components/Modal/AppModal";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

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

    const startTour = () => {
        const driverObj = driver({
            showProgress: true,
            animate: true,
            onDestroyed: () => {
                localStorage.setItem('logibots-tour-concluido', 'true');
            },
            steps: [
                {
                    element: '#welcome-title',
                    popover: {
                        title: 'Bem-vindo ao LogiBots.IA!',
                        description: 'Este é um tour rápido para você conhecer nossa página inicial.',
                        side: 'bottom'
                    }
                },
                {
                    element: '#animated-logo',
                    popover: {
                        title: 'Nosso Mascote Lógico',
                        description: 'Ele estará com você durante sua jornada de aprendizado.',
                        side: 'left'
                    }
                },
                {
                    element: '#play-button',
                    popover: {
                        title: 'Comece a Aprender',
                        description: 'Quando estiver pronto, clique aqui para criar sua conta gratuita e começar a usar a plataforma!',
                        side: 'bottom'
                    }
                },
            ]
        });
        driverObj.drive();
    };

    useEffect(() => {
        const tourConcluido = localStorage.getItem('logibots-tour-concluido');
        if (!tourConcluido) {
            setTimeout(() => {
                startTour();
            }, 500);
        }
    }, []);

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
            id="play-button"
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
            id="welcome-title"
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
        <div className="flex items-center justify-center w-full md:w-1/2" id="animated-logo">
          <AnimatedLogo />
        </div>
      </main>

      <Footer />
    </div>
  );
}
