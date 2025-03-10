import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { Input } from "@/components/components/Input/Input";
import { ButtonLogin } from "@/components/components/Button/ButtonLogin";
import { AnimatedLogo } from "../../components/components/AnimatedLogo/AnimatedLogo";
import { useNavigate, Link } from "react-router-dom";
import { SelectOptions } from "@/components/components/Select/SelectOptions";
import { Typograph } from "@/components/components/Typograph/Typograph";

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

  const navigate = useNavigate();

  useEffect(() => {
    api.get("/public/institutions")
      .then(res => setUniversities(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const uni = universities.find((u) => u._id === selectedUniversity);
    setCourses(uni ? uni.courses : []);
    setSelectedCourse("");
    setClasses([]);
  }, [selectedUniversity, universities]);

  useEffect(() => {
    const course = courses.find((c) => c._id === selectedCourse);
    setClasses(course ? course.classes : []);
    setSelectedClass("");
  }, [selectedCourse, courses]);

  const handleSignup = async (e: React.FormEvent) => {
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
      navigate("/signin");
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      setError("Erro ao realizar o cadastro.");
    } finally {
      setLoading(false);
    }
  };

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
          <Typograph text="Cadastro" colorText="text-white" variant="title4" weight="bold" fontFamily="montserrat" />
          <Typograph text="Realize seu cadastro no site" colorText="text-neutral-300" variant="text7" weight="medium" fontFamily="poppins" className="mb-4" />

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSignup}>
            <Input
              type="name"
              placeholder="Nome"
              className="bg-neutral-800 mb-4"
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

            <SelectOptions
              universities={universities}
              selectedUniversity={selectedUniversity}
              onChange={setSelectedUniversity}
              placeholder="Selecione a Universidade"
              className="mb-4"
            />

            <SelectOptions
              universities={courses}
              selectedUniversity={selectedCourse}
              onChange={setSelectedCourse}
              placeholder="Selecione o Curso"
              className="mb-4"
            />

            <SelectOptions
              universities={classes}
              selectedUniversity={selectedClass}
              onChange={setSelectedClass}
              placeholder="Selecione a Turma"
              className="mb-4"
            />

            <ButtonLogin type="submit" disabled={loading}>
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
