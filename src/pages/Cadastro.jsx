import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import {
  User,
  Mail,
  Lock,
  BookOpen,
  GraduationCap,
  Star,
  AlertCircle,
  ChevronDown,
  Eye,
  EyeOff,
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
  "Ciências Humanas": [
    "História",
    "Geografia",
    "Filosofia",
    "Sociologia",
  ],
  "Ciências da Natureza": [
    "Biologia",
    "Química",
    "Física",
  ],
  "Matemática": [
    "Matemática",
  ],
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

function InputField({ icon: Icon, label, type, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-gray-300 text-sm font-medium">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type={type}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
        />
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder, visible, onToggle }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-gray-300 text-sm font-medium">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          type={visible ? "text" : "password"}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl pl-10 pr-10 py-3 text-sm border border-gray-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          tabIndex={-1}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function Cadastro() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [areaFoco, setAreaFoco] = useState("");
  const [disciplinaFacilidade, setDisciplinaFacilidade] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Reseta disciplina ao mudar a área
  const handleAreaChange = (e) => {
    setAreaFoco(e.target.value);
    setDisciplinaFacilidade("");
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro("");

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    try {
      // 1. Cria o usuário no Firebase Auth
      const { user } = await createUserWithEmailAndPassword(auth, email, senha);

      // 2. Cria o documento no Firestore usando o uid como ID do documento
      await setDoc(doc(db, "usuarios", user.uid), {
        nome,
        email,
        areaFoco,
        disciplinaFacilidade,
        minutosFacilidadeNestaSemana: 0,
        pontuacaoTotal: 0,
      });

      navigate("/dashboard");
    } catch (error) {
      switch (error.code) {
        case "auth/email-already-in-use":
          setErro("Este e-mail já está cadastrado.");
          break;
        case "auth/invalid-email":
          setErro("E-mail inválido.");
          break;
        case "auth/weak-password":
          setErro("Senha muito fraca. Use pelo menos 6 caracteres.");
          break;
        default:
          setErro("Erro ao criar conta. Tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-10">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
          <BookOpen className="text-white w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Criar conta
        </h1>
        <p className="text-gray-400 text-sm">Junte-se ao grupo de estudos</p>
      </div>

      {/* Formulário */}
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800">
        <form onSubmit={handleCadastro} className="flex flex-col gap-4">
          <InputField
            icon={User}
            label="Nome completo"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
          />

          <InputField
            icon={Mail}
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
          />

          <PasswordField
            label="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Mín. 6 caracteres"
            visible={mostrarSenha}
            onToggle={() => setMostrarSenha((v) => !v)}
          />

          <PasswordField
            label="Confirmar Senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            placeholder="Repita a senha"
            visible={mostrarConfirmar}
            onToggle={() => setMostrarConfirmar((v) => !v)}
          />

          <SelectField
            icon={GraduationCap}
            label="Área de Foco"
            value={areaFoco}
            onChange={handleAreaChange}
            options={AREAS_FOCO}
            placeholder="Selecione sua área"
          />

          <SelectField
            icon={Star}
            label="Disciplina de Maior Facilidade"
            value={disciplinaFacilidade}
            onChange={(e) => setDisciplinaFacilidade(e.target.value)}
            options={areaFoco ? DISCIPLINAS_POR_AREA[areaFoco] : []}
            placeholder={
              areaFoco ? "Selecione a disciplina" : "Escolha a área primeiro"
            }
          />

          {/* Erro */}
          {erro && (
            <div className="flex items-center gap-2 bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 flex items-center justify-center"
          >
            {carregando ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Criar conta"
            )}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-5">
          Já tem conta?{" "}
          <Link
            to="/login"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
