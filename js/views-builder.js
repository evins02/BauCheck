/* BauCheck – Kundenseite für die Bauherrschaft (mobile-first, geführte Fotoerfassung) */
(function () {
  const BC = (window.BC = window.BC || {});
  const { esc, icon, logo, fmtDate, fmtDateTime, toast, processImage, lightbox } = BC.ui;
  const { countdown, demoTag } = BC.parts;
  const S = () => BC.store;

  let flow = null;
  const getFlow = (token) => {
    if (!flow || flow.token !== token) flow = { token, step: 'intro', idx: 0, photos: {}, note: '', consent: false, busy: false };
    return flow;
  };

  function shell(content, link, { bare = false } = {}) {
    const active = link && S().linkState(link) === 'aktiv';
    return `
      <div class="builder">
        <div class="phone">
          ${
            bare
              ? ''
              : `<header class="b-head">
                  <a href="#/" aria-label="Zur Startseite">${logo()}</a>
                  <span class="b-head__right">
                    ${active ? `<span class="pill" title="Link gültig bis ${fmtDateTime(link.expiresAt)}">${icon('clock')}${countdown(link.expiresAt)}</span>` : ''}
                    <span class="b-lang">DE</span>
                  </span>
                </header>`
          }
          <main class="b-main">${content}</main>
          <footer class="b-foot">${icon('lock', 'icon--inline')}Sichere Übertragung an die ${esc(BC.BANK.name)} · Demo mit synthetischen Daten</footer>
        </div>
      </div>`;
  }

  const stateScreen = (ic, title, text, extra = '') =>
    `<div class="state-screen"><span class="state-screen__icon">${icon(ic)}</span><h1>${esc(title)}</h1><p class="muted">${text}</p>${extra}</div>`;

  const view = {
    render({ token }) {
      const link = S().getLink(token);
      const st = S().linkState(link);
      if (st === 'ungueltig') return shell(stateScreen('link', 'Link ungültig', 'Dieser Link ist nicht bekannt. Bitte prüfen Sie die Adresse oder kontaktieren Sie Ihre Bank.', `<a class="btn btn--ghost btn--block" href="#/">Zur Startseite</a>`));
      const p = S().getProject(link.projectId);
      const s = S().getStage(p, link.stageId);
      if (st === 'widerrufen')
        return shell(stateScreen('ban', 'Link nicht mehr gültig', `Die ${esc(BC.BANK.name)} hat diesen Link widerrufen. Falls Sie Fotos einreichen möchten, kontaktieren Sie bitte ${esc(p.advisor)}.`, `<a class="btn btn--ghost btn--block" href="#/">Zur Startseite</a>`));
      if (st === 'abgelaufen')
        return shell(
          stateScreen(
            'clock',
            'Link abgelaufen',
            `Dieser Link war bis ${fmtDateTime(link.expiresAt)} gültig. Aus Sicherheitsgründen sind Links zeitlich begrenzt. Bitte fordern Sie bei ${esc(p.advisor)} einen neuen Link an.`,
            `<div class="state-screen__box"><span class="muted small">Projekt</span><strong>${esc(p.name)}</strong><span class="muted small">Etappe ${s.no} · ${esc(s.title)}</span></div>
             <a class="btn btn--ghost btn--block" href="#/bank/p/${p.id}/${s.id}">Demo: Zur Bankansicht</a>`
          )
        );
      if (st === 'eingereicht') return shell(confirmation(p, s, link));

      const f = getFlow(token);
      const shots = S().shotsFor(s, link.shots);
      if (f.step === 'intro') return shell(intro(p, s, link, shots), link);
      if (f.step === 'shot') return shell(shotStep(p, s, shots, f), link, { bare: true });
      return shell(review(p, s, shots, f), link);
    },

    bind(root, { token }) {
      const link = S().getLink(token);
      if (S().linkState(link) !== 'aktiv') return;
      const p = S().getProject(link.projectId);
      const s = S().getStage(p, link.stageId);
      const shots = S().shotsFor(s, link.shots);
      const f = getFlow(token);
      const go = (step, idx = f.idx) => {
        f.step = step;
        f.idx = idx;
        BC.app.render();
        window.scrollTo({ top: 0 });
      };
      const firstOpen = () => {
        const i = shots.findIndex((sh) => !f.photos[sh.key]);
        return i < 0 ? null : i;
      };

      root.querySelector('[data-start]')?.addEventListener('click', () => go('shot', firstOpen() ?? 0));
      root.querySelector('[data-close-shot]')?.addEventListener('click', () => go('intro'));
      root.querySelector('[data-next]')?.addEventListener('click', () => {
        const next = shots.findIndex((sh, i) => i > f.idx && !f.photos[sh.key]);
        if (next >= 0) go('shot', next);
        else if (firstOpen() !== null) go('shot', firstOpen());
        else go('review');
      });
      root.querySelector('[data-retake]')?.addEventListener('click', () => {
        delete f.photos[shots[f.idx].key];
        BC.app.render();
      });
      root.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => go('shot', Number(b.dataset.goto))));
      root.querySelector('[data-to-review]')?.addEventListener('click', () => go('review'));

      root.querySelectorAll('input[type=file]').forEach((input) =>
        input.addEventListener('change', async () => {
          const file = input.files && input.files[0];
          if (!file) return;
          const shot = shots[f.idx];
          f.busy = true;
          BC.app.render();
          try {
            const img = await processImage(file);
            f.photos[shot.key] = { id: S().rid(), shotKey: shot.key, title: shot.title, kind: 'upload', src: img.src, w: img.w, h: img.h, takenAt: Date.now() };
          } catch (e) {
            toast(e.message, 'error');
          }
          f.busy = false;
          BC.app.render();
        })
      );
      root.querySelector('[data-sample]')?.addEventListener('click', () => {
        const shot = shots[f.idx];
        f.photos[shot.key] = { id: S().rid(), shotKey: shot.key, title: shot.title, kind: 'synthetic', seed: S().rid(6), w: 4032, h: 3024, takenAt: Date.now() };
        BC.app.render();
      });
      root.querySelector('[data-preview]')?.addEventListener('click', () => {
        const ph = f.photos[shots[f.idx].key];
        lightbox([{ src: S().photoSrc(p, s, ph), title: ph.title, meta: '' }]);
      });

      const note = root.querySelector('[name=note]');
      note?.addEventListener('input', () => (f.note = note.value));
      const consent = root.querySelector('[name=consent]');
      const submitBtn = root.querySelector('[data-submit]');
      const complete = shots.every((sh) => f.photos[sh.key]);
      consent?.addEventListener('change', () => {
        f.consent = consent.checked;
        submitBtn.disabled = !(complete && f.consent);
      });
      submitBtn?.addEventListener('click', () => {
        if (!(complete && f.consent)) return;
        try {
          S().submit(token, shots.map((sh) => f.photos[sh.key]), f.note.trim());
          flow = null;
          BC.app.render();
          window.scrollTo({ top: 0 });
        } catch (e) {
          toast(e.message === 'Speicher voll' ? 'Speicher voll – bitte Demo zurücksetzen oder weniger Fotos verwenden.' : 'Der Link ist nicht mehr gültig.', 'error');
          BC.app.render();
        }
      });
    },
  };

  function intro(p, s, link, shots) {
    const hero = BC.scene({ stageKey: s.key, view: 'aussen', seed: `hero-${p.id}`, title: '', projectName: p.name, owner: p.owner.name });
    const town = p.address.split(',').pop().trim().replace(/^\d{4}\s*/, '');
    return `
      <section class="b-intro">
        <p class="eyebrow">Baufortschritt erfassen</p>
        <h1>${esc(p.name)}</h1>
        <p class="b-loc">${icon('pin')}${esc(town)}</p>
        <img class="b-hero" src="${hero}" alt="Synthetische Illustration der Baustelle">

        <div class="b-list">
          <div class="b-list__row"><span class="b-num">${s.no}</span><span><strong>Aktueller Bauabschnitt</strong><span class="muted">${esc(s.title)}</span></span></div>
          <div class="b-list__row">${icon('calendar')}<span><strong>Link gültig bis</strong><span class="muted">${fmtDateTime(link.expiresAt)}</span></span><span class="tag-blue">noch ${countdown(link.expiresAt)}</span></div>
          <div class="b-list__row">${icon('file')}<span><strong>Erforderliche Nachweise</strong><span class="muted">${shots.length} ${shots.length === 1 ? 'Perspektive' : 'Perspektiven'}</span></span></div>
        </div>

        ${link.note ? `<div class="b-message">${icon('message')}<div><p class="small muted">Nachricht von ${esc(p.advisor)}, ${esc(BC.BANK.name)}</p><p>${esc(link.note)}</p></div></div>` : ''}

        <ul class="b-tips">
          <li>${icon('sun')}Bei Tageslicht</li>
          <li>${icon('frame')}Ganzes Objekt im Bild</li>
          <li>${icon('user')}Keine Personen erkennbar</li>
          <li>${icon('shield')}Nur von sicheren Standorten</li>
        </ul>

        <div class="b-actions">
          <button class="btn btn--blue btn--lg btn--block" data-start>${icon('camera')}Jetzt Fotos erfassen</button>
          <p class="muted small center">Dauer ca. 3–5 Minuten · ohne Registrierung ${demoTag()}</p>
        </div>
      </section>`;
  }

  function strip(p, s, shots, f) {
    return `<div class="b-strip" role="list">${shots
      .map((sh, i) => {
        const ph = f.photos[sh.key];
        const cls = i === f.idx ? 'is-current' : ph ? 'is-done' : '';
        return `<button role="listitem" class="b-strip__item ${cls}" data-goto="${i}" aria-label="${i + 1}. ${esc(sh.title)}${ph ? ' – erfasst' : ''}">
          <span class="b-strip__thumb">${ph ? `<img src="${S().photoSrc(p, s, ph)}" alt="">` : icon('image')}</span>
          <span class="b-strip__badge">${ph && i !== f.idx ? icon('check') : i + 1}</span>
          <span class="b-strip__label">${esc(sh.title)}</span>
        </button>`;
      })
      .join('')}</div>`;
  }

  function shotStep(p, s, shots, f) {
    const shot = shots[f.idx];
    const ph = f.photos[shot.key];
    const example = BC.scene({ stageKey: s.key, view: shot.view, seed: 'beispiel', title: shot.title, projectName: p.name, owner: p.owner.name });
    const allDone = shots.every((sh) => f.photos[sh.key]);
    return `
      <section class="b-shot">
        <div class="b-shot__bar">
          <button class="icon-btn" data-close-shot aria-label="Zurück zur Übersicht">${icon('x')}</button>
          <strong>${esc(shot.title)}</strong>
          <span class="b-shot__count">${f.idx + 1}/${shots.length}</span>
        </div>
        <div class="b-info">${icon('camera')}<span>${esc(shot.hint)}</span></div>

        <div class="viewfinder ${ph ? 'has-photo' : ''}">
          ${
            f.busy
              ? `<div class="viewfinder__busy"><span class="spinner spinner--light"></span><p>Foto wird verarbeitet …</p></div>`
              : ph
              ? `<button class="viewfinder__img" data-preview aria-label="Foto vergrössern"><img src="${S().photoSrc(p, s, ph)}" alt="${esc(shot.title)}"></button>
                 <span class="viewfinder__ok">${icon('check')}Foto erfasst · ${fmtDateTime(ph.takenAt).split(', ')[1] || ''}</span>`
              : `<img class="viewfinder__example" src="${example}" alt="Beispielansicht für ${esc(shot.title)}">
                 <span class="viewfinder__label">Beispiel</span>`
          }
          <span class="corner corner--tl"></span><span class="corner corner--tr"></span><span class="corner corner--bl"></span><span class="corner corner--br"></span>
          ${
            !ph && !f.busy
              ? `<div class="viewfinder__controls">
                  <label class="vf-btn" title="Aus Galerie wählen">${icon('image')}<span class="sr-only">Aus Galerie wählen</span><input type="file" accept="image/*" class="sr-only"></label>
                  <label class="shutter" title="Foto aufnehmen"><span class="sr-only">Foto aufnehmen</span><input type="file" accept="image/*" capture="environment" class="sr-only"></label>
                  <button class="vf-btn vf-btn--text" data-sample title="Synthetisches Beispielfoto verwenden">Demo</button>
                </div>`
              : ''
          }
        </div>

        ${
          ph
            ? `<div class="b-actions b-actions--split">
                <button class="btn btn--ghost btn--lg" data-retake>${icon('refresh')}Neu aufnehmen</button>
                <button class="btn btn--blue btn--lg" data-next>${allDone ? 'Zur Übersicht' : 'Weiter'}${icon('arrow-right')}</button>
              </div>`
            : `<p class="muted small center b-shot__help">Auslöser antippen, um die Kamera zu öffnen. Am Computer: «Demo» verwendet ein synthetisches Beispielfoto.</p>`
        }

        ${strip(p, s, shots, f)}
        ${allDone ? `<button class="btn btn--ghost btn--block b-shot__review" data-to-review>Alle Fotos erfasst – zur Übersicht${icon('arrow-right')}</button>` : ''}
      </section>`;
  }

  function review(p, s, shots, f) {
    const complete = shots.every((sh) => f.photos[sh.key]);
    const done = shots.filter((sh) => f.photos[sh.key]).length;
    return `
      <section class="b-review">
        <p class="eyebrow">Schritt 3 von 3</p>
        <h1>Prüfen & einreichen</h1>
        <p class="muted">Kontrollieren Sie Ihre Aufnahmen. Tippen Sie auf ein Foto, um es zu ersetzen.</p>

        <div class="b-sublist">
          <div class="b-sublist__head"><strong>Erfasste Nachweise</strong><span class="${complete ? 'ok-text' : 'warn-text'}">${done} von ${shots.length}</span></div>
          ${shots
            .map((sh, i) => {
              const ph = f.photos[sh.key];
              return `<button class="b-sublist__row" data-goto="${i}">
                ${ph ? `<span class="b-check">${icon('check')}</span>` : `<span class="b-check b-check--missing">${icon('alert')}</span>`}
                ${ph ? `<img src="${S().photoSrc(p, s, ph)}" alt="">` : `<span class="b-sublist__empty">${icon('camera')}</span>`}
                <span class="b-sublist__text"><strong>${esc(sh.title)}</strong><span class="muted small">${ph ? fmtDateTime(ph.takenAt) : 'Noch nicht erfasst'}</span></span>
                ${icon('chevron-right', 'muted')}
              </button>`;
            })
            .join('')}
        </div>

        <label class="field"><span>Bemerkung an die Bank <span class="muted">(optional)</span></span>
          <textarea name="note" rows="3" placeholder="z. B. Gerüst wird nächste Woche abgebaut.">${esc(f.note)}</textarea></label>

        <label class="check check--box"><input type="checkbox" name="consent" ${f.consent ? 'checked' : ''}>
          <span>Ich bestätige, dass die Fotos den aktuellen Zustand der Baustelle zeigen und heute aufgenommen wurden.</span></label>

        <div class="b-actions">
          <button class="btn btn--blue btn--lg btn--block" data-submit ${complete && f.consent ? '' : 'disabled'}>${icon('send')}Nachweise einreichen</button>
          ${complete ? '' : `<p class="small center warn-text">${icon('alert', 'icon--inline')}Bitte erfassen Sie zuerst alle Aufnahmen.</p>`}
        </div>
      </section>`;
  }

  function confirmation(p, s, link) {
    const sub = s.submissions.find((x) => x.id === link.submissionId) || s.submissions.find((x) => x.token === link.token);
    const shots = S().shotsFor(s, link.shots);
    return `
      <section class="b-done">
        <span class="b-done__icon">${icon('check')}</span>
        <h1>Nachweise erfolgreich eingereicht!</h1>
        <p class="muted">Ihre Fotos und Angaben wurden am ${sub ? fmtDate(sub.submittedAt) + ', ' + fmtDateTime(sub.submittedAt).split(', ')[1] + ' Uhr' : '–'} übermittelt.</p>

        <div class="b-bankinfo">${icon('bank')}<span>Die Bank prüft nun Ihre Unterlagen. ${esc(p.advisor)} meldet sich, falls weitere Fotos nötig sind.</span></div>

        <div class="b-sublist">
          <div class="b-sublist__head"><strong>Eingereichte Nachweise</strong><span class="ok-text">${sub ? sub.photos.length : 0} von ${shots.length}</span></div>
          ${(sub ? sub.photos : [])
            .map(
              (ph) => `<div class="b-sublist__row">
                <span class="b-check">${icon('check')}</span>
                <img src="${S().photoSrc(p, s, ph)}" alt="">
                <span class="b-sublist__text"><strong>${esc(ph.title)}</strong><span class="muted small">${fmtDateTime(ph.takenAt)} Uhr</span></span>
              </div>`
            )
            .join('')}
        </div>

        <div class="b-list">
          <div class="b-list__row">${icon('file')}<span><strong>Referenz</strong><span class="muted mono">${esc(sub?.ref || '–')}</span></span></div>
          <div class="b-list__row"><span class="b-num">${s.no}</span><span><strong>${esc(p.name)}</strong><span class="muted">${esc(s.title)}</span></span></div>
        </div>

        <aside class="notice notice--soft">${icon('info')}<div>Diese Bestätigung ist <strong>kein Kredit- oder Auszahlungsentscheid</strong>. Eine allfällige Auszahlung erfolgt in einem separaten Bankprozess. Demo mit synthetischen Daten.</div></aside>

        <div class="b-actions">
          <a class="btn btn--ghost btn--block" href="#/bank/p/${p.id}/${s.id}">Demo: Zur Bankansicht wechseln</a>
        </div>
      </section>`;
  }

  BC.views = BC.views || {};
  BC.views.builder = view;
})();
