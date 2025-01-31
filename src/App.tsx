import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import CadastroPage from "@/pages/Cadastro/Cadastro";
import Login from "@/pages/Login/login";
import ColetaDeDados from "@/pages/coletaDeDados/coleta";
import ListagemPage from "@/pages/Listagem/Listagem"; 

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<Navigate to="/login" />} />

       
        <Route path="/login" element={<Login />} />

        
        <Route path="/cadastro" element={<CadastroPage />} />

        
        <Route path="/coleta" element={<ColetaDeDados />} />

        
        <Route path="/listagem" element={<ListagemPage />} /> {/* Nova rota */}
      </Routes>
    </Router>
  );
}

export default App;
