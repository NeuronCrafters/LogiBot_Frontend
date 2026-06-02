interface Candidate {
  id: string;
  name: string;
  courseId?: string;
}

interface CoordinatorRoleSectionProps {
  alreadyIsCoordinator: boolean;
  addCoord: boolean;
  removeCoord: boolean;
  newCoordinator: string;
  candidates: Candidate[];
  currentCourseId: string;
  onAddChange: (val: boolean) => void;
  onRemoveChange: (val: boolean) => void;
  onCoordinatorChange: (val: string) => void;
}

export function CoordinatorRoleSection({ alreadyIsCoordinator, addCoord, removeCoord, onAddChange, onRemoveChange }: CoordinatorRoleSectionProps) {
  return (
    <div className="space-y-2">
      <p className="font-[Poppins] text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Cargo de Coordenador</p>

      <label className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${alreadyIsCoordinator ? "border-white/5 opacity-40 cursor-not-allowed" : addCoord ? "border-blue-500/40 bg-blue-500/10" : "border-white/10 bg-neutral-950/40 hover:bg-white/5"}`}>
        <input type="checkbox" checked={addCoord} onChange={() => { onAddChange(!addCoord); if (!addCoord) onRemoveChange(false); }} disabled={alreadyIsCoordinator} className="accent-blue-500 w-4 h-4 shrink-0" />
        <div>
          <p className="font-[Poppins] text-sm text-white font-medium leading-snug">Adicionar coordenador de curso</p>
          <p className="font-[Poppins] text-xs text-zinc-500 mt-0.5">{alreadyIsCoordinator ? "Este professor já é coordenador" : "Atribuir o papel de coordenador a este professor"}</p>
        </div>
      </label>

      <label className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${!alreadyIsCoordinator ? "border-white/5 opacity-40 cursor-not-allowed" : removeCoord ? "border-red-500/40 bg-red-500/10" : "border-white/10 bg-neutral-950/40 hover:bg-white/5"}`}>
        <input type="checkbox" checked={removeCoord} onChange={() => { onRemoveChange(!removeCoord); if (!removeCoord) onAddChange(false); }} disabled={!alreadyIsCoordinator} className="accent-red-500 w-4 h-4 shrink-0" />
        <div>
          <p className="font-[Poppins] text-sm text-white font-medium leading-snug">Remover coordenador de curso</p>
          <p className="font-[Poppins] text-xs text-zinc-500 mt-0.5">{!alreadyIsCoordinator ? "Este professor não é coordenador" : "Revogar o papel de coordenador deste professor"}</p>
        </div>
      </label>
    </div>
  );
}
