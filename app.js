/* ─── STATE ─── */
let fieldCounter = 0;
let lastRawOutput = '';
let isGenerating = false;
let serpData = [];
let selectedIntent = '';

/* ─── DOM REFS ─── */
const fieldsContainer = document.getElementById('fieldsContainer');
const addFieldBtn     = document.getElementById('addFieldBtn');
const generateBtn     = document.getElementById('generateBtn');
const genText         = document.getElementById('genText');
const genIcon         = document.getElementById('genIcon');

const settingsBtn     = document.getElementById('settingsBtn');
const settingsPanel   = document.getElementById('settingsPanel');
const apiKeyInput     = document.getElementById('apiKeyInput');
const modelSelect     = document.getElementById('modelSelect');
const saveSettings    = document.getElementById('saveSettings');
const toggleApiKey    = document.getElementById('toggleApiKey');
const eyeShow         = document.getElementById('eyeShow');
const eyeHide         = document.getElementById('eyeHide');

const toneSelect      = document.getElementById('toneSelect');
const languageSelect  = document.getElementById('languageSelect');

const emptyState      = document.getElementById('emptyState');
const loadingState    = document.getElementById('loadingState');
const loadingStep     = document.getElementById('loadingStep');
const contentState    = document.getElementById('contentState');
const contentOutput   = document.getElementById('contentOutput');
const outputActions   = document.getElementById('outputActions');
const copyBtn         = document.getElementById('copyBtn');
const regenerateBtn   = document.getElementById('regenerateBtn');
const outputMeta      = document.getElementById('outputMeta');
const outputTime      = document.getElementById('outputTime');

const snackbar        = document.getElementById('snackbar');
const snackIcon       = document.getElementById('snackIcon');
const snackMsg        = document.getElementById('snackMsg');

/* ─── INIT ─── */
function init() {
  loadSettings();
  addField('text');

  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });

  saveSettings.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    localStorage.setItem(`pc_api_key_${currentProvider}`, key);
    localStorage.setItem(`pc_model_${currentProvider}`, modelSelect.value);
    const gKey = document.getElementById('googleApiKeyInput').value.trim();
    const gCx  = document.getElementById('googleCxInput').value.trim();
    if (gKey) localStorage.setItem('pc_google_key', gKey);
    if (gCx)  localStorage.setItem('pc_google_cx',  gCx);
    settingsPanel.classList.add('hidden');
    showToast('✓', 'تنظیمات ذخیره شد');
    testApiKey(key, currentProvider);
    updateSerpHint();
  });

  toggleApiKey.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    eyeShow.classList.toggle('hidden', !isPassword);
    eyeHide.classList.toggle('hidden', isPassword);
  });

  addFieldBtn.addEventListener('click', () => showFieldPicker());

  generateBtn.addEventListener('click', handleGenerate);
  regenerateBtn.addEventListener('click', handleGenerate);

  copyBtn.addEventListener('click', () => {
    if (!lastRawOutput) return;
    navigator.clipboard.writeText(lastRawOutput).then(() => {
      showToast('✓', 'محتوا کپی شد');
    });
  });

  document.querySelectorAll('#contentTypesContainer .md-chip').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });

  document.getElementById('serpSearchBtn').addEventListener('click', () => {
    const q = document.getElementById('serpQueryInput').value.trim();
    if (q) searchGoogle(q);
    else showToast('⚠', 'یک کلیدواژه وارد کنید');
  });

  document.getElementById('serpQueryInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      if (q) searchGoogle(q);
    }
  });

  document.getElementById('serpToggleBtn').addEventListener('click', () => {
    const list  = document.getElementById('serpList');
    const label = document.getElementById('serpToggleLabel');
    const shown = !list.classList.contains('hidden');
    list.classList.toggle('hidden', shown);
    label.textContent = shown ? 'نمایش عناوین برتر' : 'بستن عناوین';
  });

  document.querySelectorAll('#intentChips .md-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#intentChips .md-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedIntent = btn.dataset.intent;
    });
  });
}

