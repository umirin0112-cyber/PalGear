const STORAGE_KEY = 'palgear-helper-clean-v3';

const ACTION_COOLDOWN_MS = 100;

const defaultState = () => ({
  hp: 10,
  pals: Array.from({ length: 5 }, () => ({
    power: 0,
    lockedPower: 0,
  })),
  souls: [],
});

let state = loadState();

const hpValue = document.getElementById('hpValue');
const hpMinus = document.getElementById('hpMinus');
const hpPlus = document.getElementById('hpPlus');
const turnEndButton = document.getElementById('turnEndButton');

const soulDrawButton = document.getElementById('soulDrawButton');
const soulReturnButton = document.getElementById('soulReturnButton');
const soulCount = document.getElementById('soulCount');
const soulZone = document.getElementById('soulZone');
const spendSoulButton = document.getElementById('spendSoulButton');

const palArea = document.getElementById('palArea');

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return defaultState();
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      ...defaultState(),
      ...parsed,
    };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  hpValue.textContent = state.hp;
  renderPals();
  renderSouls();
  renderSoulDeck();
  saveState();
}

function renderPals() {
  palArea.innerHTML = '';

  state.pals.forEach((pal, index) => {
    const slot = document.createElement('article');
    slot.className = 'pal-slot';

    slot.innerHTML = `
      <div class="power-main">
        <div class="power-icon">⚔</div>
        <select class="power-select">
          ${createPowerOptions(pal.power)}
        </select>
      </div>

      <div class="pal-buttons">
        <div class="power-adjust-buttons">
          <button class="minus-button">-</button>
          <button class="plus-button">+</button>
        </div>
        <button class="lock-button ${isLocked(pal) ? 'locked' : ''}">🔒</button>
        <button class="delete-button">×</button>
      </div>
    `;

    const powerSelect = slot.querySelector('.power-select');

    powerSelect.addEventListener('change', () => {
      pal.power = Number(powerSelect.value) || 0;
      render();
    });

    slot.querySelector('.minus-button').addEventListener('click', () => {
      changePower(pal, -1);
    });

    slot.querySelector('.plus-button').addEventListener('click', () => {
      changePower(pal, 1);
    });

    const lockButton = slot.querySelector('.lock-button');
    lockButton.addEventListener('click', () => {
      runWithCooldown(lockButton, () => {
        pal.lockedPower = Number(pal.power) || 0;
        render();
      });
    });

    slot.querySelector('.delete-button').addEventListener('click', () => {
      const ok = confirm(`パル${index + 1}の情報を削除しますか？`);
      if (!ok) return;

      state.pals[index] = {
        power: 0,
        lockedPower: 0,
      };

      render();
    });

    palArea.appendChild(slot);
  });
}

function isLocked(pal) {
  return (
    Number(pal.lockedPower) === Number(pal.power) &&
    Number(pal.lockedPower) > 0
  );
}

function createPowerOptions(currentPower) {
  const current = Number(currentPower) || 0;
  let html = '';

  for (let value = 0; value <= 2000; value += 100) {
    const selected = value === current ? 'selected' : '';
    html += `<option value="${value}" ${selected}>${value}</option>`;
  }

  return html;
}

function changePower(pal, sign) {
  const raw = prompt(sign > 0 ? '加算する数値' : '減算する数値', '100');
  if (raw === null) return;

  const value = Number(raw);
  if (!Number.isFinite(value)) return;

  pal.power = (Number(pal.power) || 0) + value * sign;
  render();
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

function turnEnd() {
  state.pals = state.pals.map((pal) => ({
    ...pal,
    power: Number(pal.lockedPower) || 0,
  }));

  state.souls = state.souls.map((soul) => ({
    ...soul,
    tapped: false,
  }));

  render();
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

hpMinus.addEventListener('click', () => {
  runWithCooldown(hpMinus, () => {
    state.hp -= 1;
    render();
  });
});

hpPlus.addEventListener('click', () => {
  runWithCooldown(hpPlus, () => {
    state.hp += 1;
    render();
  });
});

turnEndButton.addEventListener('click', () => {
  runWithCooldown(turnEndButton, turnEnd);
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

render();