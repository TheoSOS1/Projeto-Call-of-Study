import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  BookOpen,
  GraduationCap,
  Star,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

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

function SelectField({ icon: Icon, label, value, onChange, options, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-gray-300 text-sm font-medium">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <select
          required
          value={value}
          onChange={onChange}
          className="w-full bg-gray-800 text-white rounded-xl pl-10 pr-9 py-3 text-sm border border-gray-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition appearance-none cursor-pointer"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
    </div>
  );
}

function DisciplinaSelectField({ icon: Icon, label, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-gray-300 text-sm font-medium">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <select
          required
          value={value}
          onChange={onChange}
          className="w-full bg-gray-800 text-white rounded-xl pl-10 pr-9 py-3 text-sm border border-gray-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition appearance-none cursor-pointer"
        >
          <option value="" disabled>
            Selecione uma disciplina
          </option>
          {Object.entries(DISCIPLINAS_POR_AREA).map(([area, disciplinas]) => (
            <optgroup key={area} label={area}>
              {disciplinas.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
    </div>
  );
}

export default function CompletarCadastro() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [areaFoco, setAreaFoco] = useState("");
  const [disciplinaFacilidade, setDisciplinaFacilidade] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleAreaChange = (e) => {
    setAreaFoco(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      await setDoc(doc(db, "usuarios", user.uid), {
        nome: user.displayName || "Estudante",
        email: user.email,
        areaFoco,
        disciplinaFacilidade,
        minutosFacilidadeNestaSemana: 0,
        pontuacaoTotal: 0,
      });

      navigate("/dashboard");
    } catch {
      setErro("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  // Nome do Google para exibir (primeiro nome)
  const primeiroNome = user?.displayName?.split(" ")[0] || "estudante";

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-10">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
          <BookOpen className="text-white w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Quase lá, {primeiroNome}!
        </h1>
        <p className="text-gray-400 text-sm text-center max-w-xs">
          Complete seu perfil para personalizar sua experiência de estudos
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800">

        {/* Info do Google */}
        <div className="flex items-center gap-3 bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 mb-5">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Foto do Google"
              className="w-9 h-9 rounded-full border border-gray-600"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-violet-700 flex items-center justify-center text-white text-sm font-bold">
              {primeiroNome[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-white text-sm font-medium truncate">
              {user?.displayName || "Usuário Google"}
            </span>
            <span className="text-gray-400 text-xs truncate">{user?.email}</span>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-auto" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <SelectField
            icon={GraduationCap}
            label="Área de Foco (ENEM)"
            value={areaFoco}
            onChange={handleAreaChange}
            options={AREAS_FOCO}
            placeholder="Selecione sua área"
          />

          <DisciplinaSelectField
            icon={Star}
            label="Disciplina de Maior Facilidade"
            value={disciplinaFacilidade}
            onChange={(e) => setDisciplinaFacilidade(e.target.value)}
          />

          {erro && (
            <div className="flex items-center gap-2 bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 flex items-center justify-center mt-1"
          >
            {carregando ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Entrar no Call of Study →"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
