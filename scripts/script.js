const board = document.getElementById("board");
const startBtn = document.getElementById("startBtn");
const replayBtn = document.getElementById("replayBtn");
const moveCounterEl = document.getElementById("moveCounter");
const pairsCounterEl = document.getElementById("pairsCounter");
const messageEl = document.getElementById("message");
const gridSelect = document.getElementById("gridSize");
const winsEl = document.getElementById("wins");
const lossesEl = document.getElementById("losses");
const twoPlayerChk = document.getElementById("twoPlayer");
const turnInfo = document.getElementById("turnInfo");
const soundToggle = document.getElementById("soundToggle");
const flipSound = new Audio("audio/flip.mp3");
let soundEnabled = localStorage.getItem("mc_soundEnabled") !== "false";

let state = {
  pairs: 8,
  colors: [],
  firstCard: null,
  secondCard: null,
  lock: false,
  moves: 0,
  matched: 0,
  twoPlayer: false,
  currentPlayer: 1,
  scores: { 1: 0, 2: 0 },
  gamesPlayed: 0,
};

function loadSessionCounts() {
  const wins = sessionStorage.getItem("mc_wins") || "0";
  const losses = sessionStorage.getItem("mc_losses") || "0";
  const games = sessionStorage.getItem("mc_games") || "0";
  winsEl.textContent = wins;
  lossesEl.textContent = losses;
  state.gamesPlayed = Number(games);
}

function saveSessionCounts(wins, losses, games) {
  sessionStorage.setItem("mc_wins", String(wins));
  sessionStorage.setItem("mc_losses", String(losses));
  sessionStorage.setItem("mc_games", String(games));
}

function generateColors(n) {
  const colors = [];
  for (let i = 0; i < n; i++) {
    const hue = Math.round(((i * 360) / n) % 360);
    colors.push(`hsl(${hue}, 80%, 55%)`);
  }
  return colors;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function buildBoard(pairCount) {
  board.innerHTML = "";
  state.pairs = pairCount;
  board.setAttribute("data-pairs", String(pairCount));

  const colors = generateColors(pairCount);
  const deck = shuffle([...colors, ...colors]);

  deck.forEach((color, idx) => {
    const card = document.createElement("button");
    card.className = "card";
    card.type = "button";
    card.dataset.color = color;
    card.dataset.index = idx;
    card.setAttribute("aria-label", "Face-down card");

    const inner = document.createElement("div");
    inner.className = "card-inner";

    const front = document.createElement("div");
    front.className = "card-face card-front";
    front.innerHTML = '<span class="label">?</span>';

    const back = document.createElement("div");
    back.className = "card-face card-back";
    back.style.background = `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 60%, black))`;

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    card.addEventListener("click", onCardClick);
    board.appendChild(card);
  });

  state.firstCard = null;
  state.secondCard = null;
  state.lock = false;
  state.moves = 0;
  state.matched = 0;
  state.scores = { 1: 0, 2: 0 };
  moveCounterEl.textContent = "0";
  pairsCounterEl.textContent = String(pairCount);
  messageEl.textContent = "";
  turnInfo.textContent = state.twoPlayer ? `Player 1's turn` : "";
  replayBtn.disabled = false;
}

function onCardClick(e) {
  if (state.lock) return;
  const card = e.currentTarget;
  if (card.classList.contains("flipped") || card.disabled) return;

  flip(card);

  if (!state.firstCard) {
    state.firstCard = card;
    card.classList.add("reveal");
    return;
  }

  state.secondCard = card;
  card.classList.add("reveal");
  state.lock = true;

  state.moves++;
  moveCounterEl.textContent = String(state.moves);

  checkMatch();
}

function flip(card) {
  card.classList.add("flipped");
  card.setAttribute("aria-label", "Face-up card");
  if (soundEnabled) {
    flipSound.play();
  }
}

function unflip(card) {
  card.classList.remove("flipped");
  card.setAttribute("aria-label", "Face-down card");
}

function checkMatch() {
  const c1 = state.firstCard.dataset.color;
  const c2 = state.secondCard.dataset.color;

  if (c1 === c2) {
    state.matched++;
    state.firstCard.disabled = true;
    state.secondCard.disabled = true;

    if (state.twoPlayer) {
      state.scores[state.currentPlayer]++;
      turnInfo.textContent = `Player ${state.currentPlayer} found a pair!`;
    }

    state.firstCard = null;
    state.secondCard = null;
    state.lock = false;

    if (state.matched === state.pairs) {
      const winnerText = state.twoPlayer
        ? determineWinnerText()
        : "You won! 🎉";
      messageEl.textContent = winnerText;
      replayBtn.disabled = false;
      updateSessionResult(true);
    }
  } else {
    setTimeout(() => {
      unflip(state.firstCard);
      unflip(state.secondCard);
      state.firstCard = null;
      state.secondCard = null;
      state.lock = false;

      if (state.twoPlayer) {
        state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
        turnInfo.textContent = `Player ${state.currentPlayer}'s turn`;
      }

      const limit = state.pairs * 6;
      if (state.moves >= limit) {
        messageEl.textContent = "You lost — try again!";
        replayBtn.disabled = false;
        updateSessionResult(false);
        Array.from(board.querySelectorAll(".card")).forEach(
          (c) => (c.disabled = true),
        );
      }
    }, 700);
  }
}

function determineWinnerText() {
  const s1 = state.scores[1];
  const s2 = state.scores[2];
  if (s1 === s2) return `Tie! ${s1}–${s2}`;
  const winner = s1 > s2 ? 1 : 2;
  return `Player ${winner} wins ${s1}–${s2} 🎉`;
}

function updateSessionResult(win) {
  const wins = Number(sessionStorage.getItem("mc_wins") || "0");
  const losses = Number(sessionStorage.getItem("mc_losses") || "0");
  state.gamesPlayed++;

  if (win) {
    saveSessionCounts(wins + 1, losses, state.gamesPlayed);
  } else {
    saveSessionCounts(wins, losses + 1, state.gamesPlayed);
  }
  loadSessionCounts();
}

function replay() {
  state.currentPlayer = 1;
  state.scores = { 1: 0, 2: 0 };
  buildBoard(state.pairs);
}

startBtn.addEventListener("click", () => {
  state.twoPlayer = twoPlayerChk.checked;
  state.currentPlayer = 1;
  state.scores = { 1: 0, 2: 0 };
  buildBoard(Number(gridSelect.value));
  messageEl.textContent = "";
  turnInfo.textContent = state.twoPlayer ? `Player 1's turn` : "";
});
soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.innerHTML = soundEnabled ? "🔊" : "🔇";
  localStorage.setItem("mc_soundEnabled", String(soundEnabled));
});

replayBtn.addEventListener("click", replay);

board.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    const active = document.activeElement;
    if (active && active.classList.contains("card")) active.click();
  }
});
soundToggle.innerHTML = soundEnabled ? "🔊" : "🔇";

loadSessionCounts();
buildBoard(Number(gridSelect.value));
