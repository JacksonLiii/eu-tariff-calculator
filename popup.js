const HISTORY_KEY = 'landedCostHistory';
const MAX_HISTORY = 20;

const COUNTRY_NAMES = {
  DE: '德国 DE',
  FR: '法国 FR',
  IT: '意大利 IT',
  ES: '西班牙 ES',
  NL: '荷兰 NL',
};

function loadHistory(callback) {
  chrome.storage.local.get([HISTORY_KEY], (data) => {
    callback(data[HISTORY_KEY] || []);
  });
}

function saveHistoryEntry(entry) {
  loadHistory((history) => {
    history.unshift(entry);
    if (history.length > MAX_HISTORY) {
      history = history.slice(0, MAX_HISTORY);
    }
    chrome.storage.local.set({ [HISTORY_KEY]: history }, () => {
      renderHistory(history);
    });
  });
}

function formatTime(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderHistory(history) {
  const listEl = document.getElementById('historyList');
  listEl.innerHTML = '';

  if (!history || history.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'historyEmpty';
    empty.textContent = '暂无历史记录';
    listEl.appendChild(empty);
    return;
  }

  history.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'historyItem';

    const time = document.createElement('span');
    time.className = 'historyTime';
    time.textContent = formatTime(entry.timestamp);

    const main = document.createElement('span');
    main.className = 'historyMain';
    const countryLabel = COUNTRY_NAMES[entry.countryCode] || entry.countryCode;
    main.textContent = `${countryLabel} · €${entry.declaredValue} · 总€${entry.total.toFixed(2)}`;

    item.appendChild(time);
    item.appendChild(main);
    listEl.appendChild(item);
  });
}

document.getElementById('calcBtn').addEventListener('click', function () {
  const declaredValueInput = document.getElementById('declaredValue');
  const categoryCountInput = document.getElementById('categoryCount');
  const countryCode = document.getElementById('countryCode').value;

  const declaredValue = parseFloat(declaredValueInput.value);
  const categoryCount = parseInt(categoryCountInput.value, 10) || 1;

  const errorEl = document.getElementById('error');
  const resultEl = document.getElementById('result');

  if (!declaredValue || declaredValue <= 0) {
    errorEl.textContent = '请输入大于0的申报价值';
    errorEl.style.display = 'block';
    resultEl.style.display = 'none';
    return;
  }

  errorEl.style.display = 'none';

  const result = calculateLandedCost({ declaredValue, categoryCount, countryCode });

  document.getElementById('rDuty').textContent = '€' + result.duty.toFixed(2);
  document.getElementById('rVat').textContent = '€' + result.vat.toFixed(2);
  document.getElementById('rTotal').textContent = '€' + result.totalLandedCost.toFixed(2);
  document.getElementById('rPct').textContent = (result.additionalCostPercentage * 100).toFixed(0) + '%';

  resultEl.style.display = 'block';

  saveHistoryEntry({
    declaredValue,
    categoryCount,
    countryCode,
    duty: result.duty,
    vat: result.vat,
    total: result.totalLandedCost,
    pct: result.additionalCostPercentage,
    timestamp: new Date().toISOString(),
  });
});

document.getElementById('historyToggle').addEventListener('click', function () {
  const body = document.getElementById('historyBody');
  const icon = document.getElementById('historyToggleIcon');
  const expanded = body.style.display === 'block';
  body.style.display = expanded ? 'none' : 'block';
  icon.textContent = expanded ? '▸' : '▾';
});

document.getElementById('clearHistoryBtn').addEventListener('click', function () {
  if (confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
    chrome.storage.local.set({ [HISTORY_KEY]: [] }, () => {
      renderHistory([]);
    });
  }
});

loadHistory(renderHistory);
