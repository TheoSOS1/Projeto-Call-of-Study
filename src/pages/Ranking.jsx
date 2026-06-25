import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Crown, Loader2, RefreshCw } from "lucide-react";
import BottomNav from "../components/BottomNav";

const MEDAL = [
  {
    avatarSize: "w-16 h-16",
    avatarBg:
      "bg-gradient-to-br from-amber-500/30 to-amber-600/20 border-2 border-amber-500/60",
    avatarText: "text-amber-400 text-3xl",
    ptsColor: "text-amber-400",
    barBg: "bg-amber-600/25",
    barH: "h-16",
    barLabel: "text-amber-400 text-base font-black",
    pos: "1º",
  },
  {
    avatarSize: "w-13 h-13",
    avatarBg:
      "bg-gradient-to-br from-slate-400/20 to-slate-500/10 border border-slate-500/50",
    avatarText: "text-slate-300 text-2xl",
    ptsColor: "text-slate-300",
    barBg: "bg-slate-600/25",
    barH: "h-10",
    barLabel: "text-slate-300 text-sm font-bold",
    pos: "2º",
  },
  {
    avatarSize: "w-11 h-11",
    avatarBg:
      "bg-gradient-to-br from-amber-800/25 to-amber-900/15 border border-amber-800/50",
    avatarText: "text-amber-700 text-xl",
    ptsColor: "text-amber-700",
    barBg: "bg-amber-900/25",
    barH: "h-7",
    barLabel: "text-amber-700 text-sm font-bold",
    pos: "3º",
  },
];

export default function Ranking() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const buscar = async () => {
    setCarregando(true);
    try {
      const q = query(
        collection(db, "usuarios"),
        orderBy("pontuacaoTotal", "desc"),
        limit(100)
      );
      const snap = await getDocs(q);
      setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscar();
  }, []);

  const top3 = usuarios.slice(0, 3);

  // Pódio: 2º | 1º | 3º (visual de altura)
  const podiumSlots = [
    { user: top3[1], style: MEDAL[1] },
    { user: top3[0], style: MEDAL[0], isFirst: true },
    { user: top3[2], style: MEDAL[2] },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <header className="px-4 pt-6 pb-4 max-w-lg mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Ranking</h1>
          <p className="text-gray-400 text-sm mt-0.5">Os melhores estudantes</p>
        </div>
        <button
          onClick={buscar}
          disabled={carregando}
          className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${carregando ? "animate-spin" : ""}`} />
        </button>
      </header>

      <main className="px-4 max-w-lg mx-auto">
        {carregando && usuarios.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Pódio visual */}
            {top3.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 pt-6">
                <div className="flex items-end justify-center gap-2">
                  {podiumSlots.map(({ user: u, style, isFirst }, i) => {
                    if (!u) return <div key={i} className="flex-1" />;
                    return (
                      <div
                        key={u.id}
                        className="flex flex-col items-center gap-2 flex-1"
                      >
                        {isFirst && (
                          <Crown className="w-5 h-5 text-amber-400 mb-0.5" />
                        )}
                        <div
                          className={`${style.avatarSize} rounded-2xl ${style.avatarBg} flex items-center justify-center ${isFirst ? "shadow-lg shadow-amber-900/20" : ""}`}
                        >
                          <span className={`font-black ${style.avatarText}`}>
                            {u.nome?.[0]?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <p
                          className={`text-white text-xs font-bold truncate max-w-20 text-center ${isFirst ? "text-sm" : ""}`}
                        >
                          {u.nome?.split(" ")[0] || "—"}
                        </p>
                        <p className={`text-xs font-bold ${style.ptsColor}`}>
                          {(u.pontuacaoTotal ?? 0).toLocaleString("pt-BR")} pts
                        </p>
                        <div
                          className={`w-full ${style.barBg} ${style.barH} rounded-t-xl flex items-center justify-center`}
                        >
                          <span className={style.barLabel}>{style.pos}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lista completa */}
            <div className="flex flex-col gap-2">
              {usuarios.map((u, idx) => {
                const isMe = u.id === user?.uid;
                const pos = idx + 1;
                const posColor =
                  pos === 1
                    ? "text-amber-400"
                    : pos === 2
                    ? "text-slate-300"
                    : pos === 3
                    ? "text-amber-700"
                    : "text-gray-600";

                return (
                  <div
                    key={u.id}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all ${
                      isMe
                        ? "bg-violet-900/20 border-violet-700/50"
                        : "bg-gray-900 border-gray-800"
                    }`}
                  >
                    <span
                      className={`text-sm font-black w-7 text-center shrink-0 ${posColor}`}
                    >
                      {pos}º
                    </span>
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                        isMe ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-300"
                      }`}
                    >
                      {u.nome?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isMe ? "text-violet-200" : "text-white"
                          }`}
                        >
                          {u.nome || "Usuário"}
                        </p>
                        {isMe && (
                          <span className="text-violet-400 text-[10px] font-semibold px-1.5 py-0.5 bg-violet-900/50 rounded-full shrink-0">
                            você
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs truncate">
                        {u.disciplinaFacilidade || "—"}
                      </p>
                    </div>
                    <span
                      className={`font-bold text-sm shrink-0 ${
                        isMe ? "text-violet-300" : "text-white"
                      }`}
                    >
                      {(u.pontuacaoTotal ?? 0).toLocaleString("pt-BR")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
