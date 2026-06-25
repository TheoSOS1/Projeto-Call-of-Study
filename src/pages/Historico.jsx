import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import { BookOpen, Target, PenTool, Loader2, Inbox } from "lucide-react";
import BottomNav from "../components/BottomNav";

const TIPO_CONFIG = {
  teoria: {
    label: "Teoria",
    icon: BookOpen,
    gradient: "from-blue-600 to-cyan-500",
  },
  questoes: {
    label: "Questões",
    icon: Target,
    gradient: "from-amber-500 to-orange-500",
  },
  redacao: {
    label: "Redação",
    icon: PenTool,
    gradient: "from-purple-600 to-violet-500",
  },
};

function formatarDataLabel(timestamp) {
  if (!timestamp) return "—";
  const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  if (data.toDateString() === hoje.toDateString()) return "Hoje";
  if (data.toDateString() === ontem.toDateString()) return "Ontem";
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
}

function formatarHora(timestamp) {
  if (!timestamp) return "";
  const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function detalhe(reg) {
  if (reg.tipo === "teoria") return `${reg.minutos} min`;
  if (reg.tipo === "questoes") return `${reg.acertos}/${reg.feitas} acertos`;
  if (reg.tipo === "redacao") return `Nota ${reg.nota}`;
  return "";
}

export default function Historico() {
  const { user } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [indexUrl, setIndexUrl] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!user) return;

    async function buscar() {
      try {
        const q = query(
          collection(db, "registros_estudo"),
          where("userId", "==", user.uid),
          orderBy("data", "desc")
        );
        const snap = await getDocs(q);
        setRegistros(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        if (err.code === "failed-precondition") {
          // O Firestore precisa de um índice composto: userId + data desc
          const urlMatch = err.message?.match(
            /https:\/\/console\.firebase\.google\.com\S+/
          );
          setIndexUrl(urlMatch?.[0] || null);
          setErro("Índice do Firestore necessário para esta consulta.");
        } else {
          console.error(err);
          setErro("Erro ao carregar histórico.");
        }
      } finally {
        setCarregando(false);
      }
    }

    buscar();
  }, [user]);

  // Agrupar registros por label de data
  const agrupado = registros.reduce((acc, reg) => {
    const label = formatarDataLabel(reg.data);
    if (!acc[label]) acc[label] = [];
    acc[label].push(reg);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <header className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        <h1 className="text-xl font-bold">Histórico</h1>
        <p className="text-gray-400 text-sm mt-0.5">Suas sessões de estudo</p>
      </header>

      <main className="px-4 max-w-lg mx-auto">
        {carregando ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        ) : erro ? (
          <div className="bg-red-900/30 border border-red-700/60 rounded-2xl p-5 flex flex-col gap-3">
            <p className="text-red-300 text-sm">{erro}</p>
            {indexUrl && (
              <>
                <p className="text-gray-400 text-xs">
                  É necessário criar um índice composto no Firebase para esta query.
                  Clique no link abaixo para criá-lo automaticamente:
                </p>
                <a
                  href={indexUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet-400 text-xs underline break-all"
                >
                  Criar índice no Firebase Console →
                </a>
              </>
            )}
          </div>
        ) : registros.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Inbox className="w-12 h-12 text-gray-700" />
            <p className="text-gray-500 font-medium">Nenhuma sessão ainda</p>
            <p className="text-gray-600 text-sm">
              Use &quot;Lançar&quot; para registrar seu primeiro estudo!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(agrupado).map(([label, regs]) => (
              <div key={label}>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2.5 capitalize">
                  {label}
                </p>
                <div className="flex flex-col gap-2.5">
                  {regs.map((reg) => {
                    const config = TIPO_CONFIG[reg.tipo] || TIPO_CONFIG.teoria;
                    const Icon = config.icon;
                    return (
                      <div
                        key={reg.id}
                        className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3.5 flex items-center gap-3"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0`}
                        >
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">
                            {reg.disciplina}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {config.label} · {detalhe(reg)} · {formatarHora(reg.data)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-emerald-400 font-bold text-sm">
                            +{reg.pontos}
                          </p>
                          <p className="text-gray-600 text-xs">pts</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