/* ─── PROVIDER ─── */
const PROVIDERS = {
  claude: {
    label: 'Claude (Anthropic)',
    keyPlaceholder: 'sk-ant-api03-...',
    keyLabel: 'کلید API آنتروپیک',
    models: [
      { value: 'claude-opus-4-8',   label: 'Claude Opus 4.8' },
      { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
      { value: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5' },
    ],
    defaultModel: 'claude-sonnet-4-6'
  },
  openai: {
    label: 'GPT (OpenAI)',
    keyPlaceholder: 'sk-...',
    keyLabel: 'کلید API اوپن‌ای',
    models: [
      { value: 'gpt-5.5',         label: 'GPT-5.5 ★' },
      { value: 'gpt-5.2',         label: 'GPT-5.2' },
      { value: 'gpt-5',           label: 'GPT-5' },
      { value: 'gpt-5-mini',      label: 'GPT-5 Mini' },
      { value: 'gpt-5.4-mini',    label: 'GPT-5.4 Mini' },
      { value: 'gpt-4.1',         label: 'GPT-4.1' },
      { value: 'gpt-4.1-mini',    label: 'GPT-4.1 Mini' },
      { value: 'gpt-4.1-nano',    label: 'GPT-4.1 Nano' },
      { value: 'gpt-4.5-preview', label: 'GPT-4.5 Preview' },
      { value: 'gpt-4o',          label: 'GPT-4o' },
      { value: 'gpt-4o-mini',     label: 'GPT-4o Mini' },
      { value: 'o4-mini',         label: 'o4 Mini' },
      { value: 'o3-pro',          label: 'o3 Pro' },
      { value: 'o3',              label: 'o3' },
      { value: 'o3-mini',         label: 'o3 Mini' },
      { value: 'o1',              label: 'o1' },
      { value: 'o1-mini',         label: 'o1 Mini' },
    ],
    defaultModel: 'gpt-5.4-mini'
  }
};

let currentProvider = 'claude';

function setProvider(p) {
  currentProvider = p;
  localStorage.setItem('pc_provider', p);
  const def = PROVIDERS[p];

  // update button styles
  const btnClaude = document.getElementById('providerClaude');
  const btnGpt    = document.getElementById('providerGpt');
  const active    = 'border-color:var(--md-primary);background:color-mix(in srgb,var(--md-primary) 15%,transparent);color:var(--md-primary)';
  const inactive  = 'border-color:var(--md-outline);background:transparent;color:var(--md-on-surface-var)';
  btnClaude.style.cssText = (p === 'claude' ? active : inactive);
  btnGpt.style.cssText    = (p === 'openai' ? active : inactive);

  // update label & placeholder
  document.getElementById('apiKeyLabelText').textContent = def.keyLabel;
  apiKeyInput.placeholder = def.keyPlaceholder;

  // load saved key for this provider
  const savedKey = localStorage.getItem(`pc_api_key_${p}`) || '';
  apiKeyInput.value = savedKey;
  document.getElementById('apiFieldWrap').classList.toggle('has-value', savedKey.length > 0);

  // rebuild model select
  modelSelect.innerHTML = def.models.map(m =>
    `<option value="${m.value}">${m.label}</option>`
  ).join('');
  const savedModel = localStorage.getItem(`pc_model_${p}`) || def.defaultModel;
  modelSelect.value = savedModel;

  // update lamp for this provider
  const existingKey = localStorage.getItem(`pc_api_key_${p}`);
  if (existingKey) testApiKey(existingKey, p);
  else setLamp('idle');
}

/* ─── SETTINGS ─── */
function loadSettings() {
  const provider = localStorage.getItem('pc_provider') || 'claude';
  setProvider(provider);
  const saved = localStorage.getItem(`pc_api_key_${provider}`);
  if (saved) testApiKey(saved, provider);

  const gKey = localStorage.getItem('pc_google_key') || '';
  const gCx  = localStorage.getItem('pc_google_cx')  || '';
  const gKeyEl = document.getElementById('googleApiKeyInput');
  const gCxEl  = document.getElementById('googleCxInput');
  if (gKey) { gKeyEl.value = gKey; document.getElementById('googleKeyWrap').classList.add('has-value'); }
  if (gCx)  { gCxEl.value  = gCx;  document.getElementById('googleCxWrap').classList.add('has-value'); }
  updateSerpHint();
}

function updateSerpHint() {
  const hint = document.getElementById('serpHint');
  if (!hint) return;
  const hasKey = !!(localStorage.getItem('pc_google_key') && localStorage.getItem('pc_google_cx'));
  hint.textContent = hasKey ? 'عنوان محصول را وارد کنید و روی جستجو کلیک کنید.' : 'کلید Google را در تنظیمات وارد کنید.';
}

/* ─── API KEY TEST ─── */
function setLamp(state) {
  const lamp = document.getElementById('apiLamp');
  const btn  = document.getElementById('settingsBtn');
  if (lamp) {
    lamp.className = `api-lamp ${state}`;
    lamp.title = { idle:'کلیدی وارد نشده', testing:'در حال بررسی...', ok:'کلید معتبر است', error:'کلید نامعتبر یا خطا' }[state] || '';
  }
  if (btn) {
    btn.classList.remove('btn-glow-ok', 'btn-glow-error', 'btn-glow-testing');
    if (state === 'ok')           btn.classList.add('btn-glow-ok');
    else if (state === 'error')   btn.classList.add('btn-glow-error');
    else if (state === 'testing') btn.classList.add('btn-glow-testing');
  }
}

async function testApiKey(key, provider) {
  if (!key) { setLamp('idle'); return; }
  setLamp('testing');
  try {
    if (provider === 'openai') {
      const r = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      setLamp(r.ok ? 'ok' : 'error');
    } else {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }]
        })
      });
      setLamp(r.ok ? 'ok' : 'error');
    }
  } catch {
    setLamp('error');
  }
}

