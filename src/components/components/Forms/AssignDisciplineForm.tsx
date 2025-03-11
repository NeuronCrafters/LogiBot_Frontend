import { useForm } from "react-hook-form";
import api from "@/services/api";
import { BackButton } from "@/components/components/Button/BackButton";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import toast from "react-hot-toast";

function AssignDisciplineForm() {
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data: any) => {
    try {
      const response = await api.post("/academic-institution/assign-discipline", data);
      toast.success("Aluno vinculado à disciplina com sucesso!");
      console.log("Aluno vinculado à disciplina:", response.data);
      reset();
    } catch (error) {
      console.error("Erro ao vincular aluno:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 rounded-lg shadow-md bg-[#2a2a2a]  ">
      <input
        {...register("studentId")}
        placeholder="ID do Aluno"
        className="border p-2 rounded w-full bg-[#3a3a3a] text-white placeholder-gray-400"
      />
      <input
        {...register("disciplineId")}
        placeholder="ID da Disciplina"
        className="border p-2 rounded w-full bg-[#3a3a3a] text-white placeholder-gray-400"
      />

      <div className="flex justify-between">
        <BackButton />
        <ButtonCRUD action="create" onClick={handleSubmit(onSubmit)} />
      </div>
    </form>
  );
}

export default AssignDisciplineForm;
