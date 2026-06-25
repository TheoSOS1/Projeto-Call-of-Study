import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import { calcularMultiplicador } from "../utils/calculadora";
import {
  BookOpen,
  Trophy,
  LogOut,
  GraduationCap,
  Loader2,
  Zap,
  PlusCircle,
  ArrowRight,
} from "lucide-react";
import BottomNav from "../components/BottomNav";

const AREA_COLORS = {
  "Linguagens e Códigos": "from-pink-600 to-rose-500",
  "Ciências Humanas": "from-amber-600 to-orange-500",
  "Ciências da Natureza": "from-emerald-600 to-teal-500",
  "Matemática": "from-blue-600 to-cyan-500",
};

const AREA_BADGE_COLORS = {
  "Linguagens e Códigos": "bg-pink-900/50 text-pink-300 border-pink-700",
  "Ciências Humanas": "bg-amber-900/50 text-amber-300 border-amber-700",
  "Ciências da Natureza": "bg-emerald-900/50 text-emerald-300 border-emerald-700",
  "Matemática": "bg-blue-900/50 text-blue-300 border-blue-700",
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function buscarDados() {
      try {
        const ref = doc(db, "usuarios", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setDadosUsuario(snap.data());
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      } finally {
        setCarregando(false);
      }
    }

    buscarDados();
  }, [user]);

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  const gradiente = AREA_COLORS[dadosUsuario?.areaFoco] || "from-violet-600 to-purple-500";
  const badgeColor = AREA_BADGE_COLORS[dadosUsuario?.areaFoco] || "bg-violet-900/50 text-violet-300 border-violet-700";

  const multiplicadorInfo = dadosUsuario?.disciplinaFacilidade
    ? calcularMultiplicador(
        dadosUsuario.disciplinaFacilidade,
        dadosUsuario.disciplinaFacilidade,
        dadosUsuario.minutosFacilidadeNestaSemana ?? 0
      )
    : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-6 pb-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-900/50">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            Call of Study
          </span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors text-sm font-medium px-3 py-1.5 rounded-xl hover:bg-red-900/20"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </header>

      {/* Conteúdo principal */}
      <main className="px-4 pb-4 max-w-lg mx-auto flex flex-col gap-5 mt-2">
        {/* Card de boas-vindas */}
        <div className={`rounded-2xl bg-gradient-to-br ${gradiente} p-5 shadow-lg`}>
          <p className="text-white/70 text-sm font-medium mb-1">Bem-vindo de volta 👋</p>
          <h2 className="text-2xl font-bold text-white">
            Olá, {dadosUsuario?.nome?.split(" ")[0] || "Estudante"}!
          </h2>
          <div className="flex items-center gap-2 mt-3">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${badgeColor}`}>
              {dadosUsuario?.areaFoco}
            </span>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-2 gap-3">
          {/* Pontuação total */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-900/40 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-gray-400 text-xs font-medium mt-1">Pontuação Total</p>
            <p className="text-2xl font-bold text-white">
              {dadosUsuario?.pontuacaoTotal ?? 0}
            </p>
          </div>

          {/* Minutos facilidade */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl bg-violet-900/40 flex items-center justify-center">
              <Zap className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-gray-400 text-xs font-medium mt-1">Min. Facilidade</p>
            <p className="text-2xl font-bold text-white">
              {dadosUsuario?.minutosFacilidadeNestaSemana ?? 0}
            </p>
            {multiplicadorInfo && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${
                  multiplicadorInfo.tier === "boost"
                    ? "bg-emerald-900/50 text-emerald-400"
                    : multiplicadorInfo.tier === "fadiga"
                    ? "bg-red-900/50 text-red-400"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                ×{multiplicadorInfo.multiplicador} {multiplicadorInfo.tier}
              </span>
            )}
          </div>
        </div>

        {/* Card de disciplina */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gray-800 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-gray-300" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium">
              Disciplina de Maior Facilidade
            </p>
            <p className="text-white font-semibold text-base mt-0.5">
              {dadosUsuario?.disciplinaFacilidade || "—"}
            </p>
          </div>
        </div>

        {/* CTA — Lançar nova sessão */}
        <Link
          to="/lancamento"
          className="flex items-center gap-3 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl p-5 shadow-lg shadow-violet-900/30 active:scale-[0.98] transition-transform duration-150"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <PlusCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold">Lançar nova sessão</p>
            <p className="text-white/70 text-sm">Registre sua atividade de estudo</p>
          </div>
          <ArrowRight className="w-5 h-5 text-white/60" />
        </Link>
      </main>

      <BottomNav />
    </div>
  );
}
