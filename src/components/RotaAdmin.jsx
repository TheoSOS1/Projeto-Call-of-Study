import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ADMIN_EMAIL = "theodesouzaoliveirasantos@gmail.com";

/**
 * Rota protegida exclusiva para o administrador.
 * Verifica se o usuário está logado E se o email é o do admin.
 * Qualquer outro usuário é redirecionado para /dashboard.
 */
export default function RotaAdmin({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.email !== ADMIN_EMAIL) return <Navigate to="/dashboard" replace />;

  return children;
}