/* ─── SERP / INTENT ─── */
const INTENT_KEYWORDS = {
  informational: ['چیست','چگونه','آموزش','راهنما','چطور','معرفی','فواید','تاریخچه','what is','how to','guide','learn','tutorial','tips','explained','benefits','history'],
  commercial:    ['بهترین','مقایسه','نقد','بررسی','ارزیابی','کدام','best','review','compare','vs','top','ranking','worth','alternatives','pros cons','difference'],
  transactional: ['خرید','قیمت','ارزان','فروش','سفارش','تخفیف','خرید آنلاین','buy','price','cheap','order','discount','shop','deal','purchase','sale','for sale'],
  navigational:  ['سایت رسمی','درباره ما','ورود','دانلود','official','login','download','signup','register','account','brand','website']
};

function detectIntent(results) {
  const scores = { informational: 0, commercial: 0, transactional: 0, navigational: 0 };
  results.forEach(r => {
    const text = `${r.title} ${r.snippet}`.toLowerCase();
    Object.entries(INTENT_KEYWORDS).forEach(([intent, kws]) => {
      kws.forEach(kw => { if (text.includes(kw)) scores[intent]++; });
    });
  });
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

function setSerpLamp(state) {
  const lamp = document.getElementById('serpLamp');
  if (lamp) lamp.className = `api-lamp ${state}`;
}

async function searchGoogle(query) {
  const apiKey = localStorage.getItem('pc_google_key') || '';
  const cx     = localStorage.getItem('pc_google_cx')  || '';
  if (!apiKey || !cx) {
    showToast('⚠', 'کلید Google را در تنظیمات وارد کنید');
    settingsPanel.classList.remove('hidden');
    return;
  }

  setSerpLamp('testing');
  const hint = document.getElementById('serpHint');
  hint.textContent = 'در حال جستجو در گوگل...';

  try {
    const fetchPage = (start) =>
      fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=10${start > 1 ? `&start=${start}` : ''}`)
        .then(r => r.json());

    const [p1, p2] = await Promise.all([fetchPage(1), fetchPage(11)]);

    if (p1.error) throw new Error(p1.error.message || 'خطای Google API');

    const items = [...(p1.items || []).slice(0, 10), ...(p2.items || []).slice(0, 5)];
    serpData = items.map(item => ({
      title:   item.title,
      link:    item.link,
      snippet: item.snippet || ''
    }));

    if (!serpData.length) throw new Error('نتیجه‌ای یافت نشد');

    const intent = detectIntent(serpData);
    selectedIntent = intent;
    renderSerpUI(intent);
    setSerpLamp('ok');
    hint.textContent = `${serpData.length} نتیجه یافت شد`;

  } catch (e) {
    setSerpLamp('error');
    hint.textContent = e.message || 'خطا در جستجو';
    showToast('✕', e.message || 'خطا در جستجوی گوگل');
  }
}

function renderSerpUI(intent) {
  const intentSection = document.getElementById('intentSection');
  intentSection.classList.remove('hidden');
  document.getElementById('intentBadge').classList.remove('hidden');

  document.querySelectorAll('#intentChips .md-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.intent === intent);
  });

  const list = document.getElementById('serpList');
  list.innerHTML = serpData.map((r, i) => `
    <div class="flex items-start gap-2 py-1.5" style="border-bottom:1px solid var(--md-outline-var)">
      <span class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
        style="background:color-mix(in srgb,var(--md-primary) 15%,transparent);color:var(--md-primary)">${i + 1}</span>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium leading-snug" style="color:var(--md-on-surface)">${r.title}</p>
        <p class="text-[11px] mt-0.5 leading-snug line-clamp-1" style="color:var(--md-outline)">${r.snippet}</p>
      </div>
    </div>
  `).join('');

  document.getElementById('serpResultsWrap').classList.remove('hidden');
}

/* ─── FIELD TYPES ─── */
const FIELD_TYPES = {
  text: {
    label: 'متن',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/>`,
    render: (id) => `
      <textarea id="field-${id}" rows="3"
        placeholder="توضیحات محصول، ویژگی‌ها، برند، مخاطب هدف..."
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition resize-none"></textarea>`,
    getValue: (id) => {
      const el = document.getElementById(`field-${id}`);
      return el ? { type: 'text', content: el.value.trim() } : null;
    }
  },
  image: {
    label: 'تصویر',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>`,
    render: (id) => `
      <div id="upload-zone-${id}" class="upload-zone border-2 border-dashed border-gray-700 rounded-lg p-5 text-center hover:border-violet-500/50 transition-colors" onclick="document.getElementById('file-${id}').click()">
        <input type="file" id="file-${id}" accept="image/*" class="hidden" onchange="handleImageUpload(${id}, this)">
        <div id="upload-preview-${id}">
          <svg class="w-6 h-6 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <p class="text-xs text-gray-500">برای آپلود کلیک کنید یا تصویر را اینجا رها کنید</p>
          <p class="text-[11px] text-gray-600 mt-1">PNG, JPG, WEBP — حداکثر ۵ مگابایت</p>
        </div>
      </div>`,
    getValue: (id) => {
      const zone = document.getElementById(`upload-zone-${id}`);
      return zone && zone.dataset.base64
        ? { type: 'image', mediaType: zone.dataset.mediaType, base64: zone.dataset.base64 }
        : null;
    }
  },
  link: {
    label: 'لینک',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>`,
    render: (id) => `
      <input type="url" id="field-${id}" placeholder="https://example.com/product"
        class="ltr-input w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition">`,
    getValue: (id) => {
      const el = document.getElementById(`field-${id}`);
      return el && el.value.trim() ? { type: 'link', content: el.value.trim() } : null;
    }
  },
  pdf: {
    label: 'فایل PDF',
    icon: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>`,
    render: (id) => `
      <div id="upload-zone-${id}" class="upload-zone border-2 border-dashed border-gray-700 rounded-lg p-5 text-center hover:border-violet-500/50 transition-colors" onclick="document.getElementById('file-${id}').click()">
        <input type="file" id="file-${id}" accept="application/pdf" class="hidden" onchange="handlePdfUpload(${id}, this)">
        <div id="upload-preview-${id}">
          <svg class="w-6 h-6 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p class="text-xs text-gray-500">برای آپلود PDF کلیک کنید</p>
          <p class="text-[11px] text-gray-600 mt-1">حداکثر ۱۰ مگابایت</p>
        </div>
      </div>`,
    getValue: (id) => {
      const zone = document.getElementById(`upload-zone-${id}`);
      return zone && zone.dataset.base64
        ? { type: 'pdf', base64: zone.dataset.base64 }
        : null;
    }
  }
};

/* ─── ADD FIELD ─── */
function addField(type) {
  const id = ++fieldCounter;
  const def = FIELD_TYPES[type];
  const card = document.createElement('div');
  card.id = `card-${id}`;
  card.className = 'bg-gray-900 border border-gray-800 rounded-xl p-4 fade-in';
  card.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2 text-xs font-medium text-gray-400">
        <svg class="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">${def.icon}</svg>
        ${def.label}
      </div>
      ${fieldCounter > 1 ? `<button onclick="removeField(${id})" class="text-gray-600 hover:text-red-400 transition-colors p-0.5 rounded">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>` : ''}
    </div>
    ${def.render(id)}`;
  fieldsContainer.appendChild(card);
  setupDragDrop(id, type);
}

function removeField(id) {
  const card = document.getElementById(`card-${id}`);
  if (card) card.remove();
}

/* ─── FIELD PICKER ─── */
function showFieldPicker() {
  const existing = document.getElementById('fieldPicker');
  if (existing) { existing.remove(); return; }

  const picker = document.createElement('div');
  picker.id = 'fieldPicker';
  picker.className = 'bg-gray-800 border border-gray-700 rounded-xl p-3 grid grid-cols-2 gap-2 fade-in';
  Object.entries(FIELD_TYPES).forEach(([type, def]) => {
    const btn = document.createElement('button');
    btn.className = 'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors text-right';
    btn.innerHTML = `
      <svg class="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">${def.icon}</svg>
      ${def.label}`;
    btn.addEventListener('click', () => {
      picker.remove();
      addField(type);
    });
    picker.appendChild(btn);
  });

  addFieldBtn.insertAdjacentElement('beforebegin', picker);

  const close = (e) => {
    if (!picker.contains(e.target) && e.target !== addFieldBtn) {
      picker.remove();
      document.removeEventListener('click', close);
    }
  };
  setTimeout(() => document.addEventListener('click', close), 0);
}

/* ─── FILE UPLOADS ─── */
function handleImageUpload(id, input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('⚠', 'حجم تصویر بیش از ۵ مگابایت است'); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result.split(',')[1];
    const zone = document.getElementById(`upload-zone-${id}`);
    zone.dataset.base64 = base64;
    zone.dataset.mediaType = file.type;

    document.getElementById(`upload-preview-${id}`).innerHTML = `
      <img src="${e.target.result}" class="max-h-24 mx-auto rounded-lg object-contain mb-2">
      <p class="text-xs text-violet-400">${file.name}</p>`;
  };
  reader.readAsDataURL(file);
}

function handlePdfUpload(id, input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { showToast('⚠', 'حجم PDF بیش از ۱۰ مگابایت است'); return; }

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result.split(',')[1];
    const zone = document.getElementById(`upload-zone-${id}`);
    zone.dataset.base64 = base64;

    document.getElementById(`upload-preview-${id}`).innerHTML = `
      <svg class="w-6 h-6 text-violet-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <p class="text-xs text-violet-400">${file.name}</p>
      <p class="text-[11px] text-gray-500 mt-0.5">${(file.size / 1024).toFixed(0)} KB</p>`;
  };
  reader.readAsDataURL(file);
}

