import { AnimatedLogo } from "@/components/components/AnimatedLogo/AnimatedLogo";
import { useAuthStore } from "@/stores/authStore";
import { Link, useNavigate } from "react-router-dom";

export function Home() {

  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handlePlayClick = () => {
    if (user) {
      navigate("/chat");
    } else {
      navigate("/signin");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#141414] text-white">
      <header className="w-full p-6 flex justify-between items-center bg-[#1F1F1F] shadow-lg">
        <h1 className="text-2xl font-bold">Sistema de Apoio ao Ensino de Lógica</h1>
        <Link to="/signin" className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 transition">
          <button
            onClick={handlePlayClick}
          >
            Jogar
          </button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col md:flex-row items-center justify-center text-center p-6 gap-10">
        <div className="w-full md:w-1/2 flex flex-col items-center">
          <h2 className="text-4xl font-bold mb-4">Bem-vindo ao SAEL</h2>
          <p className="text-lg max-w-md">
            Nossa plataforma é um sistema de apoio academico. Com a nossa suporte você irá aprender assuntos de lógica de programação, além de reforçar a sua base com atividades.
          </p>
        </div>

        <div className="w-full md:w-1/2 flex items-center justify-center">
          <AnimatedLogo />
        </div>
      </main>

      <footer className="w-full p-4 bg-[#1F1F1F] text-center text-gray-400">
        © {new Date().getFullYear()} Sistema de Apoio ao Ensino de Lógica. Todos os direitos reservados.
      </footer>
    </div>
  );
}
