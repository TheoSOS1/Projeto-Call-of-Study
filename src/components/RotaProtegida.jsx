import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Renderiza a rota somente se o usuário estiver logado.
// Enquanto o Firebase verifica o estado, exibe um loader.
export default function RotaProtegida({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
