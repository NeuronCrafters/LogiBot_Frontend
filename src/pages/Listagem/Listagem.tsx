
import React, { useState } from "react";// Importando o componente Input

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

  const cardClass =
    "bg-[#181818] p-4 rounded-2xl hover:bg-[#191919] transition duration-300";
  const labelClass = "block text-sm font-medium";

  return (
    <div className="bg-[#141414] text-white min-h-screen p-20">
      {/* Cabeçalho */}
      <div className="flex-1 items-center mb-8">

        <div className="bg-[#181818] p-4 md:w-64 w-full rounded-2xl flex items-center space-x-4">
          <img className="w-14 h-14 rounded-full" src="https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRUREvlCvHREdbT-Xsf2L2dmgO7AulT-6hqeDRUThJvVKKQwYuPwNatanNGyJiXSwubdlC8iTQHCPxOrsM-uuUCfg" alt="Professor" />
          <div>
            <h1 className="text-xl font-semibold">Professor</h1>
            <p className="text-sm">Turma: 2023-2</p>
          </div>        
        </div> 

        <h2 className="md:pt-2 pt-8 w-full text-3xl font-bold text-center md:mb-14">Alunos</h2>
      </div>


     
      <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {alunosData.map((aluno, index) => (
          <div key={index} className={cardClass}>
            {/* Campo de Nome */}
            <div className="mb-4">
              <label className={labelClass}>NOME</label>
                <div className="bg-[#222222] h-12 mt-1 p-3 text-white rounded-lg align-middle flex items-center">
                  <h1>{aluno.nome}</h1>
                </div>
            </div>

           
            <div className="bg-[#181818] mb-4">
              <label className={labelClass}>MATRÍCULA</label>
                <div className="bg-[#222222] h-12 mt-1 p-3 text-white rounded-lg align-middle flex items-center">
                  <h1>{aluno.matricula}</h1>
                </div>
            </div>

           
            <div className="mb-4">
              <label className={labelClass}>TURMA</label>
                <div className="bg-[#222222] h-12 mt-1 p-3 text-white rounded-lg align-middle flex items-center">
                  <h1>{aluno.turma}</h1>
                </div>
            </div>

            
            <div className="mb-4">
              <label className={labelClass}>PROGRESSO</label>
                <div className="bg-[#222222] h-12 mt-1 p-3 text-white rounded-lg align-middle flex items-center">
                  <h1>{aluno.progresso}</h1>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlunosDashboard;
