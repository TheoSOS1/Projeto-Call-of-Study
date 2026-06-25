import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { deleteUser, signOut } from "firebase/auth";
import { db, auth } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  User,
  GraduationCap,
  Star,
  ChevronDown,
  ShieldAlert,
  Trash2,
  AlertTriangle,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  BookOpen,
  LogOut,
  Edit3,
} from "lucide-react";
import BottomNav from "../components/BottomNav";

// ─── Constantes de dados ──────────────────────────────────────────────────────
const AREAS_FOCO = [
  "Linguagens e Códigos",
  "Ciências Humanas",
  "Ciências da Natureza",
  "Matemática",
];

const DISCIPLINAS_POR_AREA = {
  "Linguagens e Códigos": [
    "Língua Portuguesa",
    "Literatura",
    "Língua Inglesa",
    "Língua Espanhola",
    "Artes",
    "Educação Física",
    "Tecnologias da Informação",
  ],
  "Ciências Humanas": ["História", "Geografia", "Filosofia", "Sociologia"],
  "Ciências da Natureza": ["Biologia", "Química", "Física"],
  Matemática: ["Matemática"],
};

// Cooldown de 30 dias para alterar área/disciplina
const COOLDOWN_DIAS = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function diasRestantes(timestamp) {
  if (!timestamp) return 0;
  const alterado = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = COOLDOWN_DIAS * 24 * 60 * 60 * 1000 - (Date.now() - alterado.getTime());
  return diff > 0 ? Math.ceil(diff / (24 * 60 * 60 * 1000)) : 0;
}