/* ─── DRAG & DROP ─── */
function setupDragDrop(id, type) {
  if (type !== 'image' && type !== 'pdf') return;
  const zone = document.getElementById(`upload-zone-${id}`);
  if (!zone) return;

  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const input = document.getElementById(`file-${id}`);
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    type === 'image' ? handleImageUpload(id, input) : handlePdfUpload(id, input);
  });
}

/* ─── COLLECT INPUTS ─── */
function collectInputs() {
  const results = [];
  Object.entries(FIELD_TYPES).forEach(([type, def]) => {
    for (let i = 1; i <= fieldCounter; i++) {
      if (!document.getElementById(`card-${i}`)) continue;
      const card = document.getElementById(`card-${i}`);
      if (!card) continue;
      const labelEl = card.querySelector('.text-gray-400');
      if (labelEl && labelEl.textContent.trim() === def.label) {
        const val = def.getValue(i);
        if (val) results.push(val);
      }
    }
  });
  return results;
}

/* ─── BUILD PROMPT ─── */
function buildPrompt(inputs, tone, language, contentTypes) {
  const toneMap = {
    promotional: 'تبلیغاتی و ترغیب‌کننده',
    formal: 'رسمی و حرفه‌ای',
    casual: 'دوستانه و صمیمی',
    technical: 'فنی و تخصصی',
    storytelling: 'داستانی و احساسی',
    informational: 'اطلاع‌رسانی و آموزشی'
  };
  const langMap = {
    fa: 'فارسی',
    en: 'English',
    both: 'فارسی و English (هر دو)'
  };
  const typeMap = {
    description: 'توضیحات کامل محصول',
    features: 'ویژگی‌های کلیدی (لیست)',
    social: 'پست شبکه اجتماعی (اینستاگرام/تلگرام)',
    seo: 'متا تایتل و متا دیسکریپشن (SEO)',
    tagline: 'تگ‌لاین و اسلوگان',
    faq: 'سوالات متداول (FAQ)',
    advantages: 'مزیت‌های محصول (لیست نقاط قوت)',
    disadvantages: 'معایب و محدودیت‌های محصول (صادقانه)',
    properties: 'خاصیت‌ها و کاربردهای محصول',
    table: 'جدول ویژگی‌های فنی و مشخصات (Markdown table)'
  };

  const selectedTypes = contentTypes.map(t => typeMap[t] || t).join('، ');
  const langInstr = language === 'en' ? 'Respond in English only.' : language === 'both' ? 'Provide each section first in Persian (فارسی), then in English.' : 'تمام پاسخ را به فارسی بنویس.';

  let prompt = `تو یک متخصص بازاریابی محتوا هستی. بر اساس اطلاعات محصول زیر، محتوای باکیفیت تولید کن.

**لحن نوشتار:** ${toneMap[tone] || tone}
**زبان خروجی:** ${langMap[language]}
**بخش‌های درخواستی:** ${selectedTypes}

${langInstr}

---

## اطلاعات ورودی محصول:
`;

  inputs.forEach((inp, i) => {
    if (inp.type === 'text') {
      prompt += `\n### متن (${i + 1}):\n${inp.content}\n`;
    } else if (inp.type === 'link') {
      prompt += `\n### لینک (${i + 1}):\n${inp.content}\n`;
    }
  });

  if (serpData.length > 0 && selectedIntent) {
    const intentMap = {
      informational: 'اطلاعاتی — کاربر دنبال اطلاعات و آموزش است',
      commercial:    'تجاری / مقایسه‌ای — کاربر در حال تحقیق قبل از خرید است',
      transactional: 'تراکنشی — کاربر آماده خرید است',
      navigational:  'ناوبری — کاربر دنبال برند یا سایت خاصی است'
    };
    prompt += `\n\n---\n\n## تحلیل SERP گوگل:\n`;
    prompt += `**اینتنت اصلی کاربر:** ${intentMap[selectedIntent]}\n\n`;
    prompt += `**${serpData.length} عنوان برتر گوگل برای این محصول:**\n`;
    serpData.forEach((r, i) => { prompt += `${i + 1}. ${r.title}\n`; });
    prompt += `\n**راهنما:** محتوا باید با اینتنت "${intentMap[selectedIntent]}" همسو باشد. از زاویه دید و کلیدواژه‌های عناوین برتر الهام بگیر اما محتوای یکتا و متمایز بنویس.`;
  }

  prompt += `\n\n---\n\n## وظیفه:\nبرای هر یک از بخش‌های درخواستی (${selectedTypes}) یک عنوان مشخص بنویس و محتوای آن را با لحن ${toneMap[tone] || tone} بنویس. خروجی را با Markdown فرمت‌بندی کن.`;

  return prompt;
}

