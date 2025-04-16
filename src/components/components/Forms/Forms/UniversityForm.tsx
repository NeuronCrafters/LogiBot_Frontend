import React, { useState } from "react";

export interface UniversityData {
  name: string;
}

export interface UniversityFormProps {
  onSubmit: (data: UniversityData) => void;
  initialData?: UniversityData;
}

function UniversityForm({ onSubmit, initialData }: UniversityFormProps) {
  const [name, setName] = useState<string>(initialData ? initialData.name : "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim() });
    setName("");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <label className="block text-white mb-2">Nome da Universidade:</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="p-2 rounded w-full bg-[#202020] text-white"
      />
      <button type="submit" className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
        {initialData ? "Atualizar" : "Cadastrar"}
      </button>
    </form>
  );
}

export { UniversityForm };
