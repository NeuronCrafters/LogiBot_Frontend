import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ChartFilter = ({ onFilter }) => {
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('');
  const [classroom, setClassroom] = useState('');

  const handleFilter = () => {
    onFilter({ university, course, classroom });
  };

  return (
    <div className="flex space-x-4">
      <Input
        placeholder="Universidade"
        value={university}
        onChange={(e) => setUniversity(e.target.value)}
      />
      <Input
        placeholder="Curso"
        value={course}
        onChange={(e) => setCourse(e.target.value)}
      />
      <Input
        placeholder="Turma"
        value={classroom}
        onChange={(e) => setClassroom(e.target.value)}
      />
      <Button onClick={handleFilter}>Filtrar</Button>
    </div>
  );
};

export { ChartFilter };