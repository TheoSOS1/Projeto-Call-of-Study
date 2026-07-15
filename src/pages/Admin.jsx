import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  limit,
  writeBatch,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  FileText,
  Megaphone,
  Settings,
  LogOut,
  RefreshCw,
  Trash2,
  Edit3,
  Check,
  X,
  BookOpen,
  AlertTriangle,
  Send,
  ChevronRight,
  Loader2,
  ShieldCheck,
  BarChart3,
  Zap,
  Trophy,
  Clock,
  Search,
  Save,
  RotateCcw,
  Bell,
} from "lucide-react";

const ADMIN_EMAIL = "theodesouzaoliveirasantos@gmail.com";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(ts) {
  if (!ts) return "—";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtNum(n) {
  return (n ?? 0).toLocaleString("pt-BR");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color = "violet" }) {
  const colors = {
    violet: "bg-violet-900/30 text-violet-400 border-violet-700/40",
    amber: "bg-amber-900/30 text-amber-400 border-amber-700/40",
    emerald: "bg-emerald-900/30 text-emerald-400 border-emerald-700/40",
    blue: "bg-blue-900/30 text-blue-400 border-blue-700/40",
  };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-gray-500 text-xs font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-900/40 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-white font-bold">Confirmar ação</h3>
        </div>
        <p className="text-gray-300 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 font-medium text-sm hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium text-sm hover:bg-red-500 transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Aba: Visão Geral ─────────────────────────────────────────────────────────

function TabVisaoGeral({ usuarios, lancamentos }) {
  const totalPts = usuarios.reduce((s, u) => s + (u.pontuacaoTotal || 0), 0);
  const top = [...usuarios].sort((a, b) => (b.pontuacaoTotal || 0) - (a.pontuacaoTotal || 0))[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Usuários cadastrados" value={fmtNum(usuarios.length)} color="violet" />
        <StatCard icon={FileText} label="Sessões lançadas" value={fmtNum(lancamentos.length)} color="blue" />
        <StatCard icon={Trophy} label="Pontuação acumulada" value={fmtNum(totalPts)} color="amber" />
        <StatCard icon={Zap} label="Média por usuário" value={usuarios.length ? fmtNum(Math.round(totalPts / usuarios.length)) : "—"} color="emerald" />
      </div>

      {top && (
        <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/10 border border-amber-700/30 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-600/40 flex items-center justify-center text-amber-400 text-xl font-black shrink-0">
            {top.nome?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-amber-400 text-xs font-semibold mb-0.5">🏆 Líder do Ranking</p>
            <p className="text-white font-bold truncate">{top.nome || "—"}</p>
            <p className="text-gray-400 text-xs">{top.areaFoco || "—"}</p>
          </div>
          <span className="text-amber-400 font-black text-lg shrink-0">{fmtNum(top.pontuacaoTotal)} pts</span>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-violet-400" />
          Distribuição por Área de Foco
        </h3>
        {(() => {
          const areas = {};
          usuarios.forEach((u) => {
            const a = u.areaFoco || "Sem área";
            areas[a] = (areas[a] || 0) + 1;
          });
          const total = usuarios.length || 1;
          const colors = {
            "Linguagens e Códigos": "bg-pink-500",
            "Ciências Humanas": "bg-amber-500",
            "Ciências da Natureza": "bg-emerald-500",
            Matemática: "bg-blue-500",
          };
          return Object.entries(areas)
            .sort((a, b) => b[1] - a[1])
            .map(([area, count]) => (
              <div key={area} className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{area}</span>
                  <span className="text-gray-300 font-medium">{count}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colors[area] || "bg-violet-500"} transition-all duration-500`}
                    style={{ width: `${(count / total) * 100}%` }}
                  />
                </div>
              </div>
            ));
        })()}
      </div>
    </div>
  );
}

// ─── Aba: Usuários ────────────────────────────────────────────────────────────

function TabUsuarios({ usuarios, onDelete, onEditPts, loading }) {
  const [busca, setBusca] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [novaPts, setNovaPts] = useState("");
  const [confirm, setConfirm] = useState(null);

  const filtrados = usuarios.filter(
    (u) =>
      u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      u.email?.toLowerCase().includes(busca.toLowerCase())
  );

  const salvarPts = async (uid) => {
    const pts = parseInt(novaPts, 10);
    if (isNaN(pts) || pts < 0) return;
    await onEditPts(uid, pts);
    setEditandoId(null);
    setNovaPts("");
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-600 transition-colors"
        />
      </div>

      <p className="text-gray-600 text-xs">{filtrados.length} usuário(s)</p>

      {filtrados.map((u) => (
        <div key={u.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-900/40 flex items-center justify-center text-violet-300 font-bold text-sm shrink-0">
              {u.nome?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{u.nome || "—"}</p>
              <p className="text-gray-500 text-xs truncate">{u.email || "—"}</p>
              <p className="text-gray-600 text-xs mt-0.5">{u.areaFoco || "—"}</p>
            </div>
          </div>

          {/* Pontuação + edição */}
          <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2">
            {editandoId === u.id ? (
              <>
                <input
                  type="number"
                  value={novaPts}
                  onChange={(e) => setNovaPts(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-violet-500"
                  placeholder="Nova pontuação"
                  autoFocus
                />
                <button
                  onClick={() => salvarPts(u.id)}
                  className="p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 transition-colors"
                >
                  <Check className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => { setEditandoId(null); setNovaPts(""); }}
                  className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-gray-500 text-xs">Pontuação: </span>
                  <span className="text-amber-400 font-bold text-sm">{fmtNum(u.pontuacaoTotal)}</span>
                </div>
                <button
                  onClick={() => { setEditandoId(u.id); setNovaPts(String(u.pontuacaoTotal || 0)); }}
                  className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
                  title="Editar pontuação"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setConfirm({
                      msg: `Excluir o usuário "${u.nome}"? Essa ação é irreversível.`,
                      action: () => { onDelete(u.id); setConfirm(null); },
                    })
                  }
                  className="p-1.5 rounded-lg bg-red-900/30 hover:bg-red-800/50 transition-colors text-red-400"
                  title="Excluir usuário"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      ))}

      {confirm && (
        <ConfirmDialog
          message={confirm.msg}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─── Aba: Lançamentos ─────────────────────────────────────────────────────────

function TabLancamentos({ lancamentos, usuarios, onDelete }) {
  const [buscaUser, setBuscaUser] = useState("");
  const [confirm, setConfirm] = useState(null);

  // registros_estudo usa userId, não subcoleção
  const userMap = Object.fromEntries(usuarios.map((u) => [u.id, u.nome]));

  const filtrados = buscaUser
    ? lancamentos.filter((l) =>
        userMap[l.userId]?.toLowerCase().includes(buscaUser.toLowerCase())
      )
    : lancamentos;

  const TIPO_COLOR = {
    teoria: "bg-blue-900/40 text-blue-400",
    questoes: "bg-amber-900/40 text-amber-400",
    redacao: "bg-purple-900/40 text-purple-400",
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Filtrar por nome do usuário..."
          value={buscaUser}
          onChange={(e) => setBuscaUser(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-600 transition-colors"
        />
      </div>

      <p className="text-gray-600 text-xs">{filtrados.length} lançamento(s)</p>

      {filtrados.map((l) => (
        <div key={l._docPath} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className={`px-2 py-1 rounded-lg text-xs font-bold shrink-0 ${TIPO_COLOR[l.tipo] || "bg-gray-800 text-gray-400"}`}>
              {l.tipo || "—"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{userMap[l.userId] || l.userId || l.uid || "—"}</p>
              <p className="text-gray-500 text-xs truncate">{l.disciplina || l.tema || "—"}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-amber-400 font-bold text-sm">+{fmtNum(l.pontos)} pts</p>
              <p className="text-gray-600 text-xs">{fmtDate(l.data || l.criadoEm)}</p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-800 flex justify-between items-center">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {l.tipo === "teoria" && l.minutos && (
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{l.minutos} min</span>
              )}
              {l.tipo === "questoes" && l.acertos != null && (
                <span>{l.acertos}/{l.feitas ?? l.total} acertos</span>
              )}
              {l.tipo === "redacao" && l.nota != null && (
                <span>Nota: {l.nota} | {l.tempo ? `${l.tempo} min` : ""}</span>
              )}
            </div>
            <button
              onClick={() =>
                setConfirm({
                  msg: "Excluir este lançamento? A pontuação do usuário NÃO será revertida automaticamente.",
                  action: () => { onDelete(l); setConfirm(null); },
                })
              }
              className="p-1.5 rounded-lg bg-red-900/30 hover:bg-red-800/50 transition-colors text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}

      {confirm && (
        <ConfirmDialog
          message={confirm.msg}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─── Aba: Avisos ──────────────────────────────────────────────────────────────

function TabAvisos() {
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [avisoAtual, setAvisoAtual] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmLimpar, setConfirmLimpar] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "config", "aviso")).then((snap) => {
      if (snap.exists()) setAvisoAtual(snap.data());
    });
  }, []);

  const publicar = async () => {
    if (!titulo.trim() || !texto.trim()) return;
    setSalvando(true);
    try {
      const dados = { titulo: titulo.trim(), texto: texto.trim(), criadoEm: serverTimestamp() };
      await setDoc(doc(db, "config", "aviso"), dados);
      setAvisoAtual({ ...dados, criadoEm: new Date() });
      setTitulo("");
      setTexto("");
    } finally {
      setSalvando(false);
    }
  };

  const limpar = async () => {
    await deleteDoc(doc(db, "config", "aviso"));
    setAvisoAtual(null);
    setConfirmLimpar(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Aviso atual */}
      {avisoAtual && (
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-bold text-sm">Aviso ativo</span>
            </div>
            <button
              onClick={() => setConfirmLimpar(true)}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded-lg hover:bg-red-900/20"
            >
              <X className="w-3.5 h-3.5" /> Remover
            </button>
          </div>
          <p className="text-white font-semibold text-sm">{avisoAtual.titulo}</p>
          <p className="text-gray-400 text-xs mt-1 leading-relaxed">{avisoAtual.texto}</p>
          <p className="text-gray-600 text-xs mt-2">{fmtDate(avisoAtual.criadoEm)}</p>
        </div>
      )}

      {/* Novo aviso */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-violet-400" />
          {avisoAtual ? "Substituir aviso" : "Publicar novo aviso"}
        </h3>
        <input
          type="text"
          placeholder="Título do aviso..."
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={80}
          className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-600 transition-colors"
        />
        <textarea
          placeholder="Mensagem para todos os usuários..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          maxLength={500}
          className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-600 transition-colors resize-none"
        />
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-xs">{texto.length}/500</span>
          <button
            onClick={publicar}
            disabled={salvando || !titulo.trim() || !texto.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white text-sm font-semibold transition-colors"
          >
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Publicar
          </button>
        </div>
      </div>

      {confirmLimpar && (
        <ConfirmDialog
          message="Remover o aviso global? Ele deixará de aparecer para todos os usuários."
          onConfirm={limpar}
          onCancel={() => setConfirmLimpar(false)}
        />
      )}
    </div>
  );
}

// ─── Aba: Regras ──────────────────────────────────────────────────────────────

const REGRAS_PADRAO = {
  // Teoria
  teoriaComum_pts_por_hora: 20,
  teoriaFoco_pts_por_hora: 30,
  // Questões
  questaoComum_pts: 2,
  questaoFoco_pts: 3,
  antiChute_threshold: 40,
  // Dificuldade questões
  dificuldade_facil: 0.7,
  dificuldade_medio: 1.0,
  dificuldade_dificil: 1.5,
  // Redação
  redacao_fator: 0.3,
  // Multiplicador facilidade
  facilidade_boost_ate_min: 240,
  facilidade_boost_mult: 1.5,
  facilidade_normal_ate_min: 480,
  facilidade_normal_mult: 1.0,
  facilidade_fadiga_mult: 0.5,
};

function TabRegras() {
  const [regras, setRegras] = useState(null);
  const [original, setOriginal] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "config", "regras")).then((snap) => {
      const data = snap.exists() ? snap.data() : REGRAS_PADRAO;
      setRegras({ ...REGRAS_PADRAO, ...data });
      setOriginal({ ...REGRAS_PADRAO, ...data });
    });
  }, []);

  const salvar = async () => {
    setSalvando(true);
    try {
      await setDoc(doc(db, "config", "regras"), regras);
      setOriginal({ ...regras });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    } finally {
      setSalvando(false);
    }
  };

  const restaurar = async () => {
    await setDoc(doc(db, "config", "regras"), REGRAS_PADRAO);
    setRegras({ ...REGRAS_PADRAO });
    setOriginal({ ...REGRAS_PADRAO });
    setResetConfirm(false);
  };

  if (!regras) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  const Field = ({ label, field, step = 1, min = 0 }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
      <label className="text-gray-400 text-sm flex-1">{label}</label>
      <input
        type="number"
        step={step}
        min={min}
        value={regras[field]}
        onChange={(e) =>
          setRegras((r) => ({ ...r, [field]: parseFloat(e.target.value) || 0 }))
        }
        className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white text-right focus:outline-none focus:border-violet-500 transition-colors"
      />
    </div>
  );

  const Section = ({ title, icon: Icon, gradient, children }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className={`flex items-center gap-2 mb-3`}>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-white font-bold text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );

  const mudou = JSON.stringify(regras) !== JSON.stringify(original);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-violet-900/20 border border-violet-700/40 rounded-xl p-3 text-violet-300 text-xs leading-relaxed">
        ⚙️ Edite os parâmetros abaixo. As alterações afetam <strong>novos lançamentos</strong> a partir do momento em que forem salvas.
      </div>

      <Section title="Teoria (pts/hora)" icon={BookOpen} gradient="from-blue-600 to-cyan-500">
        <Field label="Disciplina comum" field="teoriaComum_pts_por_hora" />
        <Field label="Área de foco" field="teoriaFoco_pts_por_hora" />
      </Section>

      <Section title="Questões (pts/acerto)" icon={Zap} gradient="from-amber-500 to-orange-500">
        <Field label="Disciplina comum" field="questaoComum_pts" />
        <Field label="Área de foco" field="questaoFoco_pts" />
        <Field label="Threshold anti-chute (%)" field="antiChute_threshold" min={0} />
      </Section>

      <Section title="Multiplicador de Dificuldade" icon={BarChart3} gradient="from-rose-600 to-pink-500">
        <Field label="Fácil (×)" field="dificuldade_facil" step={0.1} />
        <Field label="Médio (×)" field="dificuldade_medio" step={0.1} />
        <Field label="Difícil (×)" field="dificuldade_dificil" step={0.1} />
      </Section>

      <Section title="Redação" icon={FileText} gradient="from-purple-600 to-violet-500">
        <Field label="Fator de conversão (nota × fator)" field="redacao_fator" step={0.05} />
      </Section>

      <Section title="Multiplicador de Facilidade" icon={Trophy} gradient="from-amber-400 to-yellow-500">
        <Field label="Boost até (min)" field="facilidade_boost_ate_min" />
        <Field label="Boost (×)" field="facilidade_boost_mult" step={0.1} />
        <Field label="Normal até (min)" field="facilidade_normal_ate_min" />
        <Field label="Normal (×)" field="facilidade_normal_mult" step={0.1} />
        <Field label="Fadiga (×)" field="facilidade_fadiga_mult" step={0.1} />
      </Section>

      {/* Ações — fixo na parte inferior da tela */}
      <div className="flex gap-3 fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-md py-3 px-4 border-t border-gray-800 z-30">
        <button
          onClick={() => setResetConfirm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 text-sm font-medium transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Restaurar padrões
        </button>
        <button
          onClick={salvar}
          disabled={salvando || !mudou}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white text-sm font-semibold transition-colors"
        >
          {salvando ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : salvo ? (
            <><Check className="w-4 h-4" /> Salvo!</>
          ) : (
            <><Save className="w-4 h-4" /> Salvar regras</>
          )}
        </button>
      </div>
      {/* Espaço para a barra fixa não cobrir o último card */}
      <div className="h-20" />

      {resetConfirm && (
        <ConfirmDialog
          message="Restaurar todos os parâmetros para os valores padrão originais?"
          onConfirm={restaurar}
          onCancel={() => setResetConfirm(false)}
        />
      )}
    </div>
  );
}

// ─── Aba: Reset Global ────────────────────────────────────────────────────────

function BotaoResetGlobal({ usuarios }) {
  const [confirm, setConfirm] = useState(false);
  const [resetando, setResetando] = useState(false);
  const [feito, setFeito] = useState(false);

  const resetar = async () => {
    setResetando(true);
    try {
      const batch = writeBatch(db);
      usuarios.forEach((u) => {
        batch.update(doc(db, "usuarios", u.id), { pontuacaoTotal: 0 });
      });
      await batch.commit();
      setFeito(true);
      setConfirm(false);
      setTimeout(() => setFeito(false), 3000);
    } finally {
      setResetando(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setConfirm(true)}
        className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-red-900/20 hover:bg-red-900/40 border border-red-800/50 rounded-2xl text-red-400 font-semibold text-sm transition-colors"
      >
        {resetando ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : feito ? (
          <><Check className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400">Ranking zerado!</span></>
        ) : (
          <><RotateCcw className="w-4 h-4" /> Zerar ranking de todos</>
        )}
      </button>
      {confirm && (
        <ConfirmDialog
          message={`Zerar a pontuação de TODOS os ${usuarios.length} usuários? Essa ação é IRREVERSÍVEL.`}
          onConfirm={resetar}
          onCancel={() => setConfirm(false)}
        />
      )}
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const ABAS = [
  { id: "visao", label: "Visão Geral", icon: LayoutDashboard },
  { id: "usuarios", label: "Usuários", icon: Users },
  { id: "lancamentos", label: "Lançamentos", icon: FileText },
  { id: "avisos", label: "Avisos", icon: Megaphone },
  { id: "regras", label: "Regras", icon: Settings },
];

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState("visao");
  const [usuarios, setUsuarios] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      // Buscar usuários
      const snapUsers = await getDocs(
        query(collection(db, "usuarios"), orderBy("pontuacaoTotal", "desc"), limit(500))
      );
      const users = snapUsers.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsuarios(users);

      // Buscar todos os registros de estudo (coleção raiz: registros_estudo)
      const snapLanc = await getDocs(
        collection(db, "registros_estudo")
      );
      const lancs = snapLanc.docs
        .map((d) => ({
          _docPath: d.ref.path,
          id: d.id,
          ...d.data(),
        }))
        // ordenar do mais recente para o mais antigo no cliente
        .sort((a, b) => {
          const dateA = a.data || a.criadoEm;
          const dateB = b.data || b.criadoEm;
          const ta = dateA?.toDate ? dateA.toDate().getTime() : (dateA ? new Date(dateA).getTime() : 0);
          const tb = dateB?.toDate ? dateB.toDate().getTime() : (dateB ? new Date(dateB).getTime() : 0);
          return tb - ta;
        });
      setLancamentos(lancs);
    } catch (err) {
      console.error("Erro ao carregar dados admin:", err);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // ── Handlers ──

  const deletarUsuario = async (uid) => {
    await deleteDoc(doc(db, "usuarios", uid));
    setUsuarios((prev) => prev.filter((u) => u.id !== uid));
  };

  const editarPontuacao = async (uid, novaPts) => {
    await updateDoc(doc(db, "usuarios", uid), { pontuacaoTotal: novaPts });
    setUsuarios((prev) =>
      prev.map((u) => (u.id === uid ? { ...u, pontuacaoTotal: novaPts } : u))
    );
  };

  const deletarLancamento = async (lanc) => {
    await deleteDoc(doc(db, "registros_estudo", lanc.id));
    setLancamentos((prev) => prev.filter((l) => l.id !== lanc.id));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-6">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">Admin</h1>
              <p className="text-violet-400 text-xs">Call of Study</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={carregar}
              disabled={carregando}
              className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
              title="Recarregar dados"
            >
              <RefreshCw className={`w-4 h-4 ${carregando ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-red-400 hover:bg-red-900/10 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-0">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0">
            {ABAS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setAbaAtiva(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                  abaAtiva === id
                    ? "text-violet-300 border-violet-500 bg-violet-900/20"
                    : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <main className="max-w-2xl mx-auto px-4 pt-5">
        {carregando && lancamentos.length === 0 && usuarios.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        ) : (
          <>
            {abaAtiva === "visao" && (
              <>
                <TabVisaoGeral usuarios={usuarios} lancamentos={lancamentos} />
                <BotaoResetGlobal usuarios={usuarios} />
              </>
            )}
            {abaAtiva === "usuarios" && (
              <TabUsuarios
                usuarios={usuarios}
                onDelete={deletarUsuario}
                onEditPts={editarPontuacao}
              />
            )}
            {abaAtiva === "lancamentos" && (
              <TabLancamentos
                lancamentos={lancamentos}
                usuarios={usuarios}
                onDelete={deletarLancamento}
              />
            )}
            {abaAtiva === "avisos" && <TabAvisos />}
            {abaAtiva === "regras" && <TabRegras />}
          </>
        )}
      </main>
    </div>
  );
}
