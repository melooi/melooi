/* ─── Field type definitions ─── */
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

/* ─── Add / remove fields ─── */
function addField(type) {
  const id  = ++fieldCounter;
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

/* ─── Field picker popup ─── */
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
    btn.addEventListener('click', () => { picker.remove(); addField(type); });
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

/* ─── Collect all field values ─── */
function collectInputs() {
  const results = [];
  Object.entries(FIELD_TYPES).forEach(([type, def]) => {
    for (let i = 1; i <= fieldCounter; i++) {
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

/* ─── File uploads ─── */
function handleImageUpload(id, input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('⚠', 'حجم تصویر بیش از ۵ مگابایت است'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result.split(',')[1];
    const zone = document.getElementById(`upload-zone-${id}`);
    zone.dataset.base64    = base64;
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

/* ─── Drag & drop ─── */
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
