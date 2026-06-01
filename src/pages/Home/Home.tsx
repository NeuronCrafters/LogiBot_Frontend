import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatedLogo } from "@/components/components/AnimatedLogo/AnimatedLogo";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Footer } from "@/components/components/Footer/Footer";
import { AppModal } from "@/components/components/Modal/AppModal";
import { ButtonRainbow } from "@/components/components/Button/ButtonRainbow";
import { useMultiPageTour } from "@/hooks/useMultiPageTour";
import logoMascote from "@/assets/logo.svg";
import {
  MessageCircle,
  BookOpen,
  BarChart2,
  GraduationCap,
  Users,
  Building2,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export function Home() {
  const [showInfo, setShowInfo] = useState(false);
  const navigate = useNavigate();

  useMultiPageTour("guest");

  const handlePlayClick = () => {
    setShowInfo(true);
  };

  const handleAccept = () => {
    setShowInfo(false);
    navigate("/signin");
  };

  const features = [
    {
      icon: <MessageCircle className="w-8 h-8 text-blue-400" />,
      title: "Chatbot Especializado",
      description:
        "Tire dúvidas em tempo real com nosso assistente de IA especializado em lógica de programação. Suporte com pseudocódigos e linguagens específicas.",
    },
    {
      icon: <BookOpen className="w-8 h-8 text-purple-400" />,
      title: "Quiz Personalizável",
      description:
        "Pratique com questões de múltipla escolha adaptadas ao seu nível e tema preferido. Receba feedback imediato com justificativas detalhadas.",
    },
    {
      icon: <BarChart2 className="w-8 h-8 text-green-400" />,
      title: "Learning Analytics",
      description:
        "Professores e coordenadores visualizam métricas de desempenho, gráficos de esforço vs. resultado e identificam alunos que precisam de atenção.",
    },
  ];

  const profiles = [
    {
      icon: <GraduationCap className="w-7 h-7 text-blue-400" />,
      role: "Aluno",
      color: "border-blue-500/30 hover:border-blue-400/60",
      iconBg: "bg-blue-500/10",
      benefits: [
        "Chat com IA sobre lógica de programação",
        "Quizzes com dificuldade e tema ajustáveis",
        "Feedback imediato em cada questão",
      ],
    },
    {
      icon: <Users className="w-7 h-7 text-purple-400" />,
      role: "Professor",
      color: "border-purple-500/30 hover:border-purple-400/60",
      iconBg: "bg-purple-500/10",
      benefits: [
        "Relatórios de proficiência por turma ou aluno",
        "Matriz de Desempenho vs. Esforço",
        "Identificação precoce de dificuldades",
      ],
    },
    {
      icon: <Building2 className="w-7 h-7 text-green-400" />,
      role: "Coordenador",
      color: "border-green-500/30 hover:border-green-400/60",
      iconBg: "bg-green-500/10",
      benefits: [
        "Supervisão estratégica de cursos",
        "Filtros globais por curso e instituição",
        "Decisões pedagógicas baseadas em dados",
      ],
    },
  ];

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

      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center bg-[#1F1F1F] shadow-lg border-b border-white/5 sticky top-0 z-50">
        <a href="/" className="flex items-center gap-3">
          <img
            src={logoMascote}
            alt="LogiBots mascote"
            className="h-10 w-10 object-contain"
          />
          <span className="font-[Poppins] font-bold text-[22px] text-white leading-none">
            LogiBots.AI
          </span>
        </a>
        <ButtonRainbow
          id="play-button"
          onClick={handlePlayClick}
          delayMs={0}
          className="gap-2 px-5"
        >
          Começar agora
          <ArrowRight className="w-4 h-4" />
        </ButtonRainbow>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 gap-10 px-6 py-16 text-center md:flex-row md:text-left md:py-24">
        <div className="flex flex-col items-center md:items-start w-full md:w-1/2 gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium font-[Poppins]">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Plataforma de IA para Educação
          </div>
          <Typograph
            id="welcome-title"
            text="Aprenda Lógica de Programação com Inteligência Artificial"
            colorText="text-white"
            variant="title7"
            weight="bold"
            fontFamily="poppins"
            className="leading-tight"
          />
          <Typograph
            text="O LogiBots.AI integra chatbot especializado, quizzes adaptativos e painéis de analytics — apoiando alunos na aprendizagem e professores no acompanhamento pedagógico."
            colorText="text-gray-300"
            variant="text6"
            weight="regular"
            fontFamily="poppins"
            className="max-w-lg"
          />
          <div className="flex gap-4 flex-wrap justify-center md:justify-start">
            <ButtonRainbow
              onClick={handlePlayClick}
              className="px-8 py-5 text-base gap-2"
            >
              Jogar agora
              <ArrowRight className="w-5 h-5" />
            </ButtonRainbow>
            <ButtonRainbow
              variant="outline"
              delayMs={0}
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-8 py-5 text-base"
            >
              Saiba mais
            </ButtonRainbow>
          </div>
        </div>
        <div
          id="animated-logo"
          className="flex items-center justify-center w-full md:w-1/2"
        >
          <AnimatedLogo className="scale-150" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-16 bg-[#1A1A1A]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Typograph
              text="Tudo que você precisa em um só lugar"
              colorText="text-white"
              variant="title10"
              weight="bold"
              fontFamily="poppins"
              className="mb-3"
            />
            <Typograph
              text="Três pilares para uma experiência de aprendizagem completa e eficaz"
              colorText="text-gray-400"
              variant="text6"
              weight="regular"
              fontFamily="poppins"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-4 p-6 rounded-2xl bg-[#242424] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="w-14 h-14 rounded-xl bg-[#1F1F1F] flex items-center justify-center">
                  {feature.icon}
                </div>
                <Typograph
                  text={feature.title}
                  colorText="text-white"
                  variant="text4"
                  weight="semibold"
                  fontFamily="poppins"
                />
                <Typograph
                  text={feature.description}
                  colorText="text-gray-400"
                  variant="text7"
                  weight="regular"
                  fontFamily="poppins"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Profiles */}
      <section className="px-6 py-16 bg-[#141414]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Typograph
              text="Para quem é o LogiBots.AI?"
              colorText="text-white"
              variant="title10"
              weight="bold"
              fontFamily="poppins"
              className="mb-3"
            />
            <Typograph
              text="Interfaces e funcionalidades adaptadas a cada perfil de usuário"
              colorText="text-gray-400"
              variant="text6"
              weight="regular"
              fontFamily="poppins"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <div
                key={profile.role}
                className={`flex flex-col gap-4 p-6 rounded-2xl bg-[#1F1F1F] border transition-colors ${profile.color}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${profile.iconBg} flex items-center justify-center`}
                >
                  {profile.icon}
                </div>
                <Typograph
                  text={profile.role}
                  colorText="text-white"
                  variant="text4"
                  weight="bold"
                  fontFamily="poppins"
                />
                <ul className="flex flex-col gap-2">
                  {profile.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                      <span className="text-gray-400 text-sm font-[Poppins]">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 bg-[#1A1A1A] border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <img
              src={logoMascote}
              alt="LogiBots mascote"
              className="h-12 w-12 object-contain"
            />
          </div>
          <Typograph
            text="Comece sua jornada de aprendizagem hoje"
            colorText="text-white"
            variant="title10"
            weight="bold"
            fontFamily="poppins"
          />
          <Typograph
            text="Acesso gratuito. Crie sua conta e explore o chatbot, os quizzes e muito mais."
            colorText="text-gray-400"
            variant="text6"
            weight="regular"
            fontFamily="poppins"
          />
          <ButtonRainbow
            onClick={handlePlayClick}
            className="px-10 py-5 text-base gap-2"
          >
            Criar conta gratuita
            <ArrowRight className="w-5 h-5" />
          </ButtonRainbow>
        </div>
      </section>

      <Footer />
    </div>
  );
}
