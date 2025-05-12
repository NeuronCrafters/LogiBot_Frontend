import { useAuth } from "@/hooks/use-Auth";
import { useState } from "react";
import { FormsCrud } from "@/components/components/Forms/Crud/FormsCrud";
import { Header } from "@/components/components/Header/Header";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function CRUD() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);

  if (!user) return null;

  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");

  if (!isAdmin && !isCoordinator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414] text-white">
        <p>Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  const handleSubmit = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleEntityChange = () => {
    if (!showForm) setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <div className="absolute bg-[#141414] w-full flex items-center gap-4 border-b border-neutral-800 px-8 py-4 z-10">
        <Typograph
          text="Cadastro"
          colorText="text-white"
          variant="text2"
          weight="bold"
          fontFamily="poppins"
        />

        {user && (
          <div className="ml-auto">
            <Button onClick={() => setMenuOpen(true)} className="p-0 flex items-center justify-center">
              <div className="rainbow-avatar w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center">
                <Avatar
                  seed={user._id}
                  backgroundColor="#141414"
                  className="w-full h-full rounded-full"
                />
              </div>
            </Button>
          </div>
        )}
      </div>

      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      <div className="w-full flex justify-center pt-24 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-screen-md">
          <motion.div
            key="crud-section"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <FormsCrud
              onSubmit={handleSubmit}
              onEntityChange={handleEntityChange}
              animateForm={showForm}
            />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
            className="fixed top-6 right-6 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50"
          >
            Cadastro realizado com sucesso!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
