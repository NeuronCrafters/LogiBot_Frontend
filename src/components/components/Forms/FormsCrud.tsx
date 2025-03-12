import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

export type EntityType = 'university' | 'course' | 'class' | 'professor' | 'discipline';

interface FormsCrudProps {
  onSubmit: (item: any) => void;
  initialData?: any;
}

function FormsCrud({ onSubmit, initialData }: FormsCrudProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<EntityType | ''>('');

  const [name, setName] = useState(initialData?.name || '');

  const [universities, setUniversities] = useState<{ _id: string; name: string }[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState(initialData?.universityId || '');
  const [courses, setCourses] = useState<{ _id: string; name: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(initialData?.courseId || '');

  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState(initialData?.school || '');

  const [selectedClassIds, setSelectedClassIds] = useState<string>('');
  const [professorIds, setProfessorIds] = useState(initialData?.professorIds ? initialData.professorIds.join(',') : '');

  useEffect(() => {
    if (selectedEntity === 'course' || selectedEntity === 'class' || selectedEntity === 'discipline') {
      axios.get('http://localhost:3000/academic-institution/university')
        .then(response => setUniversities(response.data))
        .catch(error => console.error('Erro ao carregar universidades', error));
    }
  }, [selectedEntity]);

  useEffect(() => {
    if ((selectedEntity === 'class' || selectedEntity === 'discipline') && selectedUniversity) {
      axios.get(`http://localhost:3000/academic-institution/course/${selectedUniversity}`)
        .then(response => setCourses(response.data))
        .catch(error => console.error('Erro ao carregar cursos', error));
    }
  }, [selectedEntity, selectedUniversity]);

  function resetFields() {
    setName('');
    setSelectedUniversity('');
    setSelectedCourse('');
    setEmail('');
    setPassword('');
    setSchool('');
    setSelectedClassIds('');
    setProfessorIds('');
    setSelectedEntity('');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    try {
      let payload;
      let response;
      switch (selectedEntity) {
        case 'university':
          payload = { name };
          response = await axios.post('http://localhost:3000/academic-institution/university', payload);
          break;
        case 'course':
          payload = { name, universityId: selectedUniversity };
          response = await axios.post('http://localhost:3000/academic-institution/course', payload);
          break;
        case 'class':
          payload = { name, courseId: selectedCourse };
          response = await axios.post('http://localhost:3000/academic-institution/class', payload);
          break;
        case 'professor':
          payload = { name, email, password, role: 'professor', school };
          response = await axios.post('http://localhost:3000/users', payload);
          break;
        case 'discipline':
          // Converte os IDs inseridos (separados por vírgula) em arrays
          const classIdsArray = selectedClassIds.split(',').map(s => s.trim()).filter(s => s);
          const professorIdsArray = professorIds.split(',').map((s: string) => s.trim()).filter((s: any) => s);
          payload = { name, courseId: selectedCourse, classIds: classIdsArray, professorIds: professorIdsArray };
          response = await axios.post('http://localhost:3000/academic-institution/discipline', payload);
          break;
        default:
          console.error('Entidade inválida');
      }
      if (response) {
        onSubmit(response.data);
      }
      resetFields();
      setIsExpanded(false);
    } catch (error) {
      console.error('Erro ao criar item:', error);
    }
  }

  return (
    <div className="mb-4">
      <div
        className="cursor-pointer bg-[#2a2a2a] text-white flex items-center justify-center h-10 rounded-t"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="mt-0 p-4 border border-t-0 border-white rounded-b bg-[#141414] text-white">
          <div className="mb-4">
            <label className="block mb-1">Selecione a Entidade:</label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value as EntityType)}
              className="border border-white p-2 rounded w-full bg-[#141414] text-white"
            >
              <option value="">Selecione</option>
              <option value="university">Universidade</option>
              <option value="course">Curso</option>
              <option value="class">Turma</option>
              <option value="professor">Professor</option>
              <option value="discipline">Disciplina</option>
            </select>
          </div>

          {selectedEntity && (
            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-white p-2 rounded bg-[#141414] text-white"
              />

              {selectedEntity === 'course' && (
                <div>
                  <label className="block mb-1">Universidade:</label>
                  <select
                    value={selectedUniversity}
                    onChange={(e) => setSelectedUniversity(e.target.value)}
                    className="border border-white p-2 rounded w-full bg-[#141414] text-white"
                  >
                    <option value="">Selecione a universidade</option>
                    {universities.map((uni) => (
                      <option key={uni._id} value={uni._id}>
                        {uni.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(selectedEntity === 'class' || selectedEntity === 'discipline') && (
                <>
                  <div>
                    <label className="block mb-1">Universidade:</label>
                    <select
                      value={selectedUniversity}
                      onChange={(e) => setSelectedUniversity(e.target.value)}
                      className="border border-white p-2 rounded w-full bg-[#141414] text-white"
                    >
                      <option value="">Selecione a universidade</option>
                      {universities.map((uni) => (
                        <option key={uni._id} value={uni._id}>
                          {uni.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Curso:</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="border border-white p-2 rounded w-full bg-[#141414] text-white"
                    >
                      <option value="">Selecione o curso</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {selectedEntity === 'professor' && (
                <>
                  <input
                    type="text"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-white p-2 rounded bg-[#141414] text-white"
                  />
                  <input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border border-white p-2 rounded bg-[#141414] text-white"
                  />
                  <input
                    type="text"
                    placeholder="Escola"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="border border-white p-2 rounded bg-[#141414] text-white"
                  />
                </>
              )}

              {selectedEntity === 'discipline' && (
                <>
                  <div>
                    <label className="block mb-1">Curso:</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="border border-white p-2 rounded w-full bg-[#141414] text-white"
                    >
                      <option value="">Selecione o curso</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="IDs das Turmas (separados por vírgula)"
                    value={selectedClassIds}
                    onChange={(e) => setSelectedClassIds(e.target.value)}
                    className="border border-white p-2 rounded bg-[#141414] text-white"
                  />
                  <input
                    type="text"
                    placeholder="IDs dos Professores (separados por vírgula)"
                    value={professorIds}
                    onChange={(e) => setProfessorIds(e.target.value)}
                    className="border border-white p-2 rounded bg-[#141414] text-white"
                  />
                </>
              )}
            </div>
          )}

          <div className="mt-4">
            <ButtonCRUD action={initialData ? "update" : "create"} onClick={handleSubmit} />
          </div>
        </form>
      )}
    </div>
  );
}

export { FormsCrud };
