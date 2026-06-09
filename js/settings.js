/* ─── Provider switching ─── */
function setProvider(p) {
  currentProvider = p;
  localStorage.setItem('pc_provider', p);
  const def = PROVIDERS[p];

  const btnClaude = document.getElementById('providerClaude');
  const btnGpt    = document.getElementById('providerGpt');
  const active    = 'border-color:var(--md-primary);background:color-mix(in srgb,var(--md-primary) 15%,transparent);color:var(--md-primary)';
  const inactive  = 'border-color:var(--md-outline);background:transparent;color:var(--md-on-surface-var)';
  btnClaude.style.cssText = (p === 'claude' ? active : inactive);
  btnGpt.style.cssText    = (p === 'openai' ? active : inactive);

  document.getElementById('apiKeyLabelText').textContent = def.keyLabel;
  apiKeyInput.placeholder = def.keyPlaceholder;

  const savedKey = localStorage.getItem(`pc_api_key_${p}`) || '';
  apiKeyInput.value = savedKey;
  document.getElementById('apiFieldWrap').classList.toggle('has-value', savedKey.length > 0);

  modelSelect.innerHTML = def.models.map(m =>
    `<option value="${m.value}">${m.label}</option>`
  ).join('');
  const savedModel = localStorage.getItem(`pc_model_${p}`) || def.defaultModel;
  modelSelect.value = savedModel;

  const existingKey = localStorage.getItem(`pc_api_key_${p}`);
  if (existingKey) testApiKey(existingKey, p);
  else setLamp('idle');
}

/* ─── API key lamp ─── */
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

/* ─── API key validation ─── */
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

/* ─── Load/save settings ─── */
function loadSettings() {
  const provider = localStorage.getItem('pc_provider') || 'claude';
  setProvider(provider);
  const saved = localStorage.getItem(`pc_api_key_${provider}`);
  if (saved) testApiKey(saved, provider);

  const gKey   = localStorage.getItem('pc_google_key') || '';
  const gCx    = localStorage.getItem('pc_google_cx')  || '';
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
  hint.textContent = hasKey
    ? 'عنوان محصول را وارد کنید و روی جستجو کلیک کنید.'
    : 'کلید Google را در تنظیمات وارد کنید.';
}
