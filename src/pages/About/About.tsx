import { useEffect, useState } from "react";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";
import { Loader2, Menu as MenuIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Header } from "@/components/components/Header/Header";

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string[];
  university?: string;
  course?: string;
}

const translateRole = (role: string) => {
  switch (role) {
    case "student":
      return "Estudante";
    case "professor":
      return "Professor";
    case "teacher":
      return "Professor";
    case "course-coordinator":
      return "Professor Coordernador";
    case "admin":
      return "Administrador";
    default:
      return role;
  }
};

export function About() {
  const { isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data } = await api.get("/me");
      setUser(data);
    } catch (error) {
      toast.error("Erro ao carregar seus dados!");
      console.error("Erro ao buscar dados do usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full max-w-full px-0 sm:px-8 md:px-16 mx-auto">

      <div className="absolute bg-[#141414] w-full justify-between flex border-b-[0.5px] border-neutral-800 px-6 py-4">
        <p className="font-Montserrat text-neutral-200 font-semibold text-2xl">SOBRE MIM</p>
        {isAuthenticated && (
          <button onClick={() => setMenuOpen(true)} className="text-white">
            <MenuIcon size={28} />
          </button>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center p-6 w-full">
        <div className="bg-[#2a2a2a] p-8 rounded-lg shadow-lg w-full max-w-lg text-white">

          <div className="flex justify-center -mt-20 mb-6">
            <Avatar className="h-32 w-32 bg-gray-700 text-white text-3xl flex items-center justify-center border-4 border-[#2a2a2a]">
              <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : user ? (
            <div className="space-y-4 text-left">
              <p className="text-lg"><strong>Nome:</strong> {user.name}</p>
              <p className="text-lg"><strong>Email:</strong> {user.email}</p>
              <p className="text-lg">
                <strong>Função:</strong> {user.role.map(translateRole).join(", ")}
              </p>

              {user.university && <p className="text-lg"><strong>Universidade:</strong> {user.university}</p>}
              {user.course && <p className="text-lg"><strong>Curso:</strong> {user.course}</p>}
            </div>
          ) : (
            <p className="text-center text-red-500">Erro ao carregar os dados.</p>
          )}
        </div>
      </div>

      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />
    </div>
  );
}