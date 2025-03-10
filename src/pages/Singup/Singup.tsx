import React, { useState, useEffect } from "react";
import { Input } from "@/components/components/Input/Input";
import { ButtonLogin } from "@/components/components/Button/ButtonLogin";
import { AnimatedLogo } from "../../components/components/AnimatedLogo/AnimatedLogo";
import axios from "axios";

function Signup() {
  const [schools, setSchools] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);

  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  useEffect(() => {
    axios.get("http://localhost:3000/schools").then((response) => {
      setSchools(response.data);
    });
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      const school = schools.find((s) => s._id === selectedSchool);
      setCourses(school ? school.courses : []);
      setSelectedCourse("");
      setClasses([]);
    }
  }, [selectedSchool, schools]);

  useEffect(() => {
    if (selectedCourse) {
      const course = courses.find((c) => c._id === selectedCourse);
      setClasses(course ? course.classes : []);
      setSelectedClass("");
    }
  }, [selectedCourse, courses]);

  return (
    <div className="flex min-h-screen">
      <div
        className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-b from-blue-700 to-blue-900"
        style={{ flex: 2 }}
      >
        <div className="flex items-end gap-4">
          <AnimatedLogo />
          <h1 className="text-white text-7xl font-bold mb-12">SAEL</h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#141414]">
        <div className="w-full max-w-sm p-8">
          <h2 className="font-Montserrat text-white text-4xl font-bold">
            Cadastro
          </h2>
          <p className="text-neutral-300 mb-2">Realize seu cadastro no site</p>

          <Input type="text" placeholder="Nome" className="bg-neutral-800 mb-4" />
          <Input type="email" placeholder="Email" className="bg-neutral-800 mb-4" />
          <Input type="password" placeholder="Senha" className="bg-neutral-800 mb-4" />
          <Input type="password" placeholder="Confirmar senha" className="bg-neutral-800 mb-4" />

          <select
            className="w-full bg-neutral-800 text-white p-2 mb-4 rounded"
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
          >
            <option value="">Selecione a escola</option>
            {schools.map((school) => (
              <option key={school._id} value={school._id}>
                {school.name}
              </option>
            ))}
          </select>

          <select
            className="w-full bg-neutral-800 text-white p-2 mb-4 rounded"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            disabled={!selectedSchool}
          >
            <option value="">Selecione o curso</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.name}
              </option>
            ))}
          </select>

          <select
            className="w-full bg-neutral-800 text-white p-2 mb-4 rounded"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={!selectedCourse}
          >
            <option value="">Selecione a turma</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>

          <ButtonLogin type="cadastrar" />

          <p className="text-gray-400 text-sm text-center mt-4">
            Já possui conta?{" "}
            <a href="/signin" className="text-blue-500 hover:underline">
              Faça o login.
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export { Signup };
