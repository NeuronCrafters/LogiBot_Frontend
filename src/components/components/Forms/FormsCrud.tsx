import React, { useState } from 'react';
import axios from 'axios';

export type EntityType = 'university' | 'course' | 'class' | 'professor' | 'discipline';

interface FormsCrudProps {
  onSubmit: (item: any) => void;
  initialData?: any;
}

function FormsCrud({ onSubmit, initialData }: FormsCrudProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<EntityType | ''>('');

  const [name, setName] = useState(initialData?.name || '');
  const [universityId, setUniversityId] = useState(initialData?.universityId || '');
  const [courseId, setCourseId] = useState(initialData?.courseId || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState(initialData?.school || '');
  const [classIds, setClassIds] = useState(
    initialData?.classIds ? initialData.classIds.join(',') : ''
  );
  const [professorIds, setProfessorIds] = useState(
    initialData?.professorIds ? initialData.professorIds.join(',') : ''
  );

  function resetFields() {
    setName('');
    setUniversityId('');
    setCourseId('');
    setEmail('');
    setPassword('');
    setSchool('');
    setClassIds('');
    setProfessorIds('');
    setSelectedEntity('');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
          payload = { name, universityId };
          response = await axios.post('http://localhost:3000/academic-institution/course', payload);
          break;
        case 'class':
          payload = { name, courseId };
          response = await axios.post('http://localhost:3000/academic-institution/class', payload);
          break;
        case 'professor':
          payload = { name, email, password, role: 'professor', school };
          response = await axios.post('http://localhost:3000/users', payload);
          break;
        case 'discipline':
          const classIdsArray = classIds.split(',').map(s => s.trim()).filter(s => s);
          const professorIdsArray = professorIds.split(',').map(s => s.trim()).filter(s => s);
          payload = { name, courseId, classIds: classIdsArray, professorIds: professorIdsArray };
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
                <input
                  type="text"
                  placeholder="ID da Universidade"
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  className="border border-white p-2 rounded bg-[#141414] text-white"
                />
              )}

              {selectedEntity === 'class' && (
                <input
                  type="text"
                  placeholder="ID do Curso"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="border border-white p-2 rounded bg-[#141414] text-white"
                />
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
                  <input
                    type="text"
                    placeholder="ID do Curso"
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="border border-white p-2 rounded bg-[#141414] text-white"
                  />
                  <input
                    type="text"
                    placeholder="IDs das Turmas (separados por vírgula)"
                    value={classIds}
                    onChange={(e) => setClassIds(e.target.value)}
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

          <button type="submit" className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
            Criar
          </button>
        </form>
      )}
    </div>
  );
}

export { FormsCrud };
