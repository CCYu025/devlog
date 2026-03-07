'use strict';

// ── Typewriter constants ────────────────────────────────────────
const CHAR_DELAY       = 20;   // ms per character (normal)
const CHAR_DELAY_TURBO = 2;    // ms per character (turbo)
const PAUSE_H1         = 2000;
const PAUSE_H2         = 1000;
const PAUSE_P          = 600;
const PAUSE_LI         = 600;
const PAUSE_TURBO      = 80;   // ms per block (turbo)

// ── Static noise constants ──────────────────────────────────────
const STATIC_FADE_IN  = 100;   // ms
const STATIC_HOLD     = 900;   // ms
const STATIC_FADE_OUT = 200;   // ms

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ── State ──────────────────────────────────────────────────────
let currentFile = null;
let _twGeneration = 0;  // incremented on each loadFile to cancel ongoing typewriter

// ── Boot ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
window.addEventListener('popstate', (e) => {
  if (e.state && e.state.file) loadFile(e.state.file, false);
});

async function init() {
  const hash = readURLHash();
  try {
    const index = await fetchIndex();
    populateSidebar(index.files);
    updateStatusBar(index);
    const target = hash && index.files.includes(hash + '.txt') ? hash + '.txt' : index.files[0];
    if (target) loadFile(target, true);
  } catch (err) {
    showSidebarMessage('Initializing…');
    updateStatusBarError();
    console.error('Failed to load index:', err);
  }
}

// ── URL / History ──────────────────────────────────────────────
function readURLHash() {
  const h = window.location.hash.replace('#', '').trim();
  return h || null;
}

function pushHistory(filename) {
  const url = '#' + filename.replace('.txt', '');
  if (window.location.hash !== '#' + filename.replace('.txt', '')) {
    history.pushState({ file: filename }, '', url);
  }
}

// ── Index ──────────────────────────────────────────────────────
async function fetchIndex() {
  const res = await fetch('./file-index.json');
  if (!res.ok) throw new Error('file-index.json not found');
  return res.json();
}

// ── Sidebar ────────────────────────────────────────────────────
function populateSidebar(files) {
  const nav = document.getElementById('file-list');
  nav.innerHTML = '';

  if (!files || files.length === 0) {
    showSidebarMessage('No logs yet.');
    return;
  }

  files.forEach(filename => {
    const a = document.createElement('a');
    a.href = '#' + filename.replace('.txt', '');
    a.dataset.file = filename;
    a.innerHTML = `<span class="file-icon">📄</span>${formatFileLabel(filename)}`;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      loadFile(filename, true);
    });
    nav.appendChild(a);
  });
}

function showSidebarMessage(msg) {
  const nav = document.getElementById('file-list');
  nav.innerHTML = `<div class="sidebar-message">${escapeHTML(msg)}</div>`;
}

function formatFileLabel(filename) {
  // 20260305.txt → 2026-03-05 (Thu)
  const base = filename.replace('.txt', '');
  if (!/^\d{8}$/.test(base)) return escapeHTML(filename);
  const y = base.slice(0, 4), m = base.slice(4, 6), d = base.slice(6, 8);
  const date = new Date(`${y}-${m}-${d}T12:00:00`);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = days[date.getDay()] || '';
  return escapeHTML(`${y}-${m}-${d} (${day})`);
}

function setActiveLink(filename) {
  document.querySelectorAll('#file-list a').forEach(a => {
    a.classList.toggle('active', a.dataset.file === filename);
  });
}

// ── Static noise overlay ────────────────────────────────────────
async function showStaticNoise(contentEl, isStale) {
  const canvas = document.createElement('canvas');
  canvas.id = 'static-overlay';
  canvas.style.cssText = 'position:absolute;inset:0;z-index:95;pointer-events:none;opacity:0;transition:opacity ' + STATIC_FADE_IN + 'ms linear';

  const rect = contentEl.getBoundingClientRect();
  canvas.width  = Math.floor(rect.width)  || contentEl.offsetWidth;
  canvas.height = Math.floor(rect.height) || contentEl.offsetHeight;
  contentEl.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let rafId = null;

  function drawNoise() {
    const w = canvas.width, h = canvas.height;
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.random() > 0.42) {
        d[i]   = 0;
        d[i+1] = Math.floor(Math.random() * 230 + 25);
        d[i+2] = Math.floor(Math.random() * 20);
        d[i+3] = Math.floor(Math.random() * 160 + 80);
      }
    }
    ctx.putImageData(img, 0, 0);
    rafId = requestAnimationFrame(drawNoise);
  }

  rafId = requestAnimationFrame(drawNoise);

  // Fade in
  requestAnimationFrame(() => { canvas.style.opacity = '1'; });
  await sleep(STATIC_FADE_IN + STATIC_HOLD);

  if (isStale()) {
    cancelAnimationFrame(rafId);
    canvas.remove();
    return;
  }

  // Fade out
  canvas.style.transition = 'opacity ' + STATIC_FADE_OUT + 'ms linear';
  canvas.style.opacity = '0';
  await sleep(STATIC_FADE_OUT);
  cancelAnimationFrame(rafId);
  canvas.remove();
}

