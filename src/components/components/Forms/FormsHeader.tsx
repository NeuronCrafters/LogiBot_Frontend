import { useState } from "react";
import { Header } from "@/components/components/Header/Header";
import { useAuth } from "@/hooks/use-Auth";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Button } from "@/components/ui/button";

function FormsHeader() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />
      <div className="p-6 bg-[#141414] border-b border-neutral-700 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white hidden sm:block font-Montserrat">
            Gerenciamento Acadêmico
          </h1>
          <h1 className="text-xl font-bold text-white block sm:hidden">
            Gerenciamento
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <Button onClick={() => setMenuOpen(true)} aria-label="Abrir menu">
              <div
                className="
        rounded-full p-[1px]
        bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600
        inline-flex items-center justify-center
        w-8 h-8
        sm:w-10 sm:h-10
        md:w-12 md:h-12
        lg:w-14 lg:h-14
      "
              >
                <Avatar
                  seed={user._id}
                  backgroundColor="#2a2a2a"
                  className="w-full h-full"
                />
              </div>
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

export { FormsHeader };
