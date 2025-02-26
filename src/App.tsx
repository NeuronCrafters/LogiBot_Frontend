import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import CadastroPage from "@/pages/Cadastro/Cadastro";
import Login from "@/pages/Login/login";
import ColetaDeDados from "@/pages/coletaDeDados/coleta";
import ListagemPage from "@/pages/Listagem/Listagem"; 
import Chat from "@/pages/Chat/Chat";
import Chart from "@/pages/Chart/Chart";

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<Navigate to="/login" />} />  {/* Redirecionamento para login */}
        
        <Route path="/login" element={<Login />} />  {/* Rota de login */}
        
        <Route path="/cadastro" element={<CadastroPage />} />  {/* Rota de cadastro */}
        
        <Route path="/coleta" element={<ColetaDeDados />} />  {/* Rota de coleta de dados */}
        
        <Route path="/listagem" element={<ListagemPage />} />  {/* Nova rota para a listagem */}
        
        <Route path="/Chat" element={<Chat />} />  {/* Rota para a tela de boas-vindas */}

        <Route path="/Chart" element={<Chart />} />
      </Routes>
    </Router>
  );
}

export default App;
