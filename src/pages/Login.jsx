import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { Mail, Lock, BookOpen, AlertCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      navigate("/dashboard");
    } catch (error) {
      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setErro("E-mail ou senha inválidos.");
          break;
        case "auth/too-many-requests":
          setErro("Muitas tentativas. Tente novamente mais tarde.");
          break;
        default:
          setErro("Erro ao fazer login. Tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      {/* Logo / Marca */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
          <BookOpen className="text-white w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Call of Study
        </h1>
        <p className="text-gray-400 text-sm">Entre na sua conta para continuar</p>
      </div>

      {/* Card do formulário */}
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800">
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {/* Campo E-mail */}
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-300 text-sm font-medium">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div className="flex flex-col gap-1.5">
            <label className="text-gray-300 text-sm font-medium">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
              />
            </div>
          </div>

          {/* Mensagem de erro */}
          {erro && (
            <div className="flex items-center gap-2 bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* Botão de login */}
          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {carregando ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        {/* Link para cadastro */}
        <p className="text-center text-gray-500 text-sm mt-5">
          Não tem conta?{" "}
          <Link
            to="/cadastro"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
