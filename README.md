# 📚 Call of Study

> Plataforma de gamificação de estudos para o ENEM — transforme suas sessões de estudo em pontos, compita no ranking e mantenha a consistência com mecânicas anti-exploit.

🔗 **App ao vivo:** [https://call-of-study.web.app](https://call-of-study.web.app)

---

## 🎯 Sobre o Projeto

**Call of Study** é um Progressive Web App (PWA) desenvolvido para um grupo de estudos focado no ENEM. A ideia é simples: cada sessão de estudo gera pontos baseados em regras matemáticas balanceadas, e os membros competem em um ranking semanal.

O sistema foi projetado com **game design anti-exploit** em mente — existem mecanismos que impedem farm de pontos e incentivam diversidade nos estudos.

---

## ✨ Funcionalidades

### 🔐 Autenticação
- Cadastro com e-mail e senha
- Login com Google (OAuth)
- Fluxo de onboarding para novos usuários Google (`/completar-cadastro`)
- Proteção de rotas com `RotaProtegida`

### 🏠 Dashboard
- Card de boas-vindas personalizado com gradiente por Área de Foco
- Pontuação total e minutos de facilidade acumulados na semana
- Badge de multiplicador em tempo real (Boost / Normal / Fadiga)
- CTA direto para lançar uma nova sessão

### 📝 Lançamento de Sessões
Três tipos de atividade com campos específicos:

| Tipo | Campos | Pontuação |
|---|---|---|
| **Teoria** | Disciplina + Minutos | 20–30 pts/h |
| **Questões** | Feitas + Acertos | 2–3 pts/acerto |
| **Redação** | Nota (0–1000) | Nota × 0,3 |

- **Prévia de pontuação** em tempo real antes de salvar
- Indicador de Regra Anti-Chute (taxa de acerto < 40%)
- Cooldown semanal de redação (1 por semana, reseta na segunda-feira)

### 📜 Histórico
- Feed de sessões agrupado por data (Hoje / Ontem / data formatada)
- Detalhes de cada registro: tipo, disciplina, detalhes e pontuação
- Tratamento elegante de índice Firestore ausente com link de criação automática

### 🏆 Ranking
- Pódio visual (2º | 1º | 3º) com barras de altura proporcional
- Lista completa ordenada por pontuação
- Destaque do usuário atual com badge "você"
- Botão de atualização manual

### 📖 Regras de Pontuação
Página estática com todas as regras explicadas de forma visual:
- Cards de Teoria, Questões, Redação e Multiplicador
- Aviso de Regra Anti-Chute
- Card de cooldown semanal da Redação
- Tiers do Multiplicador de Facilidade com ícones e cores

### 👤 Perfil
- Card de identidade com avatar, nome, e-mail e pontuação total
- **Edição de Área de Foco e Disciplina de Facilidade** com cooldown de 30 dias
- Indicador de dias restantes para próxima alteração
- Link para as Regras de Pontuação
- **Zona de Perigo:** exclusão permanente de conta com modal de confirmação

---

## 🎮 Sistema de Gamificação

### Motor Matemático (`src/utils/calculadora.js`)

Todas as regras de negócio estão isoladas em funções JavaScript puras, sem dependências React.

#### Teoria
```
1h — disciplina comum     → 20 pts
1h — Área de Foco         → 30 pts
```

#### Questões
```
Acerto — disciplina comum → +2 pts
Acerto — Área de Foco     → +3 pts

⚠️ Regra Anti-Chute: acertos/feitas < 40% → pontuação ZERO
```

#### Redação
```
Pontuação = Nota × 0.3    (máx 300 pts com nota 1000)
Limite: 1 redação por semana (reseta toda segunda-feira)
```

#### Multiplicador de Facilidade (Fadiga)
Aplica-se quando você estuda a sua **disciplina de maior facilidade**:

| Tier | Condição | Multiplicador |
|---|---|---|
| 🟢 Boost | ≤ 240 min (4h) na semana | **×1.5** |
| 🔵 Normal | 241–480 min (4h–8h) | **×1.0** |
| 🔴 Fadiga | > 480 min (8h) | **×0.5** |

> O contador reseta toda segunda-feira.

### Área de Foco Dinâmica
O bônus de pontuação não é fixo em nenhuma disciplina — ele se aplica dinamicamente a qualquer disciplina da **Área de Foco** que o usuário escolheu no cadastro:

| Área de Foco |
|---|
| Linguagens e Códigos |
| Ciências Humanas |
| Ciências da Natureza |
| Matemática |

---

## 🗄️ Estrutura do Banco de Dados (Firestore)

### Coleção `usuarios/{uid}`
```js
{
  nome: string,
  email: string,
  areaFoco: string,                        // Ex: "Ciências da Natureza"
  disciplinaFacilidade: string,            // Ex: "Biologia"
  pontuacaoTotal: number,
  minutosFacilidadeNestaSemana: number,
  semanaInicio: Timestamp,                 // Início da semana atual (para reset)
  ultimaAlteracaoPerfil: Timestamp,        // Cooldown de 30 dias para edição
}
```

### Coleção `registros_estudo/{id}`
```js
{
  userId: string,
  tipo: "teoria" | "questoes" | "redacao",
  disciplina: string,
  pontos: number,
  data: Timestamp,
  // Campos condicionais por tipo:
  minutos: number,          // teoria
  feitas: number,           // questoes
  acertos: number,          // questoes
  nota: number,             // redacao
}
```

### Índices Firestore necessários
Para o **Histórico** e **Cooldown de Redação** funcionarem, crie os seguintes índices compostos em [Firebase Console → Firestore → Índices](https://console.firebase.google.com/project/call-of-study/firestore/indexes):

| Coleção | Campos | Escopo |
|---|---|---|
| `registros_estudo` | `userId` ASC, `data` DESC | Coleção |
| `registros_estudo` | `userId` ASC, `tipo` ASC, `data` ASC | Coleção |

> 💡 Se o índice estiver faltando, o app mostrará um link direto para criá-lo automaticamente.

---

## 🗂️ Estrutura do Projeto

```
src/
├── components/
│   ├── BottomNav.jsx       # Navegação inferior fixa (PWA-style)
│   └── RotaProtegida.jsx   # HOC de proteção de rotas autenticadas
├── contexts/
│   └── AuthContext.jsx     # Contexto global de autenticação (Firebase Auth)
├── pages/
│   ├── Login.jsx           # Login com e-mail/senha e Google
│   ├── Cadastro.jsx        # Cadastro com e-mail/senha
│   ├── CompletarCadastro.jsx  # Onboarding para novos usuários Google
│   ├── Dashboard.jsx       # Tela inicial pós-login
│   ├── Lancamento.jsx      # Formulário de lançamento de sessão
│   ├── Historico.jsx       # Feed de sessões passadas
│   ├── Ranking.jsx         # Ranking global com pódio
│   ├── Criterios.jsx       # Regras de pontuação (estática)
│   └── Perfil.jsx          # Perfil do usuário + configurações + exclusão
├── services/
│   └── firebase.js         # Inicialização e exports do Firebase
├── utils/
│   └── calculadora.js      # Motor matemático puro (sem React)
└── App.jsx                 # Roteamento principal
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | [React 19](https://react.dev/) + [Vite 8](https://vite.dev/) |
| Estilização | [Tailwind CSS v4](https://tailwindcss.com/) |
| Ícones | [Lucide React](https://lucide.dev/) |
| Roteamento | [React Router DOM v7](https://reactrouter.com/) |
| Autenticação | [Firebase Auth](https://firebase.google.com/docs/auth) |
| Banco de Dados | [Cloud Firestore](https://firebase.google.com/docs/firestore) |
| Hospedagem | [Firebase Hosting](https://firebase.google.com/docs/hosting) |

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta no [Firebase](https://firebase.google.com/)

### 1. Clone o repositório
```bash
git clone <url-do-repo>
cd "Projeto Grupo de Estudos"
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto com as chaves do seu projeto Firebase:

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_FIREBASE_MEASUREMENT_ID=seu_measurement_id
```

> As chaves estão no Firebase Console → Configurações do Projeto → Seus apps.

### 4. Habilite os serviços no Firebase Console
- **Authentication:** ative os provedores Email/Senha e Google
- **Firestore:** crie o banco de dados no modo produção
- **Hosting:** ative para deploy

### 5. Rode o servidor de desenvolvimento
```bash
npm run dev
```

O app estará disponível em `http://localhost:5173`.

---

## 📦 Deploy

```bash
# Build de produção
npm run build

# Deploy no Firebase Hosting
firebase deploy
```

---

## 🔒 Segurança & Game Design

- **Anti-exploit de questões:** pontos apenas por acertos (não por questões feitas)
- **Regra Anti-Chute:** taxa de acerto < 40% zera toda a pontuação da bateria
- **Cooldown de Redação:** máximo 1 redação por semana por usuário
- **Fadiga de Facilidade:** o multiplicador ×1.5 diminui progressivamente conforme o tempo semanal acumulado
- **Cooldown de Perfil:** área de foco e disciplina de facilidade só podem ser alteradas a cada 30 dias
- **Exclusão de conta segura:** dados do Firestore são deletados antes da conta Auth (evita dados órfãos)

---

## 📝 Licença

Este projeto é de uso privado do grupo de estudos.
