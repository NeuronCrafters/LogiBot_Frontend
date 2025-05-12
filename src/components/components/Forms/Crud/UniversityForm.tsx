import React, { useState } from "react";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

export interface UniversityData {
  name: string;
}

export interface UniversityFormProps {
  onSubmit: (data: UniversityData) => void;
  initialData?: UniversityData;
}

function UniversityForm({ onSubmit, initialData }: UniversityFormProps) {
  const [name, setName] = useState<string>(initialData?.name || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim() });
    setName("");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label className="block text-white mb-2">Nome da Universidade:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="p-2 rounded w-full bg-[#141414] text-white"
        />
      </div>

      <div className="pt-2">
        <ButtonCRUD
          action={initialData ? "update" : "create"}
          onClick={handleSubmit}
        />
      </div>
    </form>
  );
}

export { UniversityForm };
