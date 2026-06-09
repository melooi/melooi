/* ─── DOM Refs ─── */
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

/* ─── Toast / Snackbar ─── */
function showToast(icon, message) {
  snackIcon.textContent = icon;
  snackMsg.textContent  = message;
  snackbar.classList.add('show');
  clearTimeout(snackTimer);
  snackTimer = setTimeout(() => snackbar.classList.remove('show'), 3000);
}

/* ─── Output state ─── */
function showState(s) {
  emptyState.classList.add('hidden');
  loadingState.classList.add('hidden');
  contentState.classList.add('hidden');
  if (s === 'empty')   emptyState.classList.remove('hidden');
  if (s === 'loading') loadingState.classList.remove('hidden');
  if (s === 'content') contentState.classList.remove('hidden');
}

function setGenerating(val) {
  isGenerating = val;
  generateBtn.disabled = val;
  genText.textContent  = val ? 'در حال تولید...' : 'تولید محتوا';
  genIcon.classList.toggle('spin', val);
}

function setLoadingStep(text) {
  if (loadingStep) loadingStep.textContent = text;
}

/* ─── Markdown renderer ─── */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderMarkdown(md) {
  let html = escapeHtml(md);

  html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${code.trim()}</code></pre>`);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm,  '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm,   '<h1>$1</h1>');

  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/^---+$/gm, '<hr>');

  html = html.replace(/^(\s*[-*+] .+(\n(?!\n).*)*)/gm, (block) => {
    const items = block.split('\n').filter(l => l.trim()).map(l =>
      `<li>${l.replace(/^\s*[-*+] /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  html = html.replace(/^(\s*\d+\. .+(\n(?!\n).*)*)/gm, (block) => {
    const items = block.split('\n').filter(l => l.trim()).map(l =>
      `<li>${l.replace(/^\s*\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

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

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  html = html.replace(/\n{2,}/g, '</p><p>');
  html = `<p>${html}</p>`;
  html = html.replace(/(?<!>)\n(?!<)/g, '<br>');

  html = html.replace(/<p>\s*(<(?:h[123]|ul|ol|pre|blockquote|hr|table)[^>]*>)/g, '$1');
  html = html.replace(/(<\/(?:h[123]|ul|ol|pre|blockquote|hr|table)>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

/* ─── Ripple (MD3) ─── */
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
