import {
  BookOpen,
  Target,
  PenTool,
  Zap,
  AlertTriangle,
  Star,
  TrendingDown,
  TrendingUp,
  Clock,
  Info,
} from "lucide-react";
import BottomNav from "../components/BottomNav";

function Card({ children }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, title, gradient }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h2 className="text-white font-bold text-base">{title}</h2>
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className={`text-sm font-bold ${accent || "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

export default function Criterios() {
  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      <header className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        <h1 className="text-xl font-bold">Regras de Pontuação</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Como os pontos são calculados
        </p>
      </header>

      <main className="px-4 max-w-lg mx-auto flex flex-col gap-4">
        {/* Teoria */}
        <Card>
          <CardHeader
            icon={BookOpen}
            title="Teoria"
            gradient="from-blue-600 to-cyan-500"
          />
          <Row label="1h — disciplina comum" value="20 pts" />
          <Row
            label="1h — Área de Foco"
            value="30 pts"
            accent="text-cyan-400"
          />
          <p className="text-gray-600 text-xs mt-3">
            Tempo lançado em minutos e convertido automaticamente.
            Ex: 30 min da sua Área de Foco = 15 pts.
          </p>
        </Card>

        {/* Questões */}
        <Card>
          <CardHeader
            icon={Target}
            title="Questões"
            gradient="from-amber-500 to-orange-500"
          />
          <Row label="Por acerto — disciplina comum" value="+2 pts" />
          <Row
            label="Por acerto — Área de Foco"
            value="+3 pts"
            accent="text-amber-400"
          />
          <p className="text-gray-600 text-xs mt-1 mb-3">
            Questões feitas sem acerto não geram pontos — só acertos contam.
          </p>
          <div className="bg-red-950/60 border border-red-800/60 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-red-400 text-sm font-bold">
                Regra Anti-Chute
              </span>
            </div>
            <p className="text-red-300/80 text-xs leading-relaxed">
              Se a taxa de acerto for inferior a 40%, toda a pontuação da
              bateria é zerada. Não adianta chutar!
            </p>
          </div>
        </Card>

        {/* Redação */}
        <Card>
          <CardHeader
            icon={PenTool}
            title="Redação"
            gradient="from-purple-600 to-violet-500"
          />
          <Row label="Fórmula" value="Nota × 0,3" />
          <Row label="Nota 500" value="150 pts" />
          <Row label="Nota 900" value="270 pts" />
          <Row label="Nota máxima (1000)" value="300 pts" accent="text-violet-400" />

          {/* Cooldown semanal */}
          <div className="mt-4 bg-purple-950/50 border border-purple-800/60 rounded-xl p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-900/60 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-purple-300 text-sm font-bold mb-0.5">
                Limite: 1 Redação por Semana
              </p>
              <p className="text-purple-300/70 text-xs leading-relaxed">
                Cooldown semanal — você só pode registrar uma redação por
                semana. O limite reseta toda segunda-feira.
              </p>
            </div>
          </div>
        </Card>

        {/* Multiplicador de Facilidade */}
        <Card>
          <CardHeader
            icon={Star}
            title="Multiplicador de Facilidade"
            gradient="from-amber-400 to-yellow-500"
          />
          <p className="text-gray-400 text-xs leading-relaxed mb-4">
            Aplica-se quando você estuda sua{" "}
            <span className="text-amber-400 font-semibold">
              disciplina de maior facilidade
            </span>
            . O multiplicador diminui conforme o tempo acumulado na semana,
            incentivando a diversidade nos estudos.
          </p>

          <div className="flex flex-col gap-0.5">
            {/* Boost */}
            <div className="flex items-center gap-3 py-3 border-b border-gray-800">
              <div className="w-9 h-9 rounded-xl bg-emerald-900/50 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">Boost</p>
                <p className="text-gray-500 text-xs">Até 240 min (4h) na semana</p>
              </div>
              <span className="text-emerald-400 font-black text-lg">×1.5</span>
            </div>
            {/* Normal */}
            <div className="flex items-center gap-3 py-3 border-b border-gray-800">
              <div className="w-9 h-9 rounded-xl bg-blue-900/50 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">Normal</p>
                <p className="text-gray-500 text-xs">De 241 a 480 min (4h–8h)</p>
              </div>
              <span className="text-blue-400 font-black text-lg">×1.0</span>
            </div>
            {/* Fadiga */}
            <div className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-xl bg-red-900/50 flex items-center justify-center shrink-0">
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">Fadiga</p>
                <p className="text-gray-500 text-xs">Acima de 480 min (8h)</p>
              </div>
              <span className="text-red-400 font-black text-lg">×0.5</span>
            </div>
          </div>

          <p className="text-gray-600 text-xs mt-3 pt-3 border-t border-gray-800">
            🗓 O contador de facilidade reinicia toda segunda-feira.
          </p>
        </Card>

        {/* Nota sobre Área de Foco dinâmica */}
        <div className="bg-violet-950/40 border border-dashed border-violet-700/60 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
          <p className="text-gray-300 text-sm leading-relaxed">
            <strong className="text-violet-400">Área de Foco dinâmica:</strong>{" "}
            disciplinas da sua área de foco escolhida no cadastro rendem mais
            pontos em teoria e questões. Mude sua área de foco a qualquer
            momento no seu perfil.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
