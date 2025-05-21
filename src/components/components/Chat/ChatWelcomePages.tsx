import { motion } from 'framer-motion';
import { MessageSquare, Lock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Typograph } from '@/components/components/Typograph/Typograph';

export const NonStudentWelcome: React.FC<{ userRoles: string[] }> = ({ userRoles }) => {
  return (
    <div className="flex-1 w-full max-w-2xl mx-auto pt-32 pb-40 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="mx-auto bg-gradient-to-r from-violet-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <MessageSquare size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Bem-vindo ao Chat SAEL</h1>
        <p className="text-gray-400 text-lg">
          Nosso chat educacional é uma ferramenta exclusiva para estudantes.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-[#1f1f1f] rounded-lg p-6 mb-8 border border-neutral-800 shadow-lg"
      >
        <div className="flex items-start gap-4 mb-4">
          <Lock className="text-purple-500 mt-1" size={24} />
          <div>
            <h2 className="text-white text-xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-gray-400">
              Esta área é exclusiva para estudantes. A funcionalidade de chat permite tirar dúvidas,
              fazer exercícios e praticar conteúdos através de quizzes interativos.
            </p>
          </div>
        </div>

        <Alert className="bg-[#2a2a2a] border-purple-600 mt-4">
          <Info className="h-5 w-5 text-purple-500" />
          <AlertTitle className="text-white">Você não tem acesso a esta área</AlertTitle>
          <AlertDescription className="text-gray-400">
            Seu perfil atual ({userRoles.join(", ")}) não tem permissão para acessar a funcionalidade de chat.
            Entre em contato com o administrador se precisar de acesso.
          </AlertDescription>
        </Alert>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-center"
      >
        <Button
          onClick={() => window.location.href = '/'}
          className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-6 py-3 rounded-md transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Voltar para a Home
        </Button>
      </motion.div>
    </div>
  );
};

// Componente para a página de boas-vindas de administradores
export const AdminWelcome: React.FC = () => {
  return (
    <div className="flex-1 w-full max-w-2xl mx-auto pt-32 pb-40 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="mx-auto bg-gradient-to-r from-amber-500 to-orange-600 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <Lock size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Área Administrativa</h1>
        <p className="text-gray-400 text-lg">
          Como administrador, você tem acesso a diferentes funcionalidades do sistema.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-[#1f1f1f] rounded-lg p-6 mb-8 border border-neutral-800 shadow-lg"
      >
        <div className="flex items-start gap-4 mb-4">
          <Info className="text-amber-500 mt-1" size={24} />
          <div>
            <h2 className="text-white text-xl font-bold mb-2">Chat Exclusivo para Estudantes</h2>
            <p className="text-gray-400">
              A funcionalidade de chat foi projetada exclusivamente para estudantes, permitindo
              que eles pratiquem seus conhecimentos através de quizzes e tirem dúvidas.
            </p>
          </div>
        </div>

        <Alert className="bg-[#2a2a2a] border-amber-600 mt-4">
          <Info className="h-5 w-5 text-amber-500" />
          <AlertTitle className="text-white">Permissão de Administrador</AlertTitle>
          <AlertDescription className="text-gray-400">
            Como administrador, você tem acesso às funcionalidades de gerenciamento do sistema,
            como criação de conteúdo, visualização de relatórios e configurações gerais. Para gerenciar
            essas funções, utilize as outras seções do menu administrativo.
          </AlertDescription>
        </Alert>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-center"
      >
        <Button
          onClick={() => window.location.href = '/crud'}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-3 rounded-md transition-all duration-300 shadow-md hover:shadow-lg mr-4"
        >
          Ir para o CRUD
        </Button>
        <Button
          onClick={() => window.location.href = '/'}
          className="bg-[#2a2a2a] hover:bg-[#333333] text-white px-6 py-3 rounded-md transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Voltar para a Home
        </Button>
      </motion.div>
    </div>
  );
};