import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-Auth";
import { UniversityForm } from "./UniversityForm";
import { CourseForm } from "./CourseForm";
import { ProfessorForm } from "./ProfessorForm";
import { ClassForm } from "./ClassForm";
import { DisciplineForm } from "./DisciplineForm";
import { motion, AnimatePresence } from "framer-motion";
import type {
  UniversityData,
  CourseData,
  ProfessorData,
  ClassData,
  DisciplineData,
} from "@/@types/FormsDataTypes";

type EntityType = "university" | "course" | "class" | "professor" | "discipline";

type Univ = UniversityData & { id?: string | number };
type Course = CourseData & { id?: string | number };
type Prof = ProfessorData & { id?: string | number };
type Cls = ClassData & { id?: string | number };
type Disc = DisciplineData & { id?: string | number };

interface FormsCrudProps {
  onSubmit: (
    entidade: EntityType,
    item: Univ | Course | Prof | Cls | Disc
  ) => void;
  initialData?:
  | { type: "university"; data: Univ }
  | { type: "course"; data: Course }
  | { type: "class"; data: Cls }
  | { type: "professor"; data: Prof }
  | { type: "discipline"; data: Disc };
  onEntityChange?: () => void;
  animateForm?: boolean;
}

export const FormsCrud: React.FC<FormsCrudProps> = ({
  onSubmit,
  initialData,
  onEntityChange,
  animateForm = false,
}) => {
  const { user } = useAuth();
  if (!user) return null;

  const roles = Array.isArray(user.role) ? user.role : [user.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");

  if (!isAdmin && !isCoordinator) return null;

  const allowedEntities: EntityType[] = isAdmin
    ? ["university", "course", "class", "professor", "discipline"]
    : ["class", "discipline"];

  const [selectedEntity, setSelectedEntity] = useState<EntityType | "">(
    initialData?.type && allowedEntities.includes(initialData.type)
      ? initialData.type
      : ""
  );

  useEffect(() => {
    if (selectedEntity && onEntityChange) {
      onEntityChange();
    }
  }, [selectedEntity, onEntityChange]);

  const handleSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedEntity(e.target.value as EntityType);
  };

  const initial =
    initialData?.type === selectedEntity ? initialData.data : undefined;

  return (
    <div className="form-container">
      <h2 className="text-xl font-bold mb-4 text-white">Cadastro</h2>

      <label className="block mb-2 text-sm text-white">Selecione a Entidade:</label>
      <select
        value={selectedEntity}
        onChange={handleSelectChange}
        className="select-entity"
      >
        <option value="">-- Escolha --</option>
        {allowedEntities.map((ent) => (
          <option key={ent} value={ent}>
            {{
              university: "Universidade",
              course: "Curso",
              class: "Turma",
              professor: "Professor",
              discipline: "Disciplina",
            }[ent]}
          </option>
        ))}
      </select>

      <AnimatePresence>
        {selectedEntity === "university" && isAdmin && animateForm && (
          <motion.div
            key="university"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <UniversityForm
              onSubmit={(dados) => onSubmit("university", dados)}
              initialData={initial as Univ | undefined}
            />
          </motion.div>
        )}
        {selectedEntity === "course" && isAdmin && animateForm && (
          <motion.div
            key="course"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CourseForm
              onSubmit={(dados) => onSubmit("course", dados)}
              initialData={initial as Course | undefined}
            />
          </motion.div>
        )}
        {selectedEntity === "class" && animateForm && (
          <motion.div
            key="class"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ClassForm
              onSubmit={(dados) => onSubmit("class", dados)}
              initialData={initial as Cls | undefined}
            />
          </motion.div>
        )}
        {selectedEntity === "professor" && isAdmin && animateForm && (
          <motion.div
            key="professor"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ProfessorForm
              onSubmit={(dados) => onSubmit("professor", dados)}
              initialData={initial as Prof | undefined}
            />
          </motion.div>
        )}
        {selectedEntity === "discipline" && (isAdmin || isCoordinator) && animateForm && (
          <motion.div
            key="discipline"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DisciplineForm
              onSubmit={(dados) => onSubmit("discipline", dados)}
              initialData={initial as Disc | undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};