/* ─── BUILD MESSAGE CONTENT ─── */
function buildMessageContent(inputs, prompt) {
  if (currentProvider === 'openai') {
    const content = [];
    inputs.forEach(inp => {
      if (inp.type === 'image') {
        content.push({
          type: 'image_url',
          image_url: { url: `data:${inp.mediaType};base64,${inp.base64}` }
        });
      }
      // OpenAI doesn't natively accept PDF — skip (text already included in prompt)
    });
    content.push({ type: 'text', text: prompt });
    return content;
  }

  // Claude (Anthropic)
  const content = [];
  inputs.forEach(inp => {
    if (inp.type === 'image') {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: inp.mediaType, data: inp.base64 }
      });
    } else if (inp.type === 'pdf') {
      content.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: inp.base64 }
      });
    }
  });
  content.push({ type: 'text', text: prompt });
  return content;
}

/* ─── GENERATE ─── */
async function handleGenerate() {
  if (isGenerating) return;

  const apiKey = localStorage.getItem(`pc_api_key_${currentProvider}`) || apiKeyInput.value.trim();
  if (!apiKey) {
    settingsPanel.classList.remove('hidden');
    apiKeyInput.focus();
    showToast('⚠', 'ابتدا کلید API را وارد کنید');
    return;
  }

  const inputs = collectInputs();
  if (!inputs.length) {
    showToast('⚠', 'حداقل یک فیلد پر کنید');
    return;
  }

  const contentTypes = [...document.querySelectorAll('.md-chip.active')].map(el => el.dataset.value);
  if (!contentTypes.length) {
    showToast('⚠', 'حداقل یک نوع محتوا انتخاب کنید');
    return;
  }

  const tone     = toneSelect.value;
  const language = languageSelect.value;
  const model    = localStorage.getItem(`pc_model_${currentProvider}`) || modelSelect.value;

  setGenerating(true);
  showState('loading');
  const startTime = Date.now();

  try {
    const prompt     = buildPrompt(inputs, tone, language, contentTypes);
    const msgContent = buildMessageContent(inputs, prompt);

    setLoadingStep(`در حال ارسال به ${currentProvider === 'openai' ? 'OpenAI' : 'Claude'}...`);

    let raw = '';

    if (currentProvider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: msgContent }]
        })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `خطای API (${response.status})`);
      }
      const data = await response.json();
      raw = data.choices?.[0]?.message?.content || '';
    } else {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: msgContent }]
        })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `خطای API (${response.status})`);
      }
      const data = await response.json();
      raw = data.content?.[0]?.text || '';
    }

    if (!raw) throw new Error('پاسخ خالی از سرور');

    setLoadingStep('در حال پردازش پاسخ...');
    lastRawOutput = raw;
    contentOutput.innerHTML = renderMarkdown(raw);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const providerLabel = currentProvider === 'openai' ? `GPT — ${model}` : `Claude — ${model.replace('claude-', '')}`;
    outputMeta.textContent = `تولید شده با ${providerLabel}`;
    outputTime.textContent = `${elapsed} ثانیه`;

    showState('content');
    outputActions.classList.remove('hidden');
    showToast('✓', 'محتوا با موفقیت تولید شد');

  } catch (err) {
    showState('empty');
    showToast('✕', err.message || 'خطایی رخ داد');
  } finally {
    setGenerating(false);
  }
}

