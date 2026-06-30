/**
 * Script de migração — Call of Study
 * Recalcula pontos de todos os registros_estudo com base no novo sistema de dificuldade.
 * Uso: npm run migrar-pontos
 *
 * Requer: serviceAccount.json na raiz do projeto.
 * ATENÇÃO: execute APENAS UMA VEZ em produção. Faça backup antes.
 *
 * Como obter o serviceAccount.json:
 *   Firebase Console > Configurações do projeto > Contas de serviço
 *   > Gerar nova chave privada
 *   Coloque o arquivo na raiz do projeto (NÃO commite — já está no .gitignore).
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

// ── Configuração ─────────────────────────────────────────────────────────────
const serviceAccount = JSON.parse(readFileSync("./serviceAccount.json", "utf8"));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Lógica de pontuação (espelhada de calculadora.js) ────────────────────────
const MULTIPLICADORES_DIFICULDADE = { facil: 0.7, medio: 1.0, dificil: 1.5 };

const AREA_DISCIPLINAS = {
  "Linguagens e Códigos": [
    "Língua Portuguesa", "Literatura", "Língua Inglesa", "Língua Espanhola",
    "Artes", "Educação Física", "Tecnologias da Informação",
  ],
  "Ciências Humanas":    ["História", "Geografia", "Filosofia", "Sociologia"],
  "Ciências da Natureza": ["Biologia", "Química", "Física"],
  "Matemática":           ["Matemática"],
};

function isDaAreaFoco(disciplina, areaFoco) {
  return (AREA_DISCIPLINAS[areaFoco] ?? []).includes(disciplina);
}

function isAntiChute(feitas, acertos) {
  if (!feitas || feitas === 0) return false;
  return acertos / feitas < 0.40;
}

function recalcularPontos(registro, usuario) {
  const { tipo, disciplina, minutos, feitas, acertos, nota, tempo, dificuldade } = registro;
  const { areaFoco } = usuario;
  const foco = isDaAreaFoco(disciplina, areaFoco);

  if (tipo === "teoria") {
    return Math.round((minutos / 60) * (foco ? 30 : 20));
  }

  if (tipo === "questoes") {
    if (isAntiChute(feitas, acertos)) return 0;
    // Registros sem campo dificuldade usam "medio" por retrocompatibilidade
    const mult = MULTIPLICADORES_DIFICULDADE[dificuldade ?? "medio"];
    const base = acertos * (foco ? 3 : 2);
    return Math.round(base * mult);
  }

  if (tipo === "redacao") {
    let multTempo = 1.0;
    if (tempo < 45)        multTempo = 1.4;
    else if (tempo < 60)   multTempo = 1.2;
    else if (tempo <= 80)  multTempo = 1.0;
    else if (tempo <= 100) multTempo = 0.9;
    else                   multTempo = 0.8;
    return Math.round((nota * 0.3) * multTempo);
  }

  // Fallback: mantém o valor original para tipos desconhecidos
  return registro.pontos ?? 0;
}

// ── Migração ─────────────────────────────────────────────────────────────────
async function migrar() {
  console.log("🔄 Iniciando migração de pontos...\n");

  // 1. Carrega todos os usuários
  const usuariosSnap = await db.collection("usuarios").get();
  const usuarios = {};
  usuariosSnap.forEach((doc) => { usuarios[doc.id] = doc.data(); });
  console.log(`✅ ${Object.keys(usuarios).length} usuários carregados`);

  // 2. Carrega todos os registros de estudo
  const registrosSnap = await db.collection("registros_estudo").get();
  const registros = [];
  registrosSnap.forEach((doc) => { registros.push({ id: doc.id, ...doc.data() }); });
  console.log(`✅ ${registros.length} registros carregados\n`);

  // 3. Recalcula pontos e agrupa totais por usuário
  const pontosNovosPorUsuario = {};
  const atualizacoesRegistros = []; // [{ ref, pontos }]

  for (const registro of registros) {
    const usuario = usuarios[registro.userId];
    if (!usuario) {
      console.warn(`⚠️  Usuário ${registro.userId} não encontrado — registro ${registro.id} ignorado`);
      continue;
    }

    const pontosNovos = recalcularPontos(registro, usuario);
    atualizacoesRegistros.push({
      ref: db.collection("registros_estudo").doc(registro.id),
      pontos: pontosNovos,
    });

    pontosNovosPorUsuario[registro.userId] =
      (pontosNovosPorUsuario[registro.userId] ?? 0) + pontosNovos;
  }

  console.log(`📊 Pontuações recalculadas para ${Object.keys(pontosNovosPorUsuario).length} usuários`);

  // 4. Grava em batches atômicos (máx 500 operações por batch — usamos 400 por margem)
  const BATCH_SIZE = 400;
  let batchAtual = db.batch();
  let contadorBatch = 0;
  let totalOperacoes = 0;

  const commitBatchSeNecessario = async () => {
    if (contadorBatch >= BATCH_SIZE) {
      await batchAtual.commit();
      console.log(`  → Batch commitado (${totalOperacoes} operações até agora)`);
      batchAtual = db.batch();
      contadorBatch = 0;
    }
  };

  // Atualiza pontos de cada registro
  for (const { ref, pontos } of atualizacoesRegistros) {
    batchAtual.update(ref, { pontos });
    contadorBatch++;
    totalOperacoes++;
    await commitBatchSeNecessario();
  }

  // Atualiza pontuacaoTotal de cada usuário
  for (const [uid, total] of Object.entries(pontosNovosPorUsuario)) {
    batchAtual.update(db.collection("usuarios").doc(uid), { pontuacaoTotal: total });
    contadorBatch++;
    totalOperacoes++;
    await commitBatchSeNecessario();
  }

  // Commit final (operações restantes)
  if (contadorBatch > 0) {
    await batchAtual.commit();
    console.log(`  → Batch final commitado`);
  }

  console.log(`\n✅ Migração concluída! ${totalOperacoes} operações no total.`);
  console.log(`   Registros atualizados: ${atualizacoesRegistros.length}`);
  console.log(`   Usuários com pontuação recalculada: ${Object.keys(pontosNovosPorUsuario).length}`);
}

migrar().catch((err) => {
  console.error("❌ Erro durante a migração:", err);
  process.exit(1);
});
