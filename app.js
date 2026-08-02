const STORAGE_KEY = 'palgear-resource-counter-v3';
const ACTION_COOLDOWN_MS = 100;

const defaultState = () => ({
  hp: 10,
  food: 0,
  material: 0,
  souls: [],
});

let state = normalizeState(loadState());

const hpValue = document.getElementById('hpValue');
const hpMinus = document.getElementById('hpMinus');
const hpPlus = document.getElementById('hpPlus');

const foodValue = document.getElementById('foodValue');
const foodMinus = document.getElementById('foodMinus');
const foodPlus = document.getElementById('foodPlus');

const materialValue = document.getElementById('materialValue');
const materialMinus = document.getElementById('materialMinus');
const materialPlus = document.getElementById('materialPlus');

const soulDrawButton = document.getElementById('soulDrawButton');
const soulReturnButton = document.getElementById('soulReturnButton');
const soulCount = document.getElementById('soulCount');
const soulZone = document.getElementById('soulZone');
const spendSoulButton = document.getElementById('spendSoulButton');
const standSoulButton = document.getElementById('standSoulButton');
const turnStartButton = document.getElementById('turnStartButton');

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return defaultState();
  }

  try {
    return {
      ...defaultState(),
      ...JSON.parse(saved),
    };
  } catch {
    return defaultState();
  }
}

function normalizeState(rawState) {
  return {
    hp: Math.max(0, Number(rawState.hp) || 0),
    food: Math.max(0, Number(rawState.food) || 0),
    material: Math.max(0, Number(rawState.material) || 0),
    souls: Array.isArray(rawState.souls) ? rawState.souls : [],
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  state = normalizeState(state);

  hpValue.textContent = state.hp;
  foodValue.textContent = state.food;
  materialValue.textContent = state.material;

  renderSouls();
  renderSoulDeck();
  saveState();
}

function renderSouls() {
  soulZone.innerHTML = '';

  state.souls.forEach((soul, index) => {
    const card = document.createElement('button');
    card.className = `soul-card ${soul.tapped ? 'tapped' : ''}`;
    card.setAttribute('aria-label', `ソウル${index + 1}`);

    card.addEventListener('click', () => {
      soul.tapped = !soul.tapped;
      render();
    });

    soulZone.appendChild(card);
  });
}

function renderSoulDeck() {
  const available = state.souls.filter((soul) => !soul.tapped).length;
  const total = state.souls.length;

  soulCount.textContent = `${available}/${total}`;
}

function addSoul() {
  if (state.souls.length >= 10) return;

  state.souls.push({
    tapped: false,
  });

  render();
}

function returnSoul() {
  if (state.souls.length <= 0) return;

  const lastAvailableIndex = findLastIndex(state.souls, (soul) => !soul.tapped);
  const removeIndex =
    lastAvailableIndex >= 0 ? lastAvailableIndex : state.souls.length - 1;

  state.souls.splice(removeIndex, 1);
  render();
}

function spendSoul() {
  const index = state.souls.findIndex((soul) => !soul.tapped);
  if (index < 0) return;

  state.souls[index].tapped = true;
  render();
}

function standSoul() {
  const index = findLastIndex(state.souls, (soul) => soul.tapped);
  if (index < 0) return;

  state.souls[index].tapped = false;
  render();
}

function standAllSouls() {
  state.souls = state.souls.map((soul) => ({
    ...soul,
    tapped: false,
  }));

  render();
}

function findLastIndex(array, predicate) {
  for (let i = array.length - 1; i >= 0; i -= 1) {
    if (predicate(array[i], i, array)) {
      return i;
    }
  }

  return -1;
}

function runWithCooldown(button, action) {
  if (button.dataset.cooldown === '1') {
    return;
  }

  button.dataset.cooldown = '1';
  action();

  window.setTimeout(() => {
    button.dataset.cooldown = '0';
  }, ACTION_COOLDOWN_MS);
}

function changeCounter(key, amount) {
  state[key] = Math.max(0, (Number(state[key]) || 0) + amount);
  render();
}

hpMinus.addEventListener('click', () => {
  runWithCooldown(hpMinus, () => changeCounter('hp', -1));
});

hpPlus.addEventListener('click', () => {
  runWithCooldown(hpPlus, () => changeCounter('hp', 1));
});

foodMinus.addEventListener('click', () => {
  runWithCooldown(foodMinus, () => changeCounter('food', -1));
});

foodPlus.addEventListener('click', () => {
  runWithCooldown(foodPlus, () => changeCounter('food', 1));
});

materialMinus.addEventListener('click', () => {
  runWithCooldown(materialMinus, () => changeCounter('material', -1));
});

materialPlus.addEventListener('click', () => {
  runWithCooldown(materialPlus, () => changeCounter('material', 1));
});

soulDrawButton.addEventListener('click', () => {
  runWithCooldown(soulDrawButton, addSoul);
});

soulReturnButton.addEventListener('click', () => {
  runWithCooldown(soulReturnButton, returnSoul);
});

spendSoulButton.addEventListener('click', () => {
  runWithCooldown(spendSoulButton, spendSoul);
});

standSoulButton.addEventListener('click', () => {
  runWithCooldown(standSoulButton, standSoul);
});

turnStartButton.addEventListener('click', () => {
  runWithCooldown(turnStartButton, standAllSouls);
});

render();