function formatarData(timestamp) {
  if (!timestamp) return "—";
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Perfil() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Edição
  const [editando, setEditando] = useState(false);
  const [novaArea, setNovaArea] = useState("");
  const [novaDisciplina, setNovaDisciplina] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [sucessoEdicao, setSucessoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState("");

  // Exclusão de conta
  const [modalExclusao, setModalExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "usuarios", user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPerfil(data);
        setNovaArea(data.areaFoco || "");
        setNovaDisciplina(data.disciplinaFacilidade || "");
      }
      setCarregando(false);
    });
  }, [user]);

  // Quantos dias faltam para o cooldown liberar
  const diasParaLiberar = useMemo(
    () => diasRestantes(perfil?.ultimaAlteracaoPerfil),
    [perfil]
  );
  const emCooldown = diasParaLiberar > 0;

  // Disciplinas disponíveis conforme a área selecionada no formulário de edição
  const disciplinasDisponiveis = DISCIPLINAS_POR_AREA[novaArea] || [];

  // ─── Salvar alterações de perfil ──────────────────────────────────────────
  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    if (!novaArea || !novaDisciplina) return;
    setErroEdicao("");
    setSalvando(true);

    try {
      await updateDoc(doc(db, "usuarios", user.uid), {
        areaFoco: novaArea,
        disciplinaFacilidade: novaDisciplina,
        ultimaAlteracaoPerfil: serverTimestamp(),
      });

      setPerfil((prev) => ({
        ...prev,
        areaFoco: novaArea,
        disciplinaFacilidade: novaDisciplina,
        ultimaAlteracaoPerfil: { toDate: () => new Date() },
      }));

      setSucessoEdicao(true);
      setEditando(false);
      setTimeout(() => setSucessoEdicao(false), 3000);
    } catch (err) {
      console.error(err);
      setErroEdicao("Erro ao salvar alterações. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  // ─── Excluir conta ───────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!user) return;
    setErroExclusao("");
    setExcluindo(true);

    try {
      // Passo A — Limpar registros_estudo
      const q = query(
        collection(db, "registros_estudo"),
        where("userId", "==", user.uid)
      );
      const snap = await getDocs(q);
      const LIMIT = 500;
      const docs = snap.docs;
      for (let i = 0; i < docs.length; i += LIMIT) {
        const batch = writeBatch(db);
        docs.slice(i, i + LIMIT).forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }

      // Passo B — Limpar perfil
      await deleteDoc(doc(db, "usuarios", user.uid));

      // Passo C — Excluir Auth
      await deleteUser(auth.currentUser);

      navigate("/cadastro", { replace: true });
    } catch (err) {
      console.error(err);
      if (err.code === "auth/requires-recent-login") {
        setErroExclusao(
          "Por motivos de segurança, você precisa fazer login novamente para excluir sua conta."
        );
        setTimeout(async () => {
          setModalExclusao(false);
          await signOut(auth);
          navigate("/login", { replace: true });
        }, 3000);
      } else {
        setErroExclusao("Erro ao excluir conta. Tente novamente.");
      }
    } finally {
      setExcluindo(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-28">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 max-w-lg mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Perfil</h1>
          <p className="text-gray-400 text-sm mt-0.5">Suas informações e configurações</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors text-sm font-medium px-3 py-1.5 rounded-xl hover:bg-red-900/20"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </header>

      <main className="px-4 max-w-lg mx-auto flex flex-col gap-4">

        {/* ── Card de identidade ──────────────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-900/40">
            <span className="text-white text-2xl font-black">
              {perfil?.nome?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-lg truncate">{perfil?.nome || "—"}</p>
            <p className="text-gray-500 text-sm truncate">{user?.email}</p>
            <p className="text-violet-400 text-xs font-semibold mt-1">
              {perfil?.pontuacaoTotal ?? 0} pts totais
            </p>
          </div>
        </div>

        {/* ── Card de área/disciplina + edição ────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-base flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-violet-400" />
              Foco de Estudo
            </h2>
            {!editando && (
              <button
                onClick={() => {
                  if (emCooldown) return;
                  setErroEdicao("");
                  setEditando(true);
                }}
                disabled={emCooldown}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  emCooldown
                    ? "text-gray-600 bg-gray-800/50 cursor-not-allowed"
                    : "text-violet-400 bg-violet-900/30 hover:bg-violet-900/50"
                }`}
                title={emCooldown ? `Disponível em ${diasParaLiberar} dia(s)` : "Editar"}
              >
                {emCooldown ? (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    {diasParaLiberar}d
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar
                  </>
                )}
              </button>
            )}
          </div>

          {/* Visualização atual */}
          {!editando && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-2.5 border-b border-gray-800">
                <span className="text-gray-500 text-sm">Área de Foco</span>
                <span className="text-white text-sm font-semibold">
                  {perfil?.areaFoco || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-gray-500 text-sm">Disciplina de Facilidade</span>
                <span className="text-amber-400 text-sm font-semibold">
                  {perfil?.disciplinaFacilidade || "—"}
                </span>
              </div>

              {/* Cooldown info */}
              {emCooldown && (
                <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl px-3 py-2.5 flex items-start gap-2.5 mt-1">
                  <Clock className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-xs font-semibold">
                      Alteração bloqueada por {diasParaLiberar} dia{diasParaLiberar !== 1 ? "s" : ""}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      Última alteração: {formatarData(perfil?.ultimaAlteracaoPerfil)}
                      {" · "}Cooldown de {COOLDOWN_DIAS} dias
                    </p>
                  </div>
                </div>
              )}

              {/* Sucesso após salvar */}
              {sucessoEdicao && (
                <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl px-3 py-2.5 flex items-center gap-2 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-emerald-400 text-xs font-semibold">
                    Perfil atualizado com sucesso!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Formulário de edição */}
          {editando && (
            <form onSubmit={handleSalvarPerfil} className="flex flex-col gap-3">
              {/* Área de foco */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                  Nova Área de Foco
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <select
                    required
                    value={novaArea}
                    onChange={(e) => {
                      setNovaArea(e.target.value);
                      setNovaDisciplina(""); // reseta disciplina ao mudar área
                    }}
                    className="w-full bg-gray-800 text-white rounded-xl pl-10 pr-9 py-3 text-sm border border-gray-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Selecione sua área</option>
                    {AREAS_FOCO.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Disciplina de facilidade */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                  Disciplina de Facilidade
                </label>
                <div className="relative">
                  <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <select
                    required
                    value={novaDisciplina}
                    onChange={(e) => setNovaDisciplina(e.target.value)}
                    disabled={!novaArea}
                    className="w-full bg-gray-800 text-white rounded-xl pl-10 pr-9 py-3 text-sm border border-gray-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>
                      {novaArea ? "Selecione a disciplina" : "Escolha a área primeiro"}
                    </option>
                    {disciplinasDisponiveis.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* Aviso de cooldown */}
              <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-amber-400/80 text-xs leading-relaxed">
                  Após salvar, você só poderá alterar novamente em{" "}
                  <strong>{COOLDOWN_DIAS} dias</strong>. Escolha com cuidado!
                </p>
              </div>

              {erroEdicao && (
                <div className="bg-red-950/50 border border-red-800/50 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <p className="text-red-300 text-xs">{erroEdicao}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditando(false);
                    setNovaArea(perfil?.areaFoco || "");
                    setNovaDisciplina(perfil?.disciplinaFacilidade || "");
                    setErroEdicao("");
                  }}
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando || !novaArea || !novaDisciplina}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Link para Regras ─────────────────────────────────────────────── */}
        <Link
          to="/criterios"
          className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3 hover:border-gray-700 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-900/40 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">Regras de Pontuação</p>
            <p className="text-gray-500 text-xs">Veja como os pontos são calculados</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-600 -rotate-90" />
        </Link>

        {/* ── Zona de Perigo ────────────────────────────────────────────────── */}
        <div className="border border-dashed border-red-900/60 rounded-2xl p-4 mt-2">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-red-500 text-xs font-bold uppercase tracking-wide">
              Zona de Perigo
            </p>
          </div>
          <p className="text-gray-500 text-xs mb-4 leading-relaxed">
            A exclusão da conta é permanente e remove todos os dados, histórico
            e pontuação. Esta ação não pode ser desfeita.
          </p>
          <button
            onClick={() => {
              setErroExclusao("");
              setModalExclusao(true);
            }}
            className="flex items-center gap-2 bg-red-950/60 hover:bg-red-900/60 border border-red-800/60 text-red-400 hover:text-red-300 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
            Excluir minha conta
          </button>
        </div>
      </main>

      {/* ── Modal de Exclusão de Conta ───────────────────────────────────────── */}
      {modalExclusao && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-excluir-titulo"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !excluindo && setModalExclusao(false)}
          />
          <div className="relative w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => !excluindo && setModalExclusao(false)}
              disabled={excluindo}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-400 transition-colors disabled:opacity-40"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-800/60 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>

            <h2 id="modal-excluir-titulo" className="text-white font-bold text-lg mb-1">
              Excluir conta permanentemente?
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              Esta ação é <strong className="text-red-400">irreversível</strong>.
              Todos os seus dados serão apagados:
            </p>

            <ul className="flex flex-col gap-2 mb-5">
              {[
                "Todo o histórico de sessões de estudo",
                "Sua pontuação total no Ranking",
                "Seu perfil e configurações",
                "Sua conta de acesso",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-xs text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            {erroExclusao && (
              <div className="flex items-start gap-2 bg-red-950/60 border border-red-800/60 text-red-300 rounded-xl px-3 py-2.5 text-xs mb-4">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{erroExclusao}</span>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleDeleteAccount}
                disabled={excluindo}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {excluindo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sim, excluir minha conta
                  </>
                )}
              </button>
              <button
                onClick={() => setModalExclusao(false)}
                disabled={excluindo}
                className="w-full text-gray-400 hover:text-white disabled:opacity-40 font-medium py-2.5 rounded-xl transition-colors text-sm border border-gray-800 hover:border-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
