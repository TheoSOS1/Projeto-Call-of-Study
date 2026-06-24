import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  BookOpen,
  Star,
  Trophy,
  LogOut,
  GraduationCap,
  Loader2,
} from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
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
      <main className="px-4 pb-10 max-w-lg mx-auto flex flex-col gap-5 mt-2">
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

          {/* Minutos esta semana */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl bg-violet-900/40 flex items-center justify-center">
              <Star className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-gray-400 text-xs font-medium mt-1">Min. Facilidade / Semana</p>
            <p className="text-2xl font-bold text-white">
              {dadosUsuario?.minutosFacilidadeNestaSemana ?? 0}
            </p>
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

        {/* Placeholder para próximas features */}
        <div className="bg-gray-900/50 border border-dashed border-gray-800 rounded-2xl p-6 flex flex-col items-center gap-2 text-center">
          <BookOpen className="w-8 h-8 text-gray-700" />
          <p className="text-gray-600 text-sm">
            Suas sessões de estudo aparecerão aqui em breve.
          </p>
        </div>
      </main>
    </div>
  );
}
