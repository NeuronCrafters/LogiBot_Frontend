import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Header } from "@/components/components/Header/Header";
import { useAuth } from "@/hooks/use-Auth";

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
            <button onClick={() => setMenuOpen(true)} className="focus:outline-none">
              <Avatar className="h-10 w-10 bg-gray-700 text-white flex items-center justify-center">
                <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export { FormsHeader }