/* ─── Shared mutable state ─── */
let fieldCounter    = 0;
let lastRawOutput   = '';
let isGenerating    = false;
let serpData        = [];
let selectedIntent  = '';
let currentProvider = 'claude';
let snackTimer      = null;
