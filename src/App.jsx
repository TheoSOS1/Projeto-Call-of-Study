import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import RotaProtegida from "./components/RotaProtegida";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";
import CompletarCadastro from "./pages/CompletarCadastro";
import Lancamento from "./pages/Lancamento";
import Historico from "./pages/Historico";
import Ranking from "./pages/Ranking";
import Criterios from "./pages/Criterios";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota raiz redireciona para login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          {/* Rota protegida - Dashboard */}
          <Route
            path="/dashboard"
            element={
              <RotaProtegida>
                <Dashboard />
              </RotaProtegida>
            }
          />

          {/* Rota protegida - Completar cadastro (novos usuários Google) */}
          <Route
            path="/completar-cadastro"
            element={
              <RotaProtegida>
                <CompletarCadastro />
              </RotaProtegida>
            }
          />

          {/* Rotas protegidas — Core Loop */}
          <Route
            path="/lancamento"
            element={<RotaProtegida><Lancamento /></RotaProtegida>}
          />
          <Route
            path="/historico"
            element={<RotaProtegida><Historico /></RotaProtegida>}
          />
          <Route
            path="/ranking"
            element={<RotaProtegida><Ranking /></RotaProtegida>}
          />
          <Route
            path="/criterios"
            element={<RotaProtegida><Criterios /></RotaProtegida>}
          />

          {/* Fallback: qualquer rota inexistente vai para login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
