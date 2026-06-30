import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db, googleProvider } from "../services/firebase";
import {
  Mail,
  Lock,
  BookOpen,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Send,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  // ── Estados do login ──────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);

  // ── Estados da recuperação de senha ───────────────────────────────────────
  const [telaRecuperacao, setTelaRecuperacao] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState("");
  const [carregandoRecuperacao, setCarregandoRecuperacao] = useState(false);
  const [erroRecuperacao, setErroRecuperacao] = useState("");
  const [emailEnviado, setEmailEnviado] = useState(false);

  // ── Handlers de login ─────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      navigate("/dashboard");
    } catch (erro) {
      console.error("Erro no login:", erro.code, erro.message);
      const mensagens = {
        "auth/user-not-found":        "Nenhuma conta encontrada com este e-mail.",
        "auth/wrong-password":         "Senha incorreta.",
        "auth/invalid-email":          "E-mail inválido.",
        "auth/too-many-requests":      "Muitas tentativas. Tente novamente mais tarde.",
        "auth/invalid-credential":     "E-mail ou senha incorretos.", // Firebase v10+
        "auth/network-request-failed": "Sem conexão. Verifique sua internet.",
      };
      setErro(mensagens[erro.code] ?? "Ocorreu um erro. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const handleLoginGoogle = async () => {
    setErro("");
    setCarregandoGoogle(true);

    try {
      const { user } = await signInWithPopup(auth, googleProvider);

      // 1º: verifica por UID (caso mais comum)
      const snapUid = await getDoc(doc(db, "usuarios", user.uid));
      if (snapUid.exists()) {
        navigate("/dashboard");
        return;
      }

      // 2º: verifica por e-mail (conta criada via e-mail/senha com uid diferente)
      const q = query(
        collection(db, "usuarios"),
        where("email", "==", user.email)
      );
      const snapEmail = await getDocs(q);
      if (!snapEmail.empty) {
        navigate("/completar-cadastro");
        return;
      }

      // Usuário realmente novo → onboarding
      navigate("/completar-cadastro");
    } catch (error) {
      if (
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/cancelled-popup-request"
      ) {
        return;
      }
      if (error.code === "auth/account-exists-with-different-credential") {
        setErro(
          "Esse e-mail já está cadastrado com e-mail e senha. Entre usando e-mail e senha."
        );
        return;
      }
      setErro("Erro ao entrar com Google. Tente novamente.");
    } finally {
      setCarregandoGoogle(false);
    }
  };

  // ── Handler de recuperação de senha ───────────────────────────────────────
  const handleRecuperarSenha = async (e) => {
    e.preventDefault();
    setErroRecuperacao("");
    setCarregandoRecuperacao(true);

    try {
      await sendPasswordResetEmail(auth, emailRecuperacao.trim());
      setEmailEnviado(true);
    } catch (erro) {
      console.error("Erro ao enviar e-mail de recuperação:", erro.code, erro.message);
      const mensagens = {
        "auth/user-not-found":        "Nenhuma conta encontrada com este e-mail.",
        "auth/invalid-email":          "E-mail inválido.",
        "auth/too-many-requests":      "Muitas tentativas. Tente novamente mais tarde.",
        "auth/network-request-failed": "Sem conexão. Verifique sua internet.",
      };
      setErroRecuperacao(mensagens[erro.code] ?? "Erro ao enviar e-mail. Tente novamente.");
    } finally {
      setCarregandoRecuperacao(false);
    }
  };

  const voltarParaLogin = () => {
    setTelaRecuperacao(false);
    setEmailRecuperacao("");
    setErroRecuperacao("");
    setEmailEnviado(false);
  };

  const abrirRecuperacao = () => {
    // Pré-preenche com o e-mail já digitado no login, se houver
    setEmailRecuperacao(email.trim());
    setErroRecuperacao("");
    setEmailEnviado(false);
    setTelaRecuperacao(true);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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
        <p className="text-gray-400 text-sm">
          {telaRecuperacao ? "Recuperação de senha" : "Entre na sua conta para continuar"}
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800">

        {/* ── Tela de recuperação de senha ────────────────────────────────── */}
        {telaRecuperacao ? (
          <div className="flex flex-col gap-4">
            {/* Botão voltar */}
            <button
              type="button"
              onClick={voltarParaLogin}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </button>

            {emailEnviado ? (
              /* Sucesso */
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-900/40 border border-emerald-700/60 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold mb-1">E-mail enviado!</p>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Verifique sua caixa de entrada em{" "}
                    <strong className="text-gray-200">{emailRecuperacao}</strong>{" "}
                    e siga as instruções para redefinir sua senha.
                  </p>
                </div>
                <p className="text-gray-600 text-xs">
                  Não recebeu? Verifique a pasta de spam ou{" "}
                  <button
                    type="button"
                    onClick={() => setEmailEnviado(false)}
                    className="text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    tente novamente
                  </button>
                  .
                </p>
              </div>
            ) : (
              /* Formulário de recuperação */
              <form onSubmit={handleRecuperarSenha} className="flex flex-col gap-4">
                <div>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">
                    Digite o e-mail da sua conta. Você receberá um link para
                    criar uma nova senha.
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-gray-300 text-sm font-medium">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        required
                        autoFocus
                        value={emailRecuperacao}
                        onChange={(e) => setEmailRecuperacao(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Erro de recuperação */}
                {erroRecuperacao && (
                  <div className="flex items-center gap-2 bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{erroRecuperacao}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={carregandoRecuperacao}
                  className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {carregandoRecuperacao ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar link de recuperação
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* ── Tela de login normal ─────────────────────────────────────── */
          <>
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
                <div className="flex items-center justify-between">
                  <label className="text-gray-300 text-sm font-medium">Senha</label>
                  <button
                    type="button"
                    onClick={abrirRecuperacao}
                    className="text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-800 text-white placeholder-gray-600 rounded-xl pl-10 pr-10 py-3 text-sm border border-gray-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                disabled={carregando || carregandoGoogle}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {carregando ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Entrar"
                )}
              </button>
            </form>

            {/* Divisor */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-gray-600 text-xs font-medium">ou</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            {/* Botão Google */}
            <button
              type="button"
              onClick={handleLoginGoogle}
              disabled={carregando || carregandoGoogle}
              className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed border border-gray-700 text-white font-medium py-3 rounded-xl transition-colors duration-200"
            >
              {carregandoGoogle ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {/* Ícone oficial do Google */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Entrar com Google
                </>
              )}
            </button>

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
          </>
        )}
      </div>
    </div>
  );
}
