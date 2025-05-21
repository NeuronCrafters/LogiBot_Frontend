import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Typograph } from '@/components/components/Typograph/Typograph';
import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use';

// Variantes de animação para o coelho
const rabbitVariants = {
  initial: { y: -100, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
      delay: 0.2
    }
  },
  hover: {
    y: -20,
    transition: {
      yoyo: Infinity,
      duration: 1.5
    }
  },
  exit: {
    y: 100,
    opacity: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  }
};

// Variantes para o texto
const textVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.5,
      duration: 0.8
    }
  }
};

// Variantes para o card de alerta
const alertVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      delay: 0.7,
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  }
};

// SVG do coelho
const RabbitSVG = () => (
  <svg width="120" height="160" viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Corpo do coelho */}
    <motion.ellipse
      cx="60"
      cy="100"
      rx="40"
      ry="50"
      fill="#F5F5F5"
      stroke="#333333"
      strokeWidth="2"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    />

    {/* Cabeça */}
    <motion.circle
      cx="60"
      cy="50"
      r="30"
      fill="#F5F5F5"
      stroke="#333333"
      strokeWidth="2"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    />

    {/* Orelhas */}
    <motion.path
      d="M40 40 Q30 10 40 0"
      stroke="#333333"
      strokeWidth="3"
      fill="#F5F5F5"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ delay: 0.7, duration: 0.8 }}
    />
    <motion.path
      d="M80 40 Q90 10 80 0"
      stroke="#333333"
      strokeWidth="3"
      fill="#F5F5F5"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ delay: 0.7, duration: 0.8 }}
    />

    {/* Olhos */}
    <motion.circle
      cx="50"
      cy="45"
      r="5"
      fill="#333333"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.9, duration: 0.3 }}
    />
    <motion.circle
      cx="70"
      cy="45"
      r="5"
      fill="#333333"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.9, duration: 0.3 }}
    />

    {/* Nariz */}
    <motion.circle
      cx="60"
      cy="55"
      r="3"
      fill="#FF6B6B"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1, duration: 0.3 }}
    />

    {/* Boca */}
    <motion.path
      d="M55 62 Q60 68 65 62"
      stroke="#333333"
      strokeWidth="2"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay: 1.1, duration: 0.5 }}
    />

    {/* Patinhas */}
    <motion.ellipse
      cx="40"
      cy="130"
      rx="10"
      ry="15"
      fill="#F5F5F5"
      stroke="#333333"
      strokeWidth="2"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1.2, duration: 0.4 }}
    />
    <motion.ellipse
      cx="80"
      cy="130"
      rx="10"
      ry="15"
      fill="#F5F5F5"
      stroke="#333333"
      strokeWidth="2"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1.2, duration: 0.4 }}
    />
  </svg>
);

const AccessDeniedPage = () => {
  const navigate = useNavigate();
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);
  const [showShakeEffect, setShowShakeEffect] = useState(false);

  useEffect(() => {
    // Ocultar confetti após alguns segundos
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    // Efeito de tremida quando o componente monta - simula o coelho "recusando" acesso
    const shakeTimer = setTimeout(() => {
      setShowShakeEffect(true);

      // Desativa o efeito após a animação terminar
      setTimeout(() => {
        setShowShakeEffect(false);
      }, 1000);
    }, 1500);

    return () => {
      clearTimeout(timer);
      clearTimeout(shakeTimer);
    };
  }, []);

  return (
    <motion.div
      id="access-denied-container"
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4"
      initial={{ x: 0 }}
      animate={showShakeEffect ? {
        x: [0, -10, 10, -10, 10, -10, 10, -10, 10, -10, 0],
        transition: { duration: 0.8, ease: "easeInOut" }
      } : { x: 0 }}
    >
      {showConfetti && <ReactConfetti width={width} height={height} recycle={false} numberOfPieces={200} colors={['#FFD1DC', '#F5F5F5', '#FFB6C1']} />}

      <motion.div
        className="text-center"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={rabbitVariants}
        whileHover="hover"
      >
        <RabbitSVG />
      </motion.div>

      <motion.div
        className="mt-6 text-center"
        variants={textVariants}
        initial="initial"
        animate="animate"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Acesso Restrito</h1>
        <p className="text-xl text-gray-600 mb-6">
          Esta página de chat é exclusiva para estudantes.
        </p>
      </motion.div>

      <motion.div
        variants={alertVariants}
        initial="initial"
        animate="animate"
        className="w-full max-w-md mb-8"
      >
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="ml-2 text-red-800">Permissão insuficiente</AlertTitle>
          <AlertDescription className="text-red-700">
            Você não possui as permissões necessárias para acessar a área de chat.
            Apenas usuários com o papel de "Estudante" podem acessar esta funcionalidade.
          </AlertDescription>
        </Alert>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <Button
          onClick={() => navigate('/')}
          className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-6 py-2 rounded-md transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <Home size={18} />
          <Typograph
            text="Voltar para Home"
            colorText="text-white"
            variant="text4"
            weight="regular"
            fontFamily="poppins"
          />
        </Button>
      </motion.div>
    </motion.div>
  );
};

export { AccessDeniedPage };