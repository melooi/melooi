/* ─── App entry point ─── */
function init() {
  loadSettings();
  addField('text');

  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('hidden');
  });

  saveSettings.addEventListener('click', () => {
    const key  = apiKeyInput.value.trim();
    const gKey = document.getElementById('googleApiKeyInput').value.trim();
    const gCx  = document.getElementById('googleCxInput').value.trim();
    localStorage.setItem(`pc_api_key_${currentProvider}`, key);
    localStorage.setItem(`pc_model_${currentProvider}`, modelSelect.value);
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
    navigator.clipboard.writeText(lastRawOutput).then(() => showToast('✓', 'محتوا کپی شد'));
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

init();
