import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-Auth";
import { api } from "@/services/api/api";
import { Input } from "@/components/components/Input/Input";
import { ButtonLogin } from "@/components/components/Button/ButtonLogin";
import { AnimatedLogo } from "@/components/components/AnimatedLogo/AnimatedLogo";

interface Class {
  _id: string;
  name: string;
}

interface Course {
  _id: string;
  name: string;
  classes: Class[];
}

interface University {
  _id: string;
  name: string;
  courses: Course[];
}

function Signup() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();

  useEffect(() => {
    api
      .get("/public/institutions")
      .then((res) => setUniversities(res.data))
      .catch((err) => {
        console.error("Erro ao carregar universidades:", err);
        setError("Erro ao carregar universidades.");
      });
  }, []);

  useEffect(() => {
    if (selectedUniversity) {
      const selectedUni = universities.find((u) => u._id === selectedUniversity);
      setCourses(selectedUni ? selectedUni.courses : []);
    } else {
      setCourses([]);
    }
    setSelectedCourse("");
    setClasses([]);
  }, [selectedUniversity, universities]);

  useEffect(() => {
    if (selectedCourse) {
      const selectedCrs = courses.find((c) => c._id === selectedCourse);
      setClasses(selectedCrs ? selectedCrs.classes : []);
    } else {
      setClasses([]);
    }
    setSelectedClass("");
  }, [selectedCourse, courses]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      name,
      email,
      password,
      school: selectedUniversity,
      course: selectedCourse,
      class: selectedClass,
    };

    try {
      await api.post("/users", payload);
      await login(email, password); // login automático após cadastro
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      setError("Erro ao realizar o cadastro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-b from-blue-700 to-blue-900" style={{ flex: 2 }}>
        <AnimatedLogo />
        <h1 className="text-slate-100 text-5xl lg:text-6xl font-bold mt-12 ml-8">SAEL</h1>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#141414]">
        <div className="w-full max-w-sm p-6 bg-[#1F1F1F] rounded-lg shadow-lg">
          <h2 className="text-white text-4xl font-bold text-start">Cadastro</h2>
          <p className="text-neutral-300 text-start mb-2">Realize seu cadastro no site</p>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <form onSubmit={handleRegister}>
            <Input
              type="text"
              placeholder="Nome"
              className="bg-neutral-800 mb-4 py-8"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Email"
              className="bg-neutral-800 mb-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Senha"
              className="bg-neutral-800 mb-4"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <select
              className="w-[340px] h-[50px] bg-neutral-800 text-slate-300 text-sm font-Montserrat p-2 mb-4 rounded-md"
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              required
            >
              <option value="">Selecione a universidade</option>
              {universities.map((univ) => (
                <option key={univ._id} value={univ._id}>
                  {univ.name}
                </option>
              ))}
            </select>

            <select
              className="w-[340px] h-[50px] bg-neutral-800 text-slate-300 text-sm font-Montserrat p-2 mb-4 rounded-md"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              disabled={!selectedUniversity}
              required
            >
              <option value="">Selecione o curso</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.name}
                </option>
              ))}
            </select>

            <select
              className="w-[340px] h-[50px] bg-neutral-800 text-slate-300 text-sm font-Montserrat p-2 mb-4 rounded-md"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={!selectedCourse}
              required
            >
              <option value="">Selecione a turma</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>

            <ButtonLogin
              type="submit"
              disabled={loading}
              className="bg-blue-700 hover:bg-blue-800 text-slate-100 hover:text-slate-300"
            >
              {loading ? "Cadastrando..." : "Cadastrar"}
            </ButtonLogin>
          </form>

          <p className="text-gray-400 text-sm text-center mt-4">
            Já possui conta?{" "}
            <Link to="/signin" className="text-blue-500 no-underline">
              Faça Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export { Signup };
