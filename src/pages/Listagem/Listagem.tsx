
import React, { useState } from "react";
import { Input } from "@/components/components/Input/Input"; // Importando o componente Input

interface Aluno {
  nome: string;
  matricula: string;
  turma: string;
  progresso: string;
}

const alunos: Aluno[] = [
  { nome: "Igor Santos Souza Correa", matricula: "202354060013", turma: "2023.2", progresso: "60%" },
  { nome: "Alexander Barbosa", matricula: "202304040201", turma: "2023.2", progresso: "80%" },
  { nome: "Igor Santos Souza Correa", matricula: "202354060013", turma: "2023.2", progresso: "60%" },
  { nome: "Alexander Barbosa", matricula: "202304040201", turma: "2023.2", progresso: "80%" },
  { nome: "Juliana Oliveira", matricula: "202304040202", turma: "2023.2", progresso: "75%" },
  { nome: "Carlos Eduardo", matricula: "202304040203", turma: "2023.2", progresso: "65%" },
  { nome: "Fernanda Silva", matricula: "202304040204", turma: "2023.2", progresso: "90%" },
  { nome: "Marcelo Pereira", matricula: "202304040205", turma: "2023.2", progresso: "85%" },
];

const AlunosDashboard: React.FC = () => {
  // Usando o estado para controlar os dados dos alunos
  const [alunosData, setAlunosData] = useState(alunos);

  // Função para atualizar os valores dos alunos quando editados
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Aluno,
    index: number
  ) => {
    const updatedAlunos = [...alunosData];
    updatedAlunos[index][field] = e.target.value;
    setAlunosData(updatedAlunos);
  };

  const inputClass =
    "mt-1 block w-full p-3 bg-[#4a48483b] text-white rounded-lg border border-[#222222] focus:outline-none focus:ring-2 focus:ring-blue-500";
  const cardClass =
    "bg-gray-800 p-4 rounded-lg shadow-xl hover:bg-gray-700 transition duration-300";
  const labelClass = "block text-sm font-medium";

  return (
    <div className="bg-black text-white min-h-screen p-10">
      {/* Cabeçalho */}
      <div className="flex items-center mb-8">
        <div className="flex items-center space-x-4">
          <img className="w-14 h-14 rounded-full" src="https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRUREvlCvHREdbT-Xsf2L2dmgO7AulT-6hqeDRUThJvVKKQwYuPwNatanNGyJiXSwubdlC8iTQHCPxOrsM-uuUCfg" alt="Professor" />
          <div>
            <h1 className="text-xl font-semibold">Professor</h1>
            <p className="text-sm">Turma: 2023-2</p>
          </div>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-center mb-8">Alunos</h2>

     
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {alunosData.map((aluno, index) => (
          <div key={index} className={cardClass}>
            {/* Campo de Nome */}
            <div className="mb-4">
              <label className={labelClass}>NOME</label>
              <Input
                type="name"
                value={aluno.nome}
                placeholder="Nome"
                onChange={(e) => handleInputChange(e, "nome", index)}  // Passando o campo de nome
                className={inputClass}
              />
            </div>

           
            <div className="mb-4">
              <label className={labelClass}>MATRÍCULA</label>
              <Input
                type="name"
                value={aluno.matricula}
                placeholder="Matrícula"
                onChange={(e) => handleInputChange(e, "matricula", index)}  // Passando o campo de matrícula
                className={inputClass}
              />
            </div>

           
            <div className="mb-4">
              <label className={labelClass}>TURMA</label>
              <Input
                type="name"
                value={aluno.turma}
                placeholder="Turma"
                onChange={(e) => handleInputChange(e, "turma", index)}  // Passando o campo de turma
                className={inputClass}
              />
            </div>

            
            <div className="mb-4">
              <label className={labelClass}>PROGRESSO</label>
              <Input
                type="name"
                value={aluno.progresso}
                placeholder="Progresso"
                onChange={(e) => handleInputChange(e, "progresso", index)}  
                className={inputClass}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlunosDashboard;
