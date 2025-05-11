import { AnimatePresence, motion } from "framer-motion";

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
  newCoordinator,
  candidates,
  currentCourseId,
  onAddChange,
  onRemoveChange,
  onCoordinatorChange,
}: CoordinatorRoleSectionProps) {
  const filteredCandidates = candidates.filter(
    (c) => c.courseId === currentCourseId
  );

  return (
    <div className="text-left space-y-4">
      <label className="flex items-center gap-2">
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

      <label className="flex items-center gap-2">
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

      <AnimatePresence>
        {removeCoord && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <label className="block mb-1 text-white mt-4">
              Indique o novo coordenador:
            </label>
            <select
              value={newCoordinator}
              onChange={(e) => onCoordinatorChange(e.target.value)}
              className="w-full p-2 rounded-md bg-[#202020] text-white"
            >
              <option value="">Selecione um professor</option>
              {filteredCandidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}