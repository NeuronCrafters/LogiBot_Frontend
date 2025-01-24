import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import CadastroPage from "@/pages/Cadastro/Cadastro";
import Login from "@/pages/Login/login";

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />

        <Route path="/cadastro" element={<CadastroPage />} />
      </Routes>
    </Router>
  );
}

export default App;
