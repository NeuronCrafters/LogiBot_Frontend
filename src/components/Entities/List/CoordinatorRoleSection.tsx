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

export function CoordinatorRoleSection({
  alreadyIsCoordinator,
  addCoord,
  removeCoord,
  onAddChange,
  onRemoveChange,
}: CoordinatorRoleSectionProps) {

  return (
    <div className="text-left space-y-4 bg-[#1f1f1f] p-4 rounded-xl border border-white/10">
      <label className="flex items-center gap-2 text-white">
        <input
          type="checkbox"
          checked={addCoord}
          onChange={() => {
            onAddChange(!addCoord);
            if (!addCoord) onRemoveChange(false);
          }}
          disabled={alreadyIsCoordinator}
        />
        Adicionar o cargo de: Coordenador de Curso
      </label>

      <label className="flex items-center gap-2 text-white">
        <input
          type="checkbox"
          checked={removeCoord}
          onChange={() => {
            onRemoveChange(!removeCoord);
            if (!removeCoord) onAddChange(false);
          }}
          disabled={!alreadyIsCoordinator}
        />
        Remover o cargo de: Coordenador de Curso
      </label>
    </div>
  );
}
