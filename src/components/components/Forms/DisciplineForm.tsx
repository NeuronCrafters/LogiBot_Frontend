import { useForm } from "react-hook-form";
import api from "@/services/api";
import { BackButton } from "@/components/components/Button/BackButton";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import toast from "react-hot-toast";

function DisciplineForm() {
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data: any) => {
    try {
      const response = await api.post("/academic-institution/discipline", data);
      toast.success("Disciplina criada com sucesso!");
      console.log("Disciplina criada:", response.data);
      reset();
    } catch (error) {
      console.error("Erro ao criar disciplina:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-[#2a2a2a] p-6 rounded-lg shadow-md">
      <input
        {...register("name")}
        placeholder="Nome da Disciplina"
        className="border p-2 rounded w-full bg-[#3a3a3a] text-white placeholder-gray-400"
      />
      <input
        {...register("courseId")}
        placeholder="ID do Curso"
        className="border p-2 rounded w-full bg-[#3a3a3a] text-white placeholder-gray-400"
      />
      <input
        {...register("classIds")}
        placeholder="IDs das Turmas (separados por vírgula)"
        className="border p-2 rounded w-full bg-[#3a3a3a] text-white placeholder-gray-400"
      />
      <input
        {...register("professorIds")}
        placeholder="IDs dos Professores (separados por vírgula)"
        className="border p-2 rounded w-full bg-[#3a3a3a] text-white placeholder-gray-400"
      />

      <div className="flex justify-between">
        <BackButton />
        <ButtonCRUD action="create" onClick={handleSubmit(onSubmit)} />
      </div>
    </form>
  );
}

export default DisciplineForm;
