/* ─── Intent detection ─── */
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

/* ─── Google Custom Search ─── */
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

/* ─── Render SERP results + intent UI ─── */
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
        <p class="text-[11px] mt-0.5 leading-snug" style="color:var(--md-outline);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.snippet}</p>
      </div>
    </div>
  `).join('');

  document.getElementById('serpResultsWrap').classList.remove('hidden');
}
