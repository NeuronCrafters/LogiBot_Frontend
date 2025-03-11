import { useForm } from "react-hook-form";
import api from "@/services/api";
import { BackButton } from "@/components/components/Button/BackButton";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";
import toast from "react-hot-toast";

function ProfessorForm() {
  const { register, handleSubmit, reset } = useForm();

  const onSubmit = async (data: any) => {
    try {
      const response = await api.post("/users", data);
      toast.success("Professor criado com sucesso!");
      console.log("Professor criado:", response.data);
      reset();
    } catch (error) {
      console.error("Erro ao criar professor:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-[#2a2a2a] p-6 rounded-lg shadow-md">
      <input
        {...register("name")}
        placeholder="Nome do Professor"
        className="border p-2 rounded w-full bg-[#3a3a3a] text-white placeholder-gray-400"
      />
      <input
        {...register("email")}
        placeholder="E-mail"
        className="border p-2 rounded w-full bg-[#3a3a3a] text-white placeholder-gray-400"
      />
      <input
        {...register("password")}
        type="password"
        placeholder="Senha"
        className="border p-2 rounded w-full bg-[#3a3a3a] text-white placeholder-gray-400"
      />

      <div className="flex justify-between">
        <BackButton />
        <ButtonCRUD action="create" onClick={handleSubmit(onSubmit)} />
      </div>
    </form>
  );
}

export default ProfessorForm;
