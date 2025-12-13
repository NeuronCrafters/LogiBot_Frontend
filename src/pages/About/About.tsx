import { useState } from "react";
import {
  Loader2,
  User as UserIcon,
  School as SchoolIcon,
  BookOpen,
  Users,
  KeyRound,
  Pencil,
  ShieldCheck,
  GraduationCap
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-Auth";
import { api } from "@/services/api/api";
import { Avatar } from "@/components/components/Avatar/Avatar";
import { Header } from "@/components/components/Header/Header";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { DisciplineCode } from "@/components/components/About/DisciplineCode";
import { useMultiPageTour, UserRole } from "@/hooks/useMultiPageTour";

import { EditNameModal } from "@/components/components/About/Modals/EditNameModal";
import { EditEmailModal } from "@/components/components/About/Modals/EditEmailModal";
import { EditPasswordModal } from "@/components/components/About/Modals/EditPasswordModal";

interface DisciplineObject {
  id: string;
  name: string;
  code: string;
}

const translateRole = (r: string) =>
({
  student: "Estudante",
  professor: "Professor",
  teacher: "Professor",
  "course-coordinator": "Coordenador de Curso",
  admin: "Administrador",
}[r] ?? r);

function isDisciplineObj(d: unknown): d is DisciplineObject {
  return (
    d !== null &&
    typeof d === "object" &&
    "id" in d &&
    "name" in d &&
    "code" in d
  );
}

export function About() {
  const { user, setUser, isAuthenticated, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const [showEditName, setShowEditName] = useState(false);
  const [showEditEmail, setShowEditEmail] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const mainRole = (user && (Array.isArray(user.role) ? user.role[0] : user.role)) as UserRole || 'guest';
  useMultiPageTour(mainRole, {
    openMenu: () => setMenuOpen(true),
    closeMenu: () => setMenuOpen(false),
  });

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#141414]">
        <Loader2 className="w-12 h-12 text-zinc-500 animate-spin" />
      </div>
    );

  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#141414]">
        <Typograph text="Erro ao carregar os dados." colorText="text-red-500" variant="text5" weight="medium" fontFamily="poppins" />
      </div>
    );

  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const occupation = roles.map(translateRole).join(", ");
  const isAdmin = roles.includes("admin");
  const isProfessor = roles.includes("professor");
  const schoolName = Array.isArray(user.schoolName) ? user.schoolName.join(", ") : user.schoolName ?? "-";
  const courseName = Array.isArray(user.courseName) ? user.courseName.join(", ") : user.courseName ?? "-";
  const className = Array.isArray(user.className) ? user.className.join(", ") : user.className ?? "-";
  const profCourses = Array.isArray(user.courses) ? user.courses.map((c: any) => c.name).join(", ") : "-";
  const profClasses = Array.isArray(user.classes) ? user.classes.map((c: any) => c.name).join(", ") : "-";
  const disciplineObjects: DisciplineObject[] = Array.isArray(user.disciplines)
    ? user.disciplines.reduce<DisciplineObject[]>((acc, d) => {
      if (isDisciplineObj(d)) { acc.push(d); } else if (typeof d === "string") { acc.push({ id: d, name: d, code: d }); }
      return acc;
    }, [])
    : [];
  const profDisciplines = disciplineObjects.length > 0 ? disciplineObjects.map((d) => d.name).join(", ") : "-";

  const handleUpdateName = async (newName: string) => {
    try {
      const response = await api.patch(`/users/${user._id}/name`, {
        name: newName,
      });

      if (setUser && response.data.user) {
        setUser({ ...user, ...response.data.user });
      }

      toast.success("Nome atualizado com sucesso!");
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || "Erro ao atualizar nome.";
      toast.error(message);
      throw error;
    }
  };

  const handleUpdateEmail = async (newEmail: string) => {
    try {
      const response = await api.patch(`/users/${user._id}/email`, {
        email: newEmail,
      });

      if (setUser && response.data.user) {
        setUser({ ...user, ...response.data.user });
      }

      toast.success("E-mail atualizado com sucesso!");
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || "Erro ao atualizar e-mail.";
      toast.error(message);
      throw error;
    }
  };

  const handleUpdatePassword = async (currentPass: string, newPass: string) => {
    try {
      await api.patch(`/users/password`, {
        currentPassword: currentPass,
        newPassword: newPass,
      });

      toast.success("Senha alterada com sucesso!");
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.error || "Erro ao alterar senha.";
      toast.error(message);
      throw error;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#141414] text-white">
      <header className="flex items-center justify-between px-4 py-4 border-b sm:px-6 border-zinc-800 bg-[#141414]">
        <Typograph text="Meu Perfil" colorText="text-white" variant="text2" weight="bold" fontFamily="poppins" />
        {isAuthenticated && (
          <Button onClick={() => setMenuOpen(true)} className="p-0 rounded-full hover:opacity-80 transition-opacity" id="about-header-menu-button">
            <div className="w-10 h-10 rounded-full rainbow-avatar">
              <Avatar seed={user._id} backgroundColor="#141414" className="w-full h-full rounded-full" />
            </div>
          </Button>
        )}
      </header>

      <main className="flex flex-col items-center flex-1 px-4 py-8 overflow-y-auto">

        <div className="w-full max-w-2xl bg-[#1f1f1f] border border-zinc-800 rounded-2xl shadow-xl overflow-hidden relative">

          <div className="h-32 bg-gradient-to-r from-zinc-900 to-[#141414] border-b border-zinc-800 relative">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-zinc-800/80 rounded-full text-xs text-zinc-400 font-mono border border-zinc-700">
                ID: {user._id.slice(-6).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="px-8 pb-6 -mt-16 flex flex-col md:flex-row md:items-end gap-6 relative">
            <div className="rainbow-avatar w-32 h-32 rounded-full border-4 border-[#1f1f1f] shadow-lg">
              <Avatar seed={user._id} backgroundColor="#2a2a2a" className="w-full h-full rounded-full" />
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                <button onClick={() => setShowEditName(true)} className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-zinc-800 rounded-md transition-colors" title="Editar nome">
                  <Pencil size={14} />
                </button>
              </div>
              <p className="text-zinc-400 font-medium flex items-center gap-2">
                {occupation}
                <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                <span className="text-zinc-500 text-sm">{user.email}</span>
                <button onClick={() => setShowEditEmail(true)} className="p-1 text-zinc-600 hover:text-purple-400 hover:bg-zinc-800 rounded-md transition-colors" title="Editar email">
                  <Pencil size={12} />
                </button>
              </p>
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          <div className="p-8 space-y-8">

            <section className="space-y-4">
              <SectionHeader icon={<UserIcon size={18} className="text-blue-500" />} title="Informações Pessoais" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <InfoItem label="Nome Completo" value={user.name} />
                <InfoItem label="E-mail" value={user.email} />
                <InfoItem label="Ocupação Principal" value={occupation} />
              </div>
            </section>

            {!isAdmin && (
              <section className="space-y-4">
                <SectionHeader icon={<GraduationCap size={18} className="text-green-500" />} title="Dados Acadêmicos" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <InfoItem label="Instituição" value={schoolName} icon={<SchoolIcon size={14} className="text-zinc-500" />} />

                  {isProfessor ? (
                    <>
                      <InfoItem label="Cursos Ministrados" value={profCourses} icon={<BookOpen size={14} className="text-zinc-500" />} />
                      <InfoItem label="Turmas" value={profClasses} icon={<Users size={14} className="text-zinc-500" />} />
                      <div className="col-span-1 md:col-span-2">
                        <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1 block">Disciplinas</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {disciplineObjects.length > 0 ? (
                            <DisciplineCode text={profDisciplines} disciplines={disciplineObjects} />
                          ) : <span className="text-zinc-400">-</span>}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <InfoItem label="Curso" value={courseName} icon={<BookOpen size={14} className="text-zinc-500" />} />
                      <InfoItem label="Turma" value={className} icon={<Users size={14} className="text-zinc-500" />} />
                    </>
                  )}
                </div>
              </section>
            )}

            <Separator className="bg-zinc-800" />

            <section className="space-y-4">
              <SectionHeader icon={<ShieldCheck size={18} className="text-orange-500" />} title="Segurança & Acesso" />
              <div className="flex items-center justify-between p-4 bg-[#141414] border border-zinc-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-800 rounded-full">
                    <KeyRound size={18} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Senha de Acesso</p>
                    <p className="text-xs text-zinc-500">Recomendamos senhas fortes e únicas.</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="text-sm bg-neutral-800 text-white transition-colors"
                  onClick={() => setShowEditPassword(true)}
                >
                  Alterar Senha
                </Button>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      <EditNameModal
        isOpen={showEditName}
        onClose={() => setShowEditName(false)}
        currentName={user.name}
        onSave={handleUpdateName}
      />

      <EditEmailModal
        isOpen={showEditEmail}
        onClose={() => setShowEditEmail(false)}
        currentEmail={user.email}
        onSave={handleUpdateEmail}
      />

      <EditPasswordModal
        isOpen={showEditPassword}
        onClose={() => setShowEditPassword(false)}
        onSave={handleUpdatePassword}
      />
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <Typograph text={title} colorText="text-zinc-200" variant="text4" weight="semibold" fontFamily="poppins" />
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm text-zinc-300 font-medium break-words">{value}</p>
    </div>
  );
}