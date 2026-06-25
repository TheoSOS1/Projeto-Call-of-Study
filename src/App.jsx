import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import RotaProtegida from "./components/RotaProtegida";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";
import CompletarCadastro from "./pages/CompletarCadastro";

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

          {/* Fallback: qualquer rota inexistente vai para login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
