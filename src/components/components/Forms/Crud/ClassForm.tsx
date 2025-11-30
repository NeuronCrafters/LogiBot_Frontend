import React, { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-Auth";
import { academicFiltersApi } from "@/services/apiClient";
import { ButtonCRUD } from "@/components/components/Button/ButtonCRUD";

export interface ClassData {
  id?: string | number;
  _id?: string | number;
  name: string;
  courseId: string;
}

export interface ClassFormProps {
  onSubmit: (data: ClassData) => void;
  initialData?: ClassData;
}

function ClassForm({ onSubmit, initialData }: ClassFormProps) {
  const { user } = useAuth();

  const roles = Array.isArray(user?.role) ? user.role : [user?.role];
  const isAdmin = roles.includes("admin");
  const isCoordinator = roles.includes("course-coordinator");

  const { data: academicData, isLoading: loadingAcademicData } = useQuery({
    queryKey: ['academicData'],
    queryFn: async () => {
      const response = await academicFiltersApi.getAcademicData();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const [name, setName] = useState<string>(initialData ? initialData.name : "");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>(initialData ? initialData.courseId : "");
  const getFirstId = (value: string | string[] | undefined): string => {
    if (!value) return "";
    return Array.isArray(value) ? (value[0] || "") : value;
  };

  const getCoordinatorCourseId = (user: any): string => {
    if (!user?.courses || !Array.isArray(user.courses)) return "";

    const firstCourse = user.courses[0];

    if (firstCourse?.id) return firstCourse.id;

    if (typeof firstCourse === 'string') return firstCourse;

    return "";
  };

  const filteredUniversities = useMemo(() => {
    if (!academicData?.universities) return [];

    if (isAdmin) {
      return academicData.universities;
    }

    if (isCoordinator && user?.schoolId) {
      const universityId = getFirstId(user.schoolId);
      return academicData.universities.filter(u => u._id === universityId);
    }

    return [];
  }, [academicData, isAdmin, isCoordinator, user]);

  const availableCourses = useMemo(() => {
    if (!academicData || !selectedUniversity) return [];

    const university = academicData.universities.find(u => u._id === selectedUniversity);
    const courses = university?.courses || [];

    if (isAdmin) {
      return courses;
    }

    if (isCoordinator && user?.courses) {
      const courseId = getCoordinatorCourseId(user);
      const filteredCourses = courses.filter(c => c._id === courseId);

      return filteredCourses;
    }

    return [];
  }, [academicData, selectedUniversity, isAdmin, isCoordinator, user]);

  React.useEffect(() => {
    if (isCoordinator && user?.schoolId && user?.courses && filteredUniversities.length > 0) {
      const universityId = getFirstId(user.schoolId);
      const courseId = getCoordinatorCourseId(user);

      if (!selectedUniversity && universityId) {
        setSelectedUniversity(universityId);
      }
      if (!selectedCourse && courseId) {
        setSelectedCourse(courseId);
      }
    }
  }, [isCoordinator, user, filteredUniversities, selectedUniversity, selectedCourse]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedCourse) return;

    onSubmit({
      name: name.trim(),
      courseId: selectedCourse
    });

    setName("");
    if (isAdmin) {
      setSelectedUniversity("");
      setSelectedCourse("");
    }
  }, [name, selectedCourse, onSubmit, isAdmin]);

  if (loadingAcademicData) {
    return (
      <div className="space-y-4">
        <div className="text-white">Carregando dados acadêmicos...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1 text-sm font-medium text-white">Nome da Turma:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md bg-[#141414] text-white px-3 py-2 outline-none border border-white/10 focus:ring-2 focus:ring-white"
        />
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium text-white">Universidade:</label>
        <select
          value={selectedUniversity}
          onChange={(e) => {
            setSelectedUniversity(e.target.value);
            setSelectedCourse("");
          }}
          required
          className="w-full rounded-md bg-[#141414] text-white px-3 py-2 outline-none border border-white/10"
        >
          <option value="">Selecione a universidade</option>
          {filteredUniversities.map((uni) => (
            <option key={uni._id} value={uni._id}>{uni.name}</option>
          ))}
        </select>
      </div>

      {selectedUniversity && (
        <div>
          <label className="block mb-1 text-sm font-medium text-white">Curso:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
            className="w-full rounded-md bg-[#141414] text-white px-3 py-2 outline-none border border-white/10"
          >
            <option value="">Selecione o curso</option>
            {availableCourses.map(course => (
              <option key={course._id} value={course._id}>{course.name}</option>
            ))}
          </select>
        </div>
      )}

      <ButtonCRUD
        action={initialData ? "update" : "create"}
        onClick={handleSubmit}
      />
    </form>
  );
}

export { ClassForm };