/* ─── UI STATE ─── */
function setGenerating(val) {
  isGenerating = val;
  generateBtn.disabled = val;
  genText.textContent  = val ? 'در حال تولید...' : 'تولید محتوا';
  genIcon.classList.toggle('spin', val);
}

function setLoadingStep(text) {
  if (loadingStep) loadingStep.textContent = text;
}

function showState(state) {
  emptyState.classList.add('hidden');
  loadingState.classList.add('hidden');
  contentState.classList.add('hidden');
  if (state === 'empty')   emptyState.classList.remove('hidden');
  if (state === 'loading') loadingState.classList.remove('hidden');
  if (state === 'content') contentState.classList.remove('hidden');
}

/* ─── MARKDOWN RENDERER ─── */
function renderMarkdown(md) {
  let html = escapeHtml(md);

  // Code blocks (before other replacements)
  html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${code.trim()}</code></pre>`);

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // HR
  html = html.replace(/^---+$/gm, '<hr>');

  // Unordered list
  html = html.replace(/^(\s*[-*+] .+(\n(?!\n).*)*)/gm, (block) => {
    const items = block.split('\n').filter(l => l.trim()).map(l => {
      return `<li>${l.replace(/^\s*[-*+] /, '')}</li>`;
    }).join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered list
  html = html.replace(/^(\s*\d+\. .+(\n(?!\n).*)*)/gm, (block) => {
    const items = block.split('\n').filter(l => l.trim()).map(l => {
      return `<li>${l.replace(/^\s*\d+\. /, '')}</li>`;
    }).join('');
    return `<ol>${items}</ol>`;
  });

  // Tables (must run before paragraph wrapping)
  html = html.replace(/^(\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)*)/gm, (tableBlock) => {
    const lines = tableBlock.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return tableBlock;
    const parseRow = (line) => line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1).map(c => c.trim());
    const headers = parseRow(lines[0]);
    const rows    = lines.slice(2).map(parseRow);
    const ths = headers.map(h => `<th>${h}</th>`).join('');
    const trs = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
    return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  });

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Paragraphs (double newline)
  html = html.replace(/\n{2,}/g, '</p><p>');
  html = `<p>${html}</p>`;

  // Single newlines inside paragraphs
  html = html.replace(/(?<!>)\n(?!<)/g, '<br>');

  // Clean up empty p tags and tags around block elements
  html = html.replace(/<p>\s*(<(?:h[123]|ul|ol|pre|blockquote|hr|table)[^>]*>)/g, '$1');
  html = html.replace(/(<\/(?:h[123]|ul|ol|pre|blockquote|hr|table)>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ─── SNACKBAR (MD3) ─── */
let snackTimer = null;
function showToast(icon, message) {
  snackIcon.textContent = icon;
  snackMsg.textContent  = message;
  snackbar.classList.add('show');
  clearTimeout(snackTimer);
  snackTimer = setTimeout(() => snackbar.classList.remove('show'), 3000);
}

/* ─── RIPPLE (MD3) ─── */
document.addEventListener('click', (e) => {
  const el = e.target.closest('.ripple-container');
  if (!el) return;
  const r = document.createElement('span');
  r.className = 'ripple';
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px`;
  el.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
});

/* ─── BOOT ─── */
init();