// ── File loading ───────────────────────────────────────────────
async function loadFile(filename, addToHistory) {
  closeSidebar();
  currentFile = filename;
  setActiveLink(filename);
  document.getElementById('current-file').textContent = filename;
  document.getElementById('status-file').textContent = filename;

  if (addToHistory) pushHistory(filename);

  _twGeneration++;
  const generation = _twGeneration;
  const isStale = () => _twGeneration !== generation;

  const contentEl = document.getElementById('content');
  const staticPromise = showStaticNoise(contentEl, isStale);

  try {
    const res = await fetch(`./logs/${filename}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const nodes = parseLines(text);
    const lineCount = text.split('\n').length;
    document.getElementById('status-lines').textContent = `${lineCount} lines`;

    await staticPromise;
    if (isStale()) return;

    await typewriteNodes(nodes, document.getElementById('log-body'), generation);
  } catch (err) {
    await staticPromise;
    document.getElementById('log-body').innerHTML =
      `<p class="log-error">Error loading ${escapeHTML(filename)}: ${escapeHTML(err.message)}</p>`;
    document.getElementById('status-lines').textContent = '';
  }
}

// ── Typewriter ──────────────────────────────────────────────────
async function typewriteNodes(nodes, logBody, generation) {
  logBody.innerHTML = '';
  let turbo = false;
  const turboHandler = () => { turbo = true; };
  logBody.addEventListener('click', turboHandler, { once: true });

  const isStale  = () => _twGeneration !== generation;
  const getDelay = () => turbo ? CHAR_DELAY_TURBO : CHAR_DELAY;
  const getTurbo = () => turbo;

  let i = 0;
  while (i < nodes.length) {
    if (isStale()) break;
    const node = nodes[i];

    if (node.type === 'blank') { i++; continue; }

    if (node.type === 'bullet') {
      const ul = document.createElement('ul');
      ul.className = 'log-ul';
      logBody.appendChild(ul);

      while (i < nodes.length && nodes[i].type === 'bullet') {
        if (isStale()) break;
        const li = document.createElement('li');
        ul.appendChild(li);
        await typeText(li, nodes[i].content, isStale, getDelay);
        i++;
      }

      if (!isStale() && ul.lastElementChild) {
        await pauseWithCursor(ul.lastElementChild, PAUSE_LI, isStale, getTurbo);
      }

    } else {
      let el, pause;
      if (node.type === 'h1') {
        el = document.createElement('h1'); el.className = 'log-h1'; pause = PAUSE_H1;
      } else if (node.type === 'h2') {
        el = document.createElement('h2'); el.className = 'log-h2'; pause = PAUSE_H2;
      } else {
        el = document.createElement('p');  el.className = 'log-p';  pause = PAUSE_P;
      }
      logBody.appendChild(el);
      await typeText(el, node.content, isStale, getDelay);
      if (!isStale()) await pauseWithCursor(el, pause, isStale, getTurbo);
      i++;
    }
  }

  logBody.removeEventListener('click', turboHandler);
}

async function typeText(el, plainText, isStale, getDelay) {
  for (const char of plainText) {
    if (isStale()) break;
    el.textContent += char;
    await sleep(getDelay());
  }
  // Apply final formatted version (with timestamp spans etc.)
  el.innerHTML = inlineFormat(plainText);
}

async function pauseWithCursor(el, ms, isStale, getTurbo) {
  const cursor = document.createElement('span');
  cursor.className = 'tw-cursor';
  el.appendChild(cursor);
  const step = 50;
  let elapsed = 0;
  while (elapsed < ms) {
    if (isStale()) break;
    if (getTurbo() && elapsed >= PAUSE_TURBO) break;
    await sleep(step);
    elapsed += step;
  }
  cursor.remove();
}

// ── Parser ─────────────────────────────────────────────────────
function parseLines(raw) {
  const lines = raw.split('\n');
  const nodes = [];
  for (let line of lines) {
    const stripped = line.trimEnd();
    if (stripped.startsWith('# ')) {
      nodes.push({ type: 'h1', content: stripped.slice(2) });
    } else if (stripped.startsWith('## ')) {
      nodes.push({ type: 'h2', content: stripped.slice(3) });
    } else if (stripped.startsWith('- ')) {
      nodes.push({ type: 'bullet', content: stripped.slice(2) });
    } else if (/^\[\d{2}:\d{2}\]/.test(stripped)) {
      nodes.push({ type: 'timestamp-line', content: stripped });
    } else if (stripped === '') {
      nodes.push({ type: 'blank' });
    } else {
      nodes.push({ type: 'paragraph', content: stripped });
    }
  }
  return nodes;
}

// ── Renderer ───────────────────────────────────────────────────
function renderHTML(nodes) {
  const parts = [];
  let i = 0;

  while (i < nodes.length) {
    const node = nodes[i];

    if (node.type === 'h1') {
      parts.push(`<h1 class="log-h1">${inlineFormat(node.content)}</h1>`);
      i++;
    } else if (node.type === 'h2') {
      parts.push(`<h2 class="log-h2">${inlineFormat(node.content)}</h2>`);
      i++;
    } else if (node.type === 'bullet') {
      // Collect consecutive bullets into one <ul>
      const items = [];
      while (i < nodes.length && nodes[i].type === 'bullet') {
        items.push(`<li>${inlineFormat(nodes[i].content)}</li>`);
        i++;
      }
      parts.push(`<ul class="log-ul">${items.join('')}</ul>`);
    } else if (node.type === 'paragraph' || node.type === 'timestamp-line') {
      parts.push(`<p class="log-p">${inlineFormat(node.content)}</p>`);
      i++;
    } else {
      // blank — skip
      i++;
    }
  }

  return parts.join('\n') || '<p class="log-p log-error">Empty log file.</p>';
}

// ── Inline formatting ──────────────────────────────────────────
function inlineFormat(text) {
  // Escape first, then apply formatting spans
  let escaped = escapeHTML(text);
  // Wrap [HH:MM] timestamps
  escaped = escaped.replace(/\[(\d{2}:\d{2})\]/g,
    '<span class="log-timestamp">[$1]</span>');
  return escaped;
}

// ── XSS safety ────────────────────────────────────────────────
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Status bar ─────────────────────────────────────────────────
function updateStatusBar(index) {
  const el = document.getElementById('status-index');
  if (index.generated) {
    const d = new Date(index.generated);
    const ts = isNaN(d) ? index.generated : d.toLocaleString();
    el.textContent = `Index: ${ts}`;
  } else {
    el.textContent = `${index.files.length} log(s)`;
  }
}

function updateStatusBarError() {
  document.getElementById('status-index').textContent = 'Index unavailable';
}

// ── Resizable sidebar ──────────────────────────────────────────
(function initResize() {
  const handle = document.getElementById('resize-handle');
  const sidebar = document.getElementById('sidebar');
  const app = document.getElementById('app');
  let dragging = false;

  handle.addEventListener('mousedown', (e) => {
    dragging = true;
    handle.classList.add('dragging');
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const appRect = app.getBoundingClientRect();
    const newWidth = Math.max(160, Math.min(480, e.clientX - appRect.left));
    app.style.gridTemplateColumns = `${newWidth}px 4px 1fr`;
  });

  document.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      handle.classList.remove('dragging');
    }
  });

  // Touch resize
  handle.addEventListener('touchstart', e => {
    const touch = e.touches[0];
    let startX = touch.clientX;
    let startW = sidebar.offsetWidth;

    function onMove(ev) {
      ev.preventDefault();
      const dx = ev.touches[0].clientX - startX;
      const newW = Math.min(480, Math.max(160, startW + dx));
      app.style.gridTemplateColumns = `${newW}px 4px 1fr`;
    }
    function onEnd() {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      handle.classList.remove('dragging');
    }
    handle.classList.add('dragging');
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }, { passive: true });
})();

// ── Sidebar toggle (mobile) ────────────────────────────────────
const _sidebar  = document.getElementById('sidebar');
const _menuToggle = document.getElementById('menu-toggle');
const _backdrop   = document.getElementById('sidebar-backdrop');

function closeSidebar() {
  _sidebar.classList.remove('open');
  _backdrop.classList.remove('open');
}

_menuToggle?.addEventListener('click', () => {
  const isOpen = _sidebar.classList.toggle('open');
  _backdrop.classList.toggle('open', isOpen);
});
_backdrop?.addEventListener('click', closeSidebar);
