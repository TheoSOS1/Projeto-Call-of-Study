import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  Timestamp,
  increment,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  calcularPontos,
  calcularPontosBase,
  calcularMultiplicador,
  calcularMultiplicadorRedacao,
  isAntiChute,
  getInicioSemanaAtual,
} from "../utils/calculadora";
import {
  BookOpen,
  Target,
  PenTool,
  ChevronDown,
  Star,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Clock,
  Loader2,
  ArrowRight,
  FileText,
} from "lucide-react";
import BottomNav from "../components/BottomNav";

const TIPOS = [
  {
    id: "teoria",
    label: "Teoria",
    icon: BookOpen,
    gradient: "from-blue-600 to-cyan-500",
    desc: "Leitura, vídeos, resumos",
  },
  {
    id: "questoes",
    label: "Questões",
    icon: Target,
    gradient: "from-amber-500 to-orange-500",
    desc: "Resolução de exercícios",
  },
  {
    id: "redacao",
    label: "Redação",
    icon: PenTool,
    gradient: "from-purple-600 to-violet-500",
    desc: "Prática de redação",
  },
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

// ─── Labels dos tiers de tempo da Redação ────────────────────────────────────
const TIER_REDACAO = {
  veloz:   { label: "Veloz",   color: "bg-emerald-900/60 text-emerald-400" },
  rapido:  { label: "Rápido",  color: "bg-teal-900/60 text-teal-400" },
  ideal:   { label: "Ideal",   color: "bg-blue-900/60 text-blue-400" },
  lento:   { label: "Lento",   color: "bg-amber-900/60 text-amber-400" },
  devagar: { label: "Devagar", color: "bg-red-900/60 text-red-400" },
};

export default function Lancamento() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [perfil, setPerfil] = useState(null);
  const [tipo, setTipo] = useState("teoria");

  // ─── Campos de Teoria / Questões ────────────────────────────────────────────────────
  const [disciplina, setDisciplina] = useState("");
  const [minutos, setMinutos] = useState("");
  const [feitas, setFeitas] = useState("");
  const [acertos, setAcertos] = useState("");
  const [dificuldade, setDificuldade] = useState("medio");

  // ─── Campos exclusivos de Redação ────────────────────────────────────────
  const [tema, setTema] = useState("");
  const [nota, setNota] = useState("");
  const [tempoRedacao, setTempoRedacao] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "usuarios", user.uid)).then((snap) => {
      if (snap.exists()) setPerfil(snap.data());
    });
  }, [user]);

  // Minutos efetivos respeitando reset semanal
  const minutosEfetivos = useMemo(() => {
    if (!perfil) return 0;
    const inicioSemana = getInicioSemanaAtual();
    const semanaTs = perfil.semanaInicio?.toDate ? perfil.semanaInicio.toDate() : null;
    const novaSemana = !semanaTs || semanaTs < inicioSemana;
    return novaSemana ? 0 : (perfil.minutosFacilidadeNestaSemana || 0);
  }, [perfil]);

  // ─── Objeto de dados conforme o tipo ───────────────────────────────────────────
  const dados = useMemo(() => {
    if (tipo === "teoria") {
      if (!disciplina) return null;
      return { disciplina, minutos: Number(minutos) || 0 };
    }
    if (tipo === "questoes") {
      if (!disciplina) return null;
      return { disciplina, feitas: Number(feitas) || 0, acertos: Number(acertos) || 0, dificuldade };
    }
    if (tipo === "redacao") {
      return { tema, nota: Number(nota) || 0, tempo: Number(tempoRedacao) || 0 };
    }
    return null;
  }, [tipo, disciplina, minutos, feitas, acertos, nota, tema, tempoRedacao, dificuldade]);

  // ─── Prévia de pontuação ──────────────────────────────────────────────────
  const preview = useMemo(() => {
    if (!dados || !perfil) return null;

    if (tipo === "redacao") {
      const tempo = Number(tempoRedacao) || 0;
      if (tempo <= 0) return null; // precisa informar o tempo para mostrar prévia
      const { multiplicador, tier } = calcularMultiplicadorRedacao(tempo);
      const base = (dados.nota || 0) * 0.3;
      const final = Math.round(base * multiplicador);
      return { base: Math.round(base * 10) / 10, multiplicador, tier, final, antiChute: false, isRedacao: true };
    }

    const base = calcularPontosBase(tipo, dados, perfil.areaFoco || "");
    const { multiplicador, tier } = calcularMultiplicador(
      disciplina,
      perfil.disciplinaFacilidade,
      minutosEfetivos
    );
    const final = Math.round(base * multiplicador);
    const antiChute =
      tipo === "questoes" && dados.feitas > 0 && isAntiChute(dados.feitas, dados.acertos);
    return { base: Math.round(base * 10) / 10, multiplicador, tier, final, antiChute };
  }, [dados, perfil, tipo, disciplina, minutosEfetivos, tempoRedacao]);

  // ─── Validação do formulário ──────────────────────────────────────────────
  const formValido = useMemo(() => {
    if (tipo === "teoria") return !!disciplina && Number(minutos) > 0;
    if (tipo === "questoes") {
      const f = Number(feitas);
      const a = Number(acertos);
      return !!disciplina && f > 0 && a >= 0 && a <= f;
    }
    if (tipo === "redacao") {
      const n = Number(nota);
      const t = Number(tempoRedacao);
      return tema.trim().length > 0 && n >= 0 && n <= 1000 && t > 0;
    }
    return false;
  }, [tipo, disciplina, minutos, feitas, acertos, nota, tema, tempoRedacao]);

  /**
   * Verifica se o usuário já enviou uma redação nos últimos 7 dias (cooldown semanal).
   */
  const verificarCooldownRedacao = async () => {
    const inicioSemana = getInicioSemanaAtual();
    const q = query(
      collection(db, "registros_estudo"),
      where("userId", "==", user.uid),
      where("tipo", "==", "redacao"),
      where("data", ">=", Timestamp.fromDate(inicioSemana)),
      limit(1)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dados || !perfil || !formValido) return;
    setErro("");
    setEnviando(true);

    try {
      // ── Cooldown de Redação ──────────────────────────────────────────────
      if (tipo === "redacao") {
        const jaTeveCooldown = await verificarCooldownRedacao();
        if (jaTeveCooldown) {
          setErro(
            "⏳ Cooldown: Você já enviou sua redação desta semana. Tente novamente na próxima segunda-feira!"
          );
          setEnviando(false);
          return;
        }
      }

      const inicioSemana = getInicioSemanaAtual();
      const semanaTs = perfil.semanaInicio?.toDate ? perfil.semanaInicio.toDate() : null;
      const novaSemana = !semanaTs || semanaTs < inicioSemana;

      const pontos = calcularPontos(
        tipo,
        dados,
        perfil.areaFoco || "",
        perfil.disciplinaFacilidade,
        minutosEfetivos
      );

      const batch = writeBatch(db);

      // 1. Novo documento em registros_estudo
      const registroRef = doc(collection(db, "registros_estudo"));
      batch.set(registroRef, {
        userId: user.uid,
        tipo,
        pontos,
        data: serverTimestamp(),
        // ── Teoria ──
        ...(tipo === "teoria" && { disciplina, minutos: Number(minutos) }),
        // ── Questões ──
        ...(tipo === "questoes" && {
          disciplina,
          feitas: Number(feitas),
          acertos: Number(acertos),
          dificuldade, // "facil" | "medio" | "dificil"
        }),
        // ── Redação (sem disciplina — usa tema + tempo) ──
        ...(tipo === "redacao" && {
          tema: tema.trim(),
          nota: Number(nota),
          tempo: Number(tempoRedacao),
        }),
      });

      // 2. Atualizar documento do usuário
      const userRef = doc(db, "usuarios", user.uid);
      const updateData = { pontuacaoTotal: increment(pontos) };

      if (tipo === "teoria" && disciplina === perfil.disciplinaFacilidade) {
        if (novaSemana) {
          updateData.minutosFacilidadeNestaSemana = Number(minutos);
          updateData.semanaInicio = serverTimestamp();
        } else {
          updateData.minutosFacilidadeNestaSemana = increment(Number(minutos));
        }
      }

      batch.update(userRef, updateData);
      await batch.commit();

      // Atualizar perfil local para o próximo cálculo
      setPerfil((prev) => {
        const isFacilidade = tipo === "teoria" && disciplina === prev.disciplinaFacilidade;
        const novosMinutos = novaSemana
          ? Number(minutos)
          : (prev.minutosFacilidadeNestaSemana || 0) + Number(minutos);
        return {
          ...prev,
          pontuacaoTotal: (prev.pontuacaoTotal || 0) + pontos,
          minutosFacilidadeNestaSemana: isFacilidade
            ? novosMinutos
            : prev.minutosFacilidadeNestaSemana || 0,
          ...(isFacilidade && novaSemana ? { semanaInicio: new Date() } : {}),
        };
      });

      setSucesso(true);
      setTimeout(() => {
        setSucesso(false);
        setDisciplina("");
        setMinutos("");
        setFeitas("");
        setAcertos("");
        setDificuldade("medio");
        setNota("");
        setTema("");
        setTempoRedacao("");
      }, 2500);
    } catch (err) {
      console.error(err);
      setErro("Erro ao salvar sessão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <header className="px-4 pt-6 pb-2 max-w-lg mx-auto">
        <h1 className="text-xl font-bold">Lançar Sessão</h1>
        <p className="text-gray-400 text-sm mt-0.5">Registre sua atividade de estudo</p>
      </header>

      <main className="px-4 pb-4 max-w-lg mx-auto flex flex-col gap-5 mt-4">
        {/* Seletor de tipo */}
        <div className="flex flex-col gap-2">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
            Tipo de Atividade
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {TIPOS.map(({ id, label, icon: Icon, gradient }) => {
              const active = tipo === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTipo(id);
                    setDisciplina("");
                    setMinutos("");
                    setFeitas("");
                    setAcertos("");
                    setDificuldade("medio");
                    setNota("");
                    setTema("");
                    setTempoRedacao("");
                    setErro("");
                  }}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all duration-200 ${
                    active
                      ? `bg-gradient-to-br ${gradient} border-transparent shadow-lg`
                      : "bg-gray-900 border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-white" : "text-gray-500"}`} />
                  <span className={`text-xs font-bold ${active ? "text-white" : "text-gray-400"}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* ── Disciplina: só para Teoria e Questões ─────────────────────── */}
          {tipo !== "redacao" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-300 text-sm font-medium">Disciplina</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <select
                  required
                  value={disciplina}
                  onChange={(e) => setDisciplina(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-xl pl-10 pr-9 py-3 text-sm border border-gray-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition appearance-none cursor-pointer"
                >
                  <option value="" disabled>Selecione a disciplina</option>
                  {Object.entries(DISCIPLINAS_POR_AREA).map(([area, discs]) => (
                    <optgroup key={area} label={area}>
                      {discs.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
              {disciplina && perfil?.disciplinaFacilidade === disciplina && (
                <p className="text-amber-400 text-xs flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  Sua disciplina de facilidade — multiplicador ativo
                </p>
              )}
            </div>
          )}

          {/* ── Campos de Teoria ──────────────────────────────────────────── */}
          {tipo === "teoria" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-300 text-sm font-medium">
                Tempo estudado (minutos)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="number"
                  min="1"
                  required
                  value={minutos}
                  onChange={(e) => setMinutos(e.target.value)}
                  placeholder="Ex: 60"
                  className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                />
              </div>
              {Number(minutos) > 0 && (
                <p className="text-gray-500 text-xs">
                  ≈ {(Number(minutos) / 60).toFixed(1)}h de estudo
                </p>
              )}
            </div>
          )}

          {/* ── Campos de Questões ────────────────────────────────────────── */}
          {tipo === "questoes" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-300 text-sm font-medium">Feitas</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={feitas}
                    onChange={(e) => setFeitas(e.target.value)}
                    placeholder="Ex: 20"
                    className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-300 text-sm font-medium">Acertos</label>
                  <input
                    type="number"
                    min="0"
                    max={feitas || undefined}
                    required
                    value={acertos}
                    onChange={(e) => setAcertos(e.target.value)}
                    placeholder="Ex: 14"
                    className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                  />
                </div>
              </div>

              {Number(feitas) > 0 && acertos !== "" && (
                <div
                  className={`text-xs px-3 py-2.5 rounded-xl flex items-center gap-2 ${
                    preview?.antiChute
                      ? "bg-red-900/40 border border-red-700/60 text-red-300"
                      : "bg-emerald-900/30 border border-emerald-800/60 text-emerald-400"
                  }`}
                >
                  {preview?.antiChute ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Taxa: {Math.round((Number(acertos) / Number(feitas)) * 100)}% —
                      Anti-Chute ativo → pontuação ZERO
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Taxa de acerto:{" "}
                      {Math.round((Number(acertos) / Number(feitas)) * 100)}% ✓
                    </>
                  )}
                </div>
              )}

              {/* Seletor de dificuldade */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dificuldade das questões
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { valor: "facil",   rotulo: "Fácil",   cor: "emerald", descricao: "×0.7" },
                    { valor: "medio",   rotulo: "Médio",   cor: "amber",   descricao: "×1.0" },
                    { valor: "dificil", rotulo: "Difícil", cor: "red",     descricao: "×1.5" },
                  ].map(({ valor, rotulo, cor, descricao }) => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => setDificuldade(valor)}
                      className={`
                        flex flex-col items-center py-3 px-2 rounded-xl border transition-all
                        ${
                          dificuldade === valor
                            ? cor === "emerald"
                              ? "bg-emerald-900/40 border-emerald-500 text-emerald-300"
                              : cor === "amber"
                              ? "bg-amber-900/40 border-amber-500 text-amber-300"
                              : "bg-red-900/40 border-red-500 text-red-300"
                            : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                        }
                      `}
                    >
                      <span className="text-sm font-semibold">{rotulo}</span>
                      <span className="text-xs mt-0.5 opacity-75">{descricao}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Campos de Redação ─────────────────────────────────────────── */}
          {tipo === "redacao" && (
            <div className="flex flex-col gap-4">
              {/* Tema */}
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-300 text-sm font-medium">Tema da redação</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                    placeholder="Ex: Desafios da mobilidade urbana"
                    maxLength={120}
                    className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                  />
                </div>
              </div>

              {/* Nota e Tempo lado a lado */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-300 text-sm font-medium">Nota (0–1000)</label>
                  <div className="relative">
                    <PenTool className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      step="10"
                      required
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      placeholder="Ex: 720"
                      className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl pl-10 pr-2 py-3 text-sm border border-gray-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-gray-300 text-sm font-medium">Tempo (min)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="number"
                      min="1"
                      required
                      value={tempoRedacao}
                      onChange={(e) => setTempoRedacao(e.target.value)}
                      placeholder="Ex: 65"
                      className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl pl-10 pr-2 py-3 text-sm border border-gray-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Aviso de cooldown */}
              <div className="flex items-center gap-2 text-purple-400 text-xs">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                Limite: 1 redação por semana (reseta toda segunda-feira)
              </div>
            </div>
          )}

          {/* ── Prévia de pontos ──────────────────────────────────────────── */}
          {preview && formValido && !preview.antiChute && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">
                Prévia da pontuação
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs">Base</p>
                  <p className="text-white text-sm font-semibold">{preview.base} pts</p>
                </div>

                {/* Multiplicador */}
                <div className="text-center">
                  <p className="text-gray-500 text-xs mb-1">Mult.</p>
                  {preview.isRedacao ? (
                    // Tier de tempo da redação
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        TIER_REDACAO[preview.tier]?.color || "bg-gray-800 text-gray-400"
                      }`}
                    >
                      ×{preview.multiplicador}{" "}
                      {TIER_REDACAO[preview.tier]?.label}
                    </span>
                  ) : preview.tier ? (
                    // Tier de facilidade (teoria/questões)
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        preview.tier === "boost"
                          ? "bg-emerald-900/60 text-emerald-400"
                          : preview.tier === "fadiga"
                          ? "bg-red-900/60 text-red-400"
                          : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      ×{preview.multiplicador}
                    </span>
                  ) : null}
                </div>

                <div className="text-right">
                  <p className="text-gray-500 text-xs">Total</p>
                  <p className="text-2xl font-black text-violet-400">+{preview.final}</p>
                </div>
              </div>

              {/* Mensagens de contexto */}
              {preview.isRedacao && preview.tier !== "ideal" && (
                <p
                  className={`text-xs flex items-center gap-1.5 mt-2.5 border-t border-gray-800 pt-2.5 ${
                    ["veloz", "rapido"].includes(preview.tier)
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                >
                  {["veloz", "rapido"].includes(preview.tier) ? (
                    <><Zap className="w-3 h-3" /> Bônus por velocidade — você ficou abaixo de 1h!</>
                  ) : (
                    <><AlertTriangle className="w-3 h-3" /> Penalidade — redação acima de 80 min</>
                  )}
                </p>
              )}
              {preview.tier === "boost" && (
                <p className="text-emerald-400 text-xs flex items-center gap-1.5 mt-2.5 border-t border-gray-800 pt-2.5">
                  <Zap className="w-3 h-3" />
                  Boost ×1.5 — menos de 4h na facilidade esta semana
                </p>
              )}
              {preview.tier === "fadiga" && (
                <p className="text-red-400 text-xs flex items-center gap-1.5 mt-2.5 border-t border-gray-800 pt-2.5">
                  <AlertTriangle className="w-3 h-3" />
                  Fadiga ×0.5 — você passou de 8h nessa matéria esta semana
                </p>
              )}
            </div>
          )}

          {/* Erro / Cooldown */}
          {erro && (
            <div className="flex items-start gap-2 bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          {/* Botão enviar */}
          <button
            type="submit"
            disabled={!formValido || enviando || sucesso}
            className={`w-full font-semibold py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
              sucesso
                ? "bg-emerald-600 text-white"
                : "bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white"
            }`}
          >
            {enviando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : sucesso ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Sessão registrada!
              </>
            ) : (
              <>
                Registrar sessão
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}
