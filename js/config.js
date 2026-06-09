/* ─── Providers ─── */
const PROVIDERS = {
  claude: {
    label:          'Claude (Anthropic)',
    keyPlaceholder: 'sk-ant-api03-...',
    keyLabel:       'کلید API آنتروپیک',
    models: [
      { value: 'claude-opus-4-8',   label: 'Claude Opus 4.8' },
      { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
      { value: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5' },
    ],
    defaultModel: 'claude-sonnet-4-6'
  },
  openai: {
    label:          'GPT (OpenAI)',
    keyPlaceholder: 'sk-...',
    keyLabel:       'کلید API اوپن‌ای',
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

/* ─── SERP intent keywords ─── */
const INTENT_KEYWORDS = {
  informational: ['چیست','چگونه','آموزش','راهنما','چطور','معرفی','فواید','تاریخچه','what is','how to','guide','learn','tutorial','tips','explained','benefits','history'],
  commercial:    ['بهترین','مقایسه','نقد','بررسی','ارزیابی','کدام','best','review','compare','vs','top','ranking','worth','alternatives','pros cons','difference'],
  transactional: ['خرید','قیمت','ارزان','فروش','سفارش','تخفیف','خرید آنلاین','buy','price','cheap','order','discount','shop','deal','purchase','sale','for sale'],
  navigational:  ['سایت رسمی','درباره ما','ورود','دانلود','official','login','download','signup','register','account','brand','website']
};
