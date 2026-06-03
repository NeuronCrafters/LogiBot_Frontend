import React, { useEffect, useState } from "react";
import { EntityActionButton } from "@/features/admin/components/EntityActionButton";

export interface UniversityData {
  name: string;
}

export interface UniversityFormProps {
  onSubmit: (data: UniversityData) => void;
  initialData?: UniversityData;
}

const labelCls =
  "block mb-1.5 font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500";
const inputCls =
  "h-11 w-full rounded-xl border border-white/10 bg-neutral-950/60 px-3 font-[Poppins] text-sm text-white outline-none transition-colors focus:border-blue-500/60 placeholder:text-zinc-600";

function UniversityForm({ onSubmit, initialData }: UniversityFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");

  useEffect(() => setName(initialData?.name ?? ""), [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim() });
    if (!initialData) setName("");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div>
        <label className={labelCls}>Nome da Universidade</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Universidade Federal de São Paulo"
          required
          className={inputCls}
        />
      </div>
      <div className="pt-1">
        <EntityActionButton
          action={initialData ? "update" : "create"}
          onClick={handleSubmit}
        />
      </div>
    </form>
  );
}

export { UniversityForm };
