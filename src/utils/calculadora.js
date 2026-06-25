/**
 * Motor Matemático — Call of Study
 * Funções JavaScript puras, sem dependências React.
 */

/**
 * Verifica se a disciplina pertence à Área de Foco do usuário.
 * O bônus agora é dinâmico: qualquer matéria da areaFoco recebe peso especial.
 *
 * @param {string} disciplina - Disciplina que está sendo estudada
 * @param {string} areaFoco - Área de foco salva no perfil do usuário
 */

/** Mapa de disciplinas por área (espelho de Lancamento.jsx para cálculo) */
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

/**
 * Retorna true se a disciplina pertence à área de foco do usuário.
 * @param {string} disciplina
 * @param {string} areaFoco
 */
export function isDaAreaFoco(disciplina, areaFoco) {
  if (!disciplina || !areaFoco) return false;
  const discs = DISCIPLINAS_POR_AREA[areaFoco] || [];
  return discs.includes(disciplina);
}

/** @deprecated Use isDaAreaFoco — mantido só para compatibilidade */
export function isEspecial(disciplina, areaFoco) {
  return isDaAreaFoco(disciplina, areaFoco);
}

/**
 * Regra Anti-Chute: retorna true se a taxa de acerto for < 40%.
 * @param {number} feitas - Questões feitas
 * @param {number} acertos - Questões acertadas
 */
export function isAntiChute(feitas, acertos) {
  if (!feitas || feitas <= 0) return false;
  return acertos / feitas < 0.4;
}

/**
 * Calcula os pontos base SEM o multiplicador de facilidade.
 * @param {"teoria"|"questoes"|"redacao"} tipo
 * @param {{ disciplina: string, minutos?: number, feitas?: number, acertos?: number, nota?: number }} dados
 * @param {string} areaFoco - Área de foco do usuário (do Firestore)
 * @returns {number}
 */
export function calcularPontosBase(tipo, dados, areaFoco = "") {
  const foco = isDaAreaFoco(dados.disciplina, areaFoco);

  switch (tipo) {
    case "teoria": {
      // 1h comum = 20 pts | 1h da Área de Foco = 30 pts
      const horas = (dados.minutos || 0) / 60;
      return horas * (foco ? 30 : 20);
    }
    case "questoes": {
      const feitas = dados.feitas || 0;
      const acertos = dados.acertos || 0;
      if (feitas === 0) return 0;
      // Regra Anti-Chute: taxa < 40% → pontuação ZERO
      if (isAntiChute(feitas, acertos)) return 0;
      // Pontuação apenas por ACERTO (sem ponto por questão feita)
      // Acerto comum = +2 pts | Acerto da Área de Foco = +3 pts
      return acertos * (foco ? 3 : 2);
    }
    case "redacao": {
      // Nota * 0.3 (Max 300 pts) — sujeito a cooldown semanal
      return (dados.nota || 0) * 0.3;
    }
    default:
      return 0;
  }
}

/**
 * Calcula o multiplicador de facilidade e o tier atual.
 * @param {string} disciplina - Disciplina que está sendo estudada
 * @param {string} disciplinaFacilidade - Disciplina de facilidade do usuário
 * @param {number} minutosFacilidadeNestaSemana - Minutos acumulados esta semana
 * @returns {{ multiplicador: number, tier: "boost"|"normal"|"fadiga"|null }}
 */
export function calcularMultiplicador(
  disciplina,
  disciplinaFacilidade,
  minutosFacilidadeNestaSemana
) {
  if (!disciplinaFacilidade || disciplina !== disciplinaFacilidade) {
    return { multiplicador: 1, tier: null };
  }
  const min = minutosFacilidadeNestaSemana || 0;
  // Tiers atualizados: Boost (≤240 min / 4h) | Normal (241–480 min / 8h) | Fadiga (>480 min)
  if (min <= 240) return { multiplicador: 1.5, tier: "boost" };
  if (min <= 480) return { multiplicador: 1.0, tier: "normal" };
  return { multiplicador: 0.5, tier: "fadiga" };
}

/**
 * Calcula a pontuação final aplicando o multiplicador de facilidade.
 * @param {"teoria"|"questoes"|"redacao"} tipo
 * @param {{ disciplina: string, minutos?: number, feitas?: number, acertos?: number, nota?: number }} dados
 * @param {string} areaFoco - Área de foco do usuário
 * @param {string} disciplinaFacilidade - Disciplina de facilidade do usuário
 * @param {number} minutosFacilidadeNestaSemana
 * @returns {number} Pontuação final arredondada
 */
export function calcularPontos(
  tipo,
  dados,
  areaFoco,
  disciplinaFacilidade,
  minutosFacilidadeNestaSemana
) {
  const base = calcularPontosBase(tipo, dados, areaFoco);
  const { multiplicador } = calcularMultiplicador(
    dados.disciplina,
    disciplinaFacilidade,
    minutosFacilidadeNestaSemana
  );
  return Math.round(base * multiplicador);
}

/**
 * Retorna a data de início da semana atual (segunda-feira às 00:00:00).
 * @returns {Date}
 */
export function getInicioSemanaAtual() {
  const d = new Date();
  const day = d.getDay(); // 0=Dom, 1=Seg, ..., 6=Sab
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  return monday;
}
