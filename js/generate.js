/* ─── Prompt builder ─── */
function buildPrompt(inputs, tone, language, contentTypes) {
  const toneMap = {
    promotional:   'تبلیغاتی و ترغیب‌کننده',
    formal:        'رسمی و حرفه‌ای',
    casual:        'دوستانه و صمیمی',
    technical:     'فنی و تخصصی',
    storytelling:  'داستانی و احساسی',
    informational: 'اطلاع‌رسانی و آموزشی'
  };
  const langMap = {
    fa:   'فارسی',
    en:   'English',
    both: 'فارسی و English (هر دو)'
  };
  const typeMap = {
    description:    'توضیحات کامل محصول',
    features:       'ویژگی‌های کلیدی (لیست)',
    social:         'پست شبکه اجتماعی (اینستاگرام/تلگرام)',
    seo:            'متا تایتل و متا دیسکریپشن (SEO)',
    tagline:        'تگ‌لاین و اسلوگان',
    faq:            'سوالات متداول (FAQ)',
    advantages:     'مزیت‌های محصول (لیست نقاط قوت)',
    disadvantages:  'معایب و محدودیت‌های محصول (صادقانه)',
    properties:     'خاصیت‌ها و کاربردهای محصول',
    table:          'جدول ویژگی‌های فنی و مشخصات (Markdown table)'
  };

  const selectedTypes = contentTypes.map(t => typeMap[t] || t).join('، ');
  const langInstr = language === 'en'
    ? 'Respond in English only.'
    : language === 'both'
      ? 'Provide each section first in Persian (فارسی), then in English.'
      : 'تمام پاسخ را به فارسی بنویس.';

  let prompt = `تو یک متخصص بازاریابی محتوا هستی. بر اساس اطلاعات محصول زیر، محتوای باکیفیت تولید کن.

**لحن نوشتار:** ${toneMap[tone] || tone}
**زبان خروجی:** ${langMap[language]}
**بخش‌های درخواستی:** ${selectedTypes}

${langInstr}

---

## اطلاعات ورودی محصول:
`;

  inputs.forEach((inp, i) => {
    if (inp.type === 'text') prompt += `\n### متن (${i + 1}):\n${inp.content}\n`;
    else if (inp.type === 'link') prompt += `\n### لینک (${i + 1}):\n${inp.content}\n`;
  });

  if (serpData.length > 0 && selectedIntent) {
    const intentLabel = {
      informational: 'اطلاعاتی — کاربر دنبال اطلاعات و آموزش است',
      commercial:    'تجاری / مقایسه‌ای — کاربر در حال تحقیق قبل از خرید است',
      transactional: 'تراکنشی — کاربر آماده خرید است',
      navigational:  'ناوبری — کاربر دنبال برند یا سایت خاصی است'
    }[selectedIntent];
    prompt += `\n\n---\n\n## تحلیل SERP گوگل:\n`;
    prompt += `**اینتنت اصلی کاربر:** ${intentLabel}\n\n`;
    prompt += `**${serpData.length} عنوان برتر گوگل برای این محصول:**\n`;
    serpData.forEach((r, i) => { prompt += `${i + 1}. ${r.title}\n`; });
    prompt += `\n**راهنما:** محتوا باید با اینتنت "${intentLabel}" همسو باشد. از زاویه دید و کلیدواژه‌های عناوین برتر الهام بگیر اما محتوای یکتا و متمایز بنویس.`;
  }

  prompt += `\n\n---\n\n## وظیفه:\nبرای هر یک از بخش‌های درخواستی (${selectedTypes}) یک عنوان مشخص بنویس و محتوای آن را با لحن ${toneMap[tone] || tone} بنویس. خروجی را با Markdown فرمت‌بندی کن.`;

  return prompt;
}

/* ─── Message content builder (handles images/PDFs per provider) ─── */
function buildMessageContent(inputs, prompt) {
  if (currentProvider === 'openai') {
    const content = [];
    inputs.forEach(inp => {
      if (inp.type === 'image') {
        content.push({ type: 'image_url', image_url: { url: `data:${inp.mediaType};base64,${inp.base64}` } });
      }
    });
    content.push({ type: 'text', text: prompt });
    return content;
  }

  // Claude (Anthropic)
  const content = [];
  inputs.forEach(inp => {
    if (inp.type === 'image') {
      content.push({ type: 'image', source: { type: 'base64', media_type: inp.mediaType, data: inp.base64 } });
    } else if (inp.type === 'pdf') {
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: inp.base64 } });
    }
  });
  content.push({ type: 'text', text: prompt });
  return content;
}

/* ─── Main generation handler ─── */
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
  if (!inputs.length) { showToast('⚠', 'حداقل یک فیلد پر کنید'); return; }

  const contentTypes = [...document.querySelectorAll('#contentTypesContainer .md-chip.active')].map(el => el.dataset.value);
  if (!contentTypes.length) { showToast('⚠', 'حداقل یک نوع محتوا انتخاب کنید'); return; }

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
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: 4096, messages: [{ role: 'user', content: msgContent }] })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `خطای API (${response.status})`);
      }
      raw = (await response.json()).choices?.[0]?.message?.content || '';

    } else {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({ model, max_tokens: 4096, messages: [{ role: 'user', content: msgContent }] })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `خطای API (${response.status})`);
      }
      raw = (await response.json()).content?.[0]?.text || '';
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
