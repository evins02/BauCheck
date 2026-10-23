/* BauCheck – UI-Hilfsfunktionen (Formatierung, Icons, Modal, Toast, Lightbox, Bildverarbeitung) */
(function () {
  const BC = (window.BC = window.BC || {});

  const esc = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const nf = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 });
  const fmtCHF = (n) => 'CHF ' + nf.format(Math.round(n));
  const fmtDate = (ts) => new Date(ts).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const fmtDateTime = (ts) =>
    new Date(ts).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  function fmtRemaining(ms) {
    if (ms <= 0) return 'abgelaufen';
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d} T ${h} Std`;
    if (h > 0) return `${h} Std ${m} Min`;
    if (m > 0) return `${m} Min ${s % 60} Sek`;
    return `${s % 60} Sek`;
  }

  function relTime(ts) {
    const diff = Date.now() - ts;
    const abs = Math.abs(diff);
    const min = Math.round(abs / 60000);
    const fut = diff < 0;
    if (min < 1) return 'gerade eben';
    if (min < 60) return fut ? `in ${min} Min` : `vor ${min} Min`;
    const h = Math.round(min / 60);
    if (h < 24) return fut ? `in ${h} Std` : `vor ${h} Std`;
    const d = Math.round(h / 24);
    return fut ? `in ${d} ${d === 1 ? 'Tag' : 'Tagen'}` : `vor ${d} ${d === 1 ? 'Tag' : 'Tagen'}`;
  }

  // Schlanke Linien-Icons (24×24, stroke = currentColor)
  const ICONS = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
    camera: '<path d="M14.5 4h-5L7.5 6.5H4a1 1 0 0 0-1 1V19a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7.5a1 1 0 0 0-1-1h-3.5z"/><circle cx="12" cy="13" r="3.5"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    alert: '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    'arrow-left': '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 21v-4h6v4"/><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01"/>',
    bank: '<path d="m3 9 9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    ban: '<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    frame: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    folder: '<path d="M3 6a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-6 6-9 16-9 0 10-3 16-9 16z"/><path d="M4 20c4-6 8-8 12-10"/>',
    zap: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  };
  const icon = (name, cls = '') =>
    `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  const logo = (sub) => `
    <span class="logo"><span class="wordmark">Bau<span>Check</span></span>${sub ? `<small class="logo__sub">${esc(sub)}</small>` : ''}</span>`;

  /* ---------- Toast ---------- */
  function toast(message, tone = 'default') {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = `toast toast--${tone}`;
    el.innerHTML = `${icon(tone === 'error' ? 'alert' : 'check-circle')}<span>${esc(message)}</span>`;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }

  /* ---------- Modal ---------- */
  let lastFocus = null;
  function closeOverlay() {
    const root = document.getElementById('overlay-root');
    root.innerHTML = '';
    document.body.classList.remove('has-overlay');
    document.removeEventListener('keydown', overlayKeys);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  let keyHandler = null;
  function overlayKeys(e) {
    if (e.key === 'Escape') closeOverlay();
    if (keyHandler) keyHandler(e);
  }
  function mountOverlay(html, onKey) {
    lastFocus = document.activeElement;
    const root = document.getElementById('overlay-root');
    root.innerHTML = html;
    document.body.classList.add('has-overlay');
    keyHandler = onKey || null;
    document.addEventListener('keydown', overlayKeys);
    root.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeOverlay));
    root.querySelector('.overlay')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('overlay')) closeOverlay();
    });
    return root;
  }

  /**
   * modal({ title, eyebrow, body, confirmLabel, confirmTone, cancelLabel, onConfirm(root) → false verhindert Schliessen, onMount(root) })
   */
  function modal(opts) {
    const root = mountOverlay(`
      <div class="overlay">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <header class="modal__head">
            <div>
              ${opts.eyebrow ? `<p class="eyebrow">${esc(opts.eyebrow)}</p>` : ''}
              <h2 id="modal-title">${esc(opts.title)}</h2>
            </div>
            <button class="icon-btn" data-close aria-label="Schliessen">${icon('x')}</button>
          </header>
          <div class="modal__body">${opts.body}</div>
          ${
            opts.confirmLabel || opts.cancelLabel !== null
              ? `<footer class="modal__foot">
                  ${opts.cancelLabel === null ? '' : `<button class="btn btn--ghost" data-close>${esc(opts.cancelLabel || 'Abbrechen')}</button>`}
                  ${opts.confirmLabel ? `<button class="btn btn--${opts.confirmTone || 'primary'}" data-confirm>${esc(opts.confirmLabel)}</button>` : ''}
                </footer>`
              : ''
          }
        </div>
      </div>`);
    const confirm = root.querySelector('[data-confirm]');
    if (confirm)
      confirm.addEventListener('click', () => {
        if (opts.onConfirm && opts.onConfirm(root) === false) return;
        closeOverlay();
      });
    if (opts.onMount) opts.onMount(root);
    const first = root.querySelector('textarea, input, select, [data-confirm]');
    if (first) first.focus();
    return root;
  }

  /* ---------- Lightbox ---------- */
  function lightbox(items, start = 0) {
    let i = start;
    const render = () => {
      const it = items[i];
      root.querySelector('.lightbox__img').src = it.src;
      root.querySelector('.lightbox__img').alt = it.title;
      root.querySelector('.lightbox__title').textContent = it.title;
      root.querySelector('.lightbox__meta').innerHTML = it.meta || '';
      root.querySelector('.lightbox__count').textContent = `${i + 1} / ${items.length}`;
    };
    const go = (d) => {
      i = (i + d + items.length) % items.length;
      render();
    };
    const root = mountOverlay(
      `<div class="overlay overlay--dark">
        <div class="lightbox" role="dialog" aria-modal="true" aria-label="Fotoansicht">
          <div class="lightbox__bar">
            <span class="lightbox__count"></span>
            <button class="icon-btn icon-btn--light" data-close aria-label="Schliessen">${icon('x')}</button>
          </div>
          <div class="lightbox__stage">
            ${items.length > 1 ? `<button class="lightbox__nav lightbox__nav--prev" data-prev aria-label="Vorheriges Foto">${icon('chevron-left')}</button>` : ''}
            <img class="lightbox__img" alt="">
            ${items.length > 1 ? `<button class="lightbox__nav lightbox__nav--next" data-next aria-label="Nächstes Foto">${icon('chevron-right')}</button>` : ''}
          </div>
          <div class="lightbox__caption"><strong class="lightbox__title"></strong><span class="lightbox__meta"></span></div>
        </div>
      </div>`,
      (e) => {
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
      }
    );
    root.querySelector('[data-prev]')?.addEventListener('click', () => go(-1));
    root.querySelector('[data-next]')?.addEventListener('click', () => go(1));
    render();
  }

  /* ---------- Bildverarbeitung: verkleinern & komprimieren, damit localStorage reicht ---------- */
  function processImage(file, maxSide = 1280, quality = 0.72) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) return reject(new Error('Bitte wählen Sie eine Bilddatei.'));
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        const src = canvas.toDataURL('image/jpeg', quality);
        resolve({ src, w: img.naturalWidth, h: img.naturalHeight, bytes: Math.round((src.length * 3) / 4) });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Das Bild konnte nicht gelesen werden.'));
      };
      img.src = url;
    });
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    toast('Link in die Zwischenablage kopiert');
  }

  BC.ui = { esc, fmtCHF, fmtDate, fmtDateTime, fmtRemaining, relTime, icon, logo, toast, modal, closeOverlay, lightbox, processImage, copyText };
})();
