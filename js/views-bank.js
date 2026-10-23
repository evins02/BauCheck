/* BauCheck – Ansichten für Bankmitarbeitende */
(function () {
  const BC = (window.BC = window.BC || {});
  const { esc, icon, logo, fmtCHF, fmtDate, fmtDateTime, relTime, modal, toast, lightbox, copyText } = BC.ui;
  const { chip, demoTag, countdown, linkUrl } = BC.parts;
  const S = () => BC.store;

  const ui = { filter: 'alle', query: '', tab: 'abschnitt', tabFor: null };

  const ATTENTION = ['eingereicht', 'nachforderung', 'vorort', 'angefordert'];
  const focusStage = (p) => p.stages.find((s) => ATTENTION.includes(s.status)) || p.stages.find((s) => s.status === 'geplant') || p.stages[p.stages.length - 1];
  const fmtMio = (n) => (n >= 1e6 ? `CHF ${(n / 1e6).toLocaleString('de-CH', { maximumFractionDigits: 2 })} Mio.` : fmtCHF(n));
  const initials = (name) => name.replace(/\(.*?\)/g, '').split(/[\s&]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const thumb = (p) => {
    const s = focusStage(p);
    return BC.scene({ stageKey: s.key, view: 'aussen', seed: `thumb-${p.id}`, title: '', projectName: p.name, owner: p.owner.name });
  };
  const inboxItems = () =>
    S()
      .state.projects.flatMap((p) => p.stages.map((s) => ({ p, s })))
      .filter(({ s }) => s.status === 'eingereicht')
      .map((x) => ({ ...x, sub: S().latestSubmission(x.s) }))
      .sort((a, b) => b.sub.submittedAt - a.sub.submittedAt);

  function shell(content, active) {
    const inbox = inboxItems().length;
    const nav = [
      ['overview', '#/bank', 'home', 'Übersicht'],
      ['projects', '#/bank/p', 'folder', 'Bauprojekte'],
      ['inbox', '#/bank/inbox', 'inbox', 'Prüf-Inbox', inbox],
    ];
    return `
      <div class="app">
        <aside class="side">
          <a href="#/bank" class="side__brand">${logo()}</a>
          <nav class="side__nav" aria-label="Hauptnavigation">
            ${nav
              .map(
                ([k, href, ic, label, badge]) =>
                  `<a href="${href}" class="${active === k ? 'is-active' : ''}">${icon(ic)}<span>${label}</span>${badge ? `<span class="badge">${badge}</span>` : ''}</a>`
              )
              .join('')}
          </nav>
          <div class="side__foot">
            <a href="#/" class="side__link">${icon('refresh')}<span>Rolle wechseln</span></a>
            <button class="side__link" data-action="reset">${icon('layers')}<span>Demo zurücksetzen</span></button>
            <div class="usercard">
              <span class="avatar">${esc(initials(BC.BANK.user))}</span>
              <span><strong>${esc(BC.BANK.user)}</strong><small>Kreditmanagement · ${esc(BC.BANK.name)}</small></span>
            </div>
          </div>
        </aside>
        <main class="app__main">${content}</main>
      </div>`;
  }

  /* ================= Übersicht ================= */
  const overview = {
    render({ inboxOnly } = {}) {
      const { projects } = S().state;
      const all = projects.flatMap((p) => p.stages.map((s) => ({ p, s })));
      const count = (st) => all.filter(({ s }) => st.includes(s.status)).length;
      const inbox = inboxItems();

      const inboxCard = `
        <section class="card">
          <div class="card__head"><h2>Prüf-Inbox</h2><span class="muted small">Neueste zuerst</span></div>
          ${
            inbox.length
              ? `<ul class="inbox">${inbox
                  .map(
                    ({ p, s, sub }) => `<li><a class="inbox__item" href="#/bank/p/${p.id}/${s.id}">
                      <img class="inbox__thumb" src="${S().photoSrc(p, s, sub.photos[0])}" alt="">
                      <span class="inbox__main"><strong>${esc(p.name)}</strong><span class="muted small">Etappe ${s.no} · ${esc(s.title)} · ${sub.photos.length} Fotos · ${esc(relTime(sub.submittedAt))}</span></span>
                      ${chip(s.status)}
                      ${icon('chevron-right', 'muted hide-sm')}
                    </a></li>`
                  )
                  .join('')}</ul>`
              : `<div class="empty">${icon('check-circle')}<p>Alles geprüft. Neue Einreichungen erscheinen hier.</p></div>`
          }
        </section>`;

      if (inboxOnly)
        return shell(
          `<div class="page"><header class="page-head"><div><p class="eyebrow">Baukredit-Monitoring</p><h1>Prüf-Inbox</h1></div></header>${inboxCard}</div>`,
          'inbox'
        );

      const filters = [
        ['alle', 'Alle'],
        ['pruefung', 'In Prüfung'],
        ['offen', 'Nachreichung'],
        ['vorort', 'Vor-Ort'],
      ];
      const match = (p) => {
        const q = ui.query.trim().toLowerCase();
        if (q && ![p.name, p.address, p.owner.name, p.ref].join(' ').toLowerCase().includes(q)) return false;
        if (ui.filter === 'pruefung') return p.stages.some((s) => s.status === 'eingereicht');
        if (ui.filter === 'offen') return p.stages.some((s) => ['angefordert', 'nachforderung'].includes(s.status));
        if (ui.filter === 'vorort') return p.stages.some((s) => s.status === 'vorort');
        return true;
      };
      const list = projects.filter(match);
      const volume = projects.reduce((n, p) => n + p.creditLimit, 0);

      return shell(
        `<div class="page">
        <header class="page-head">
          <div>
            <p class="eyebrow">Baukredit-Monitoring</p>
            <h1>Guten Tag, ${esc(BC.BANK.user.split(' ')[0])}</h1>
            <p class="muted">${inbox.length ? `${inbox.length} ${inbox.length === 1 ? 'Einreichung wartet' : 'Einreichungen warten'} auf Ihre Prüfung.` : 'Keine offenen Einreichungen.'}</p>
          </div>
        </header>

        <section class="kpis">
          ${kpi('Bauprojekte', projects.length, 'folder', 'neutral', fmtMio(volume) + ' Kreditvolumen')}
          ${kpi('In Prüfung', count(['eingereicht']), 'inbox', 'review', 'Fotonachweise eingegangen')}
          ${kpi('Nachreichung', count(['angefordert', 'nachforderung']), 'camera', 'warn', 'Warten auf Bauherrschaft')}
          ${kpi('Vor-Ort-Besuch', count(['vorort']), 'pin', 'alert', 'Begehung empfohlen')}
        </section>

        ${inboxCard}

        <section class="card">
          <div class="card__head card__head--wrap">
            <h2>Bauprojekte</h2>
            <div class="toolbar">
              <div class="segmented" role="tablist">${filters
                .map(([k, l]) => `<button role="tab" aria-selected="${ui.filter === k}" class="${ui.filter === k ? 'is-active' : ''}" data-filter="${k}">${l}</button>`)
                .join('')}</div>
              <label class="search">${icon('search')}<input type="search" placeholder="Projekte suchen …" value="${esc(ui.query)}" data-search aria-label="Projekte durchsuchen"></label>
            </div>
          </div>
          <div class="ptable" role="table">
            <div class="ptable__row ptable__row--head" role="row">
              <span role="columnheader">Projekt</span><span role="columnheader">Bauherrschaft</span><span role="columnheader">Kredit</span><span role="columnheader">Etappen</span><span role="columnheader">Status</span><span></span>
            </div>
            ${
              list.length
                ? list
                    .map((p) => {
                      const f = focusStage(p);
                      const done = p.stages.filter((s) => s.status === 'ausreichend').length;
                      return `<a class="ptable__row" role="row" href="#/bank/p/${p.id}">
                        <span class="ptable__project" role="cell"><img src="${thumb(p)}" alt=""><span><strong>${esc(p.name)}</strong><span class="muted small">${esc(p.type)}</span></span></span>
                        <span role="cell" class="ptable__owner">${esc(p.owner.name)}</span>
                        <span role="cell" class="num ptable__credit">${fmtMio(p.creditLimit)}</span>
                        <span role="cell" class="ptable__stages">${stageBar(p)}<span class="muted small">${done}/${p.stages.length} bestätigt</span></span>
                        <span role="cell" class="ptable__status"><span class="muted small">${f.no}. ${esc(f.title)}</span>${chip(f.status)}</span>
                        <span class="ptable__go">${icon('chevron-right')}</span>
                      </a>`;
                    })
                    .join('')
                : `<div class="empty"><p>Keine Projekte für diesen Filter.</p></div>`
            }
          </div>
        </section>
        </div>`,
        'overview'
      );
    },
    bind: bindFilters,
  };

  function bindFilters(root) {
    root.querySelectorAll('[data-filter]').forEach((b) =>
      b.addEventListener('click', () => {
        ui.filter = b.dataset.filter;
        BC.app.render();
      })
    );
    const input = root.querySelector('[data-search]');
    input?.addEventListener('input', () => {
      ui.query = input.value;
      const pos = input.selectionStart;
      BC.app.render();
      const again = document.querySelector('[data-search]');
      again.focus();
      again.setSelectionRange(pos, pos);
    });
  }

  const kpi = (label, value, ic, tone, sub) => `
    <div class="kpi kpi--${tone}">
      <span class="kpi__icon">${icon(ic)}</span>
      <span class="kpi__value">${value}</span>
      <span class="kpi__label">${esc(label)}</span>
      <span class="kpi__sub">${esc(sub)}</span>
    </div>`;

  function stageBar(p) {
    return `<span class="stagebar" aria-label="Etappenstatus">${p.stages
      .map((s) => `<span class="stagebar__seg stagebar__seg--${BC.STATUS[s.status].tone}" title="${s.no}. ${esc(s.title)}: ${esc(BC.STATUS[s.status].label)}"></span>`)
      .join('')}</span>`;
  }

  /* ================= Projekt-Arbeitsbereich ================= */
  function resolve({ pid, sid }) {
    const { projects } = S().state;
    const p = S().getProject(pid) || (pid ? null : inboxItems()[0]?.p || projects[0]);
    if (!p) return {};
    const s = (sid && S().getStage(p, sid)) || focusStage(p);
    return { p, s };
  }

  const project = {
    render(params) {
      const { p, s } = resolve(params);
      if (!p) return shell(`<div class="page"><div class="state-screen"><h1>Projekt nicht gefunden</h1><a class="btn btn--primary" href="#/bank">Zur Übersicht</a></div></div>`, 'projects');
      if (ui.tabFor !== s.id) {
        ui.tab = 'abschnitt';
        ui.tabFor = s.id;
      }
      const q = ui.query.trim().toLowerCase();
      const list = S().state.projects.filter((x) => !q || [x.name, x.address, x.owner.name].join(' ').toLowerCase().includes(q));
      const tabs = [
        ['abschnitt', 'Bauabschnitt'],
        ['verlauf', 'Verlauf'],
        ['links', 'Demo-Links'],
        ['projekt', 'Projektdaten'],
      ];

      return shell(
        `<div class="workspace">
          <section class="plist" aria-label="Bauprojekte">
            <div class="plist__head">
              <h2>Bauprojekte</h2>
              <label class="search search--block">${icon('search')}<input type="search" placeholder="Projekte suchen …" value="${esc(ui.query)}" data-search aria-label="Projekte durchsuchen"></label>
              <p class="muted small">Aktive Projekte (${list.length})</p>
            </div>
            <ul>${list
              .map((x) => {
                const f = focusStage(x);
                return `<li><a href="#/bank/p/${x.id}" class="pitem ${x.id === p.id ? 'is-active' : ''}">
                  <img src="${thumb(x)}" alt="">
                  <span class="pitem__body"><strong>${esc(x.name)}</strong><span class="muted">${esc(x.type)}</span><span class="muted">${fmtMio(x.creditLimit)}</span></span>
                  ${chip(f.status, true)}
                </a></li>`;
              })
              .join('')}</ul>
          </section>

          <section class="detail">
            <a class="back show-md" href="#/bank/p">${icon('arrow-left')}Alle Projekte</a>
            <header class="detail__head">
              <div>
                <h1>${esc(p.name)}</h1>
                <p class="detail__sub"><span>${esc(p.type)}</span><span>Kredit ${fmtMio(p.creditLimit)}</span><span>ID ${esc(p.ref)}</span></p>
              </div>
              ${chip(s.status)}
            </header>
            <nav class="tabs" role="tablist">${tabs
              .map(([k, l]) => `<button role="tab" aria-selected="${ui.tab === k}" class="${ui.tab === k ? 'is-active' : ''}" data-tab="${k}">${l}</button>`)
              .join('')}</nav>

            <div class="detail__grid">
              <div class="detail__main">${tabContent(p, s)}</div>
              <aside class="detail__aside">${decisionPanel(p, s)}${activityPanel(p)}</aside>
            </div>
          </section>
        </div>`,
        'projects'
      );
    },
    bind(root, params) {
      const { p, s } = resolve(params);
      if (!p) return;
      bindFilters(root);
      root.querySelectorAll('[data-tab]').forEach((b) =>
        b.addEventListener('click', () => {
          ui.tab = b.dataset.tab;
          BC.app.render();
        })
      );
      root.querySelectorAll('[data-stage]').forEach((b) => b.addEventListener('click', () => (location.hash = `#/bank/p/${p.id}/${b.dataset.stage}`)));
      root.querySelectorAll('[data-action="create-link"]').forEach((b) => b.addEventListener('click', () => createLinkModal(p, s)));
      root.querySelectorAll('[data-decide]').forEach((b) => b.addEventListener('click', () => decideModal(p, s, b.dataset.decide)));
      root.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => copyText(linkUrl(b.dataset.copy))));
      root.querySelectorAll('[data-revoke]').forEach((b) =>
        b.addEventListener('click', () =>
          modal({
            title: 'Demo-Link widerrufen?',
            body: `<p>Der Link kann danach nicht mehr verwendet werden. Bereits eingereichte Fotos bleiben erhalten.</p>`,
            confirmLabel: 'Widerrufen',
            confirmTone: 'danger',
            onConfirm: () => {
              S().revokeLink(b.dataset.revoke);
              toast('Link widerrufen');
              BC.app.render();
            },
          })
        )
      );
      root.querySelectorAll('[data-photo]').forEach((el) =>
        el.addEventListener('click', () => {
          const sub = s.submissions.find((x) => x.id === el.dataset.sub);
          const items = sub.photos.map((ph) => ({ src: S().photoSrc(p, s, ph), title: ph.title, meta: photoMeta(ph) }));
          lightbox(items, Number(el.dataset.photo));
        })
      );
    },
  };

  const photoMeta = (ph) =>
    [`Aufgenommen ${fmtDateTime(ph.takenAt)}`, ph.w ? `${ph.w}×${ph.h} px` : '', ph.kind === 'synthetic' ? 'Synthetisches Demobild' : 'Lokal erfasst (Demo)']
      .filter(Boolean)
      .map(esc)
      .join(' · ');

  function tabContent(p, s) {
    if (ui.tab === 'verlauf') return historyTab(p, s);
    if (ui.tab === 'links') return linksTab(p, s);
    if (ui.tab === 'projekt') return projectTab(p);
    return stageTab(p, s);
  }

  function timeline(p, s) {
    return `
      <div class="card">
        <div class="card__head"><h3>Baufortschritt / Timeline</h3><span class="muted small">${p.stages.filter((x) => x.status === 'ausreichend').length} von ${p.stages.length} Etappen bestätigt</span></div>
        <ol class="stepper">${p.stages
          .map((x, i) => {
            const tone = BC.STATUS[x.status].tone;
            const prevDone = i > 0 && p.stages[i - 1].status === 'ausreichend';
            return `<li class="stepper__item stepper__item--${tone} ${x.id === s.id ? 'is-active' : ''} ${prevDone ? 'is-linked' : ''}">
              <button data-stage="${x.id}" aria-current="${x.id === s.id}" title="${esc(BC.STATUS[x.status].label)}">
                <span class="stepper__dot">${x.status === 'ausreichend' ? icon('check') : x.no}</span>
                <span class="stepper__label">${esc(x.title)}</span>
                <span class="stepper__meta">${x.status === 'geplant' ? 'Offen' : esc(BC.STATUS[x.status].short)}</span>
              </button>
            </li>`;
          })
          .join('')}</ol>
      </div>`;
  }

  function stageTab(p, s) {
    const sub = S().latestSubmission(s);
    let html = '';
    if (sub) {
      const link = S().getLink(sub.token);
      const required = S().shotsFor(s, link?.shots);
      const checks = S().checks(s, sub);
      const failing = checks.filter((c) => !c.ok);
      const shown = sub.photos.slice(0, 3);
      const more = sub.photos.length - shown.length;
      html += `
        <div class="card">
          <div class="card__head card__head--wrap">
            <div><h3>Aktueller Bauabschnitt</h3><p class="muted small">Eingereicht am ${fmtDateTime(sub.submittedAt)}</p></div>
            <span class="tag-blue">${esc(s.title)}</span>
          </div>
          <div class="evidence">
            <div class="mosaic mosaic--${Math.min(shown.length, 3)}">
              ${shown
                .map(
                  (ph, i) => `<button class="mosaic__item" data-photo="${i}" data-sub="${sub.id}" aria-label="${esc(ph.title)} vergrössern">
                    <img src="${S().photoSrc(p, s, ph)}" alt="${esc(ph.title)}">
                    <span class="mosaic__cap">${esc(ph.title)}</span>
                    ${i === shown.length - 1 && more > 0 ? `<span class="mosaic__more">+${more} weitere Fotos</span>` : ''}
                  </button>`
                )
                .join('')}
            </div>
            <dl class="meta">
              <div>${icon('layers')}<dt>Bauabschnitt</dt><dd>${s.no}. ${esc(s.title)}</dd></div>
              <div>${icon('calendar')}<dt>Erfasst am</dt><dd>${fmtDateTime(sub.submittedAt)}</dd></div>
              <div>${icon('user')}<dt>Erfasst von</dt><dd>${esc(p.owner.name)} (Bauherrschaft)</dd></div>
              <div>${icon('image')}<dt>Fotos</dt><dd>${sub.photos.length} von ${required.length} angefordert</dd></div>
              <div>${icon('file')}<dt>Referenz</dt><dd class="mono">${esc(sub.ref)}</dd></div>
              <div>${icon('pin')}<dt>Standort</dt><dd class="muted">nicht übermittelt (Demo)</dd></div>
            </dl>
          </div>
          ${link?.note && s.decisions.length ? `<p class="quote quote--bank">${icon('message')}<span><strong>Anfrage der Bank:</strong> ${esc(link.note)}</span></p>` : ''}
          ${sub.note ? `<p class="quote">${icon('message')}<span><strong>Bemerkung Bauherrschaft:</strong> ${esc(sub.note)}</span></p>` : ''}
          ${
            required.some((r) => !sub.photos.some((ph) => ph.shotKey === r.key)) || sub.photos.length > 3
              ? `<div class="shotrow">${required
                  .map((r) => {
                    const i = sub.photos.findIndex((ph) => ph.shotKey === r.key);
                    return i < 0
                      ? `<span class="shotrow__item is-missing">${icon('alert')}${esc(r.title)}</span>`
                      : `<button class="shotrow__item" data-photo="${i}" data-sub="${sub.id}">${icon('check-circle')}${esc(r.title)}</button>`;
                  })
                  .join('')}</div>`
              : ''
          }
        </div>
        ${timeline(p, s)}
        ${
          failing.length
            ? `<div class="banner banner--warn">${icon('alert')}<div><strong>Unvollständige oder auffällige Nachweise</strong>
                <ul>${failing.map((c) => `<li>${esc(c.label)}: ${esc(c.detail)}</li>`).join('')}</ul></div></div>`
            : `<div class="banner banner--ok">${icon('shield')}<div><strong>Automatische Hinweise: keine Auffälligkeiten</strong> ${demoTag()}
                <ul>${checks.map((c) => `<li>${esc(c.label)} – ${esc(c.detail)}</li>`).join('')}</ul>
                <p class="small muted">Die Hinweise unterstützen die Prüfung und ersetzen keine fachliche Beurteilung.</p></div></div>`
        }`;
    } else {
      const activeLink = S().linksFor(s.id).find((l) => S().linkState(l) === 'aktiv');
      html += `
        <div class="card">
          <div class="card__head"><div><h3>Aktueller Bauabschnitt</h3><p class="muted small">Noch keine Fotos eingereicht</p></div><span class="tag-blue">${esc(s.title)}</span></div>
          <div class="empty empty--left">
            ${icon('image')}
            <div><p class="muted">${
              activeLink
                ? `Ein Demo-Link ist aktiv (noch ${countdown(activeLink.expiresAt)}). Die Bauherrschaft kann jetzt Fotos erfassen.`
                : 'Erstellen Sie einen zeitlich begrenzten Link, damit die Bauherrschaft die Fotos erfassen kann.'
            }</p></div>
          </div>
          <div class="required">
            <p class="small muted">Geführte Aufnahmen für diese Etappe</p>
            <ol>${S().shotsFor(s).map((shot) => `<li>${icon('camera')}${esc(shot.title)}</li>`).join('')}</ol>
          </div>
          <div class="card__actions">
            ${
              activeLink
                ? `<a class="btn btn--secondary btn--sm" href="#/b/${activeLink.token}" target="_blank" rel="noopener">${icon('external')}Link als Bauherr öffnen</a>`
                : `<button class="btn btn--primary btn--sm" data-action="create-link">${icon('plus')}Demo-Link erstellen</button>`
            }
          </div>
        </div>
        ${timeline(p, s)}`;
    }
    return html;
  }

  function decisionPanel(p, s) {
    const sub = S().latestSubmission(s);
    const sub3 = {
      ausreichend: 'Baufortschritt plausibel und vollständig dokumentiert.',
      nachforderung: 'Gezielt zusätzliche Aufnahmen per neuem Link anfordern.',
      vorort: 'Besichtigung durch Fachperson veranlassen.',
    };
    return `
      <div class="card decision">
        <div class="card__head"><h3>Entscheid</h3>${demoTag()}</div>
        ${
          sub
            ? `<div class="decision__list">${Object.entries(BC.DECISIONS)
                .map(
                  ([k, d]) => `<button class="dopt dopt--${d.tone} ${s.status === k ? 'is-current' : ''}" data-decide="${k}">
                    <span class="dopt__icon">${icon(d.icon)}</span>
                    <span><strong>${esc({ ausreichend: 'Nachweise ausreichend', nachforderung: 'Weitere Fotos anfordern', vorort: 'Vor-Ort-Besuch empfehlen' }[k])}</strong><small>${esc(sub3[k])}</small></span>
                    ${s.status === k ? `<span class="dopt__state">Aktuell</span>` : ''}
                  </button>`
                )
                .join('')}</div>`
            : `<p class="muted small">Ein Entscheid ist möglich, sobald die Bauherrschaft Fotos eingereicht hat.</p>`
        }
        <p class="hint">${icon('lock')}<span>Demo-Vermerk ohne Rechtswirkung. Eine Freigabe der Tranche (${fmtCHF(s.amount)}) erfolgt <strong>nicht</strong> in BauCheck, sondern separat im Kernbankensystem.</span></p>
      </div>`;
  }

  function activityPanel(p) {
    return `
      <div class="card">
        <div class="card__head"><h3>Letzte Aktivitäten</h3></div>
        <ul class="feed">${p.activity
          .slice(0, 5)
          .map((a) => {
            const isBank = a.who === BC.BANK.user;
            return `<li><span class="feed__avatar ${isBank ? '' : 'feed__avatar--client'}">${isBank ? esc(initials(a.who)) : icon('camera')}</span>
              <span><strong>${esc(a.who)}</strong><span class="feed__text">${esc(a.text)}</span><span class="feed__time">${fmtDateTime(a.at)}</span></span></li>`;
          })
          .join('')}</ul>
      </div>`;
  }

  function historyTab(p, s) {
    return `
      <div class="card">
        <div class="card__head"><h3>Entscheidprotokoll · ${esc(s.title)}</h3>${demoTag()}</div>
        ${
          s.decisions.length
            ? `<ul class="log">${[...s.decisions]
                .reverse()
                .map((d) => {
                  const meta = BC.DECISIONS[d.type];
                  return `<li class="log__item log__item--${meta.tone}">${icon(meta.icon)}<div>
                    <p><strong>${esc(meta.label)}</strong> ${demoTag()}</p>
                    ${d.comment ? `<p>${esc(d.comment)}</p>` : ''}
                    <p class="muted small">${esc(d.by)} · ${fmtDateTime(d.at)}</p>
                  </div></li>`;
                })
                .join('')}</ul>`
            : `<p class="muted small">Für diese Etappe liegen noch keine Entscheide vor.</p>`
        }
      </div>
      <div class="card">
        <div class="card__head"><h3>Einreichungen</h3><span class="muted small">${s.submissions.length}</span></div>
        ${
          s.submissions.length
            ? [...s.submissions]
                .reverse()
                .map(
                  (o) => `<div class="older__item"><p class="small"><strong class="mono">${esc(o.ref)}</strong> · ${fmtDateTime(o.submittedAt)} · ${o.photos.length} Fotos</p>
                    <div class="thumbs">${o.photos
                      .map((ph, i) => `<button data-photo="${i}" data-sub="${o.id}" aria-label="${esc(ph.title)}"><img src="${S().photoSrc(p, s, ph)}" alt=""></button>`)
                      .join('')}</div></div>`
                )
                .join('')
            : `<p class="muted small">Noch keine Einreichungen.</p>`
        }
      </div>
      <div class="card">
        <div class="card__head"><h3>Projektprotokoll</h3></div>
        <ul class="activity">${p.activity.map((a) => `<li><span class="activity__time">${fmtDateTime(a.at)}</span><span><strong>${esc(a.who)}</strong> · ${esc(a.text)}</span></li>`).join('')}</ul>
      </div>`;
  }

  function linksTab(p, s) {
    const links = S().linksFor(s.id);
    return `
      <div class="card">
        <div class="card__head"><div><h3>Demo-Links · ${esc(s.title)}</h3><p class="muted small">Zeitlich begrenzte Links für die Bauherrschaft</p></div><button class="btn btn--primary btn--sm" data-action="create-link">${icon('plus')}Link erstellen</button></div>
        ${
          links.length
            ? `<ul class="links">${links
                .map((l) => {
                  const st = S().linkState(l);
                  const lbl = { aktiv: 'Aktiv', abgelaufen: 'Abgelaufen', eingereicht: 'Verwendet', widerrufen: 'Widerrufen' }[st];
                  return `<li class="links__item links__item--${st}">
                    <span class="links__main">
                      <span class="links__state">${esc(lbl)}</span>
                      <span class="muted small">Erstellt ${fmtDateTime(l.createdAt)} · ${l.shots.length} ${l.shots.length === 1 ? 'Aufnahme' : 'Aufnahmen'}</span>
                    </span>
                    <span class="links__time small">${st === 'aktiv' ? `${icon('clock')}noch ${countdown(l.expiresAt)}` : st === 'abgelaufen' ? `seit ${fmtDateTime(l.expiresAt)}` : ''}</span>
                    <span class="links__actions">
                      ${
                        st === 'aktiv'
                          ? `<button class="icon-btn" data-copy="${l.token}" title="Link kopieren" aria-label="Link kopieren">${icon('copy')}</button>
                             <a class="icon-btn" href="#/b/${l.token}" target="_blank" rel="noopener" title="Als Bauherr öffnen" aria-label="Als Bauherr öffnen">${icon('external')}</a>
                             <button class="icon-btn" data-revoke="${l.token}" title="Widerrufen" aria-label="Widerrufen">${icon('ban')}</button>`
                          : `<a class="icon-btn" href="#/b/${l.token}" target="_blank" rel="noopener" title="Ansicht Bauherr" aria-label="Ansicht Bauherr">${icon('eye')}</a>`
                      }
                    </span>
                  </li>`;
                })
                .join('')}</ul>`
            : `<p class="muted small">Für diese Etappe wurde noch kein Link erstellt.</p>`
        }
        <p class="hint">${icon('info')}<span>Demo ohne Backend: Links funktionieren nur in diesem Browser. Es werden keine E-Mails oder SMS versendet.</span></p>
      </div>`;
  }

  function projectTab(p) {
    const confirmed = p.stages.filter((x) => x.status === 'ausreichend').reduce((n, x) => n + x.amount, 0);
    return `
      <div class="card">
        <div class="card__head"><h3>Projektdaten</h3>${demoTag('Fiktiv')}</div>
        <dl class="facts">
          <div><dt>Adresse</dt><dd>${esc(p.address)}</dd></div>
          <div><dt>Bauherrschaft</dt><dd>${esc(p.owner.name)}</dd></div>
          <div><dt>Unternehmer</dt><dd>${esc(p.builder)}</dd></div>
          <div><dt>Kreditrahmen</dt><dd class="num">${fmtCHF(p.creditLimit)}</dd></div>
          <div><dt>Bestätigter Baufortschritt</dt><dd class="num">${fmtCHF(confirmed)} (${Math.round((confirmed / p.creditLimit) * 100)}%)</dd></div>
          <div><dt>Baubeginn</dt><dd>${fmtDate(p.start)}</dd></div>
        </dl>
      </div>
      <div class="card">
        <div class="card__head"><h3>Etappen & Tranchen</h3><span class="muted small">nur zur Information</span></div>
        <div class="tranches">${p.stages
          .map(
            (x) => `<div class="tranches__row"><span>${x.no}. ${esc(x.title)}</span><span class="muted small">bis ${fmtDate(x.dueDate)}</span><span class="num">${x.share}%</span><span class="num">${fmtCHF(x.amount)}</span>${chip(x.status, true)}</div>`
          )
          .join('')}</div>
      </div>`;
  }

  /* ================= Modals ================= */
  function shotChecklist(s, preselect) {
    return `<fieldset class="field"><legend>Angeforderte Aufnahmen</legend>
      <div class="checklist">${S()
        .shotsFor(s)
        .map((shot) => `<label class="check"><input type="checkbox" name="shot" value="${shot.key}" ${!preselect || preselect.includes(shot.key) ? 'checked' : ''}><span>${esc(shot.title)}</span></label>`)
        .join('')}</div></fieldset>`;
  }
  const durationSelect = (def = 72) => `<label class="field"><span>Gültigkeit des Links</span>
    <select name="hours">${BC.LINK_DURATIONS.map((d) => `<option value="${d.value}" ${d.value === def ? 'selected' : ''}>${d.label}</option>`).join('')}</select></label>`;

  const formError = (root, msg) => {
    const el = root.querySelector('.form-error');
    el.textContent = msg;
    el.hidden = false;
    return false;
  };

  function createLinkModal(p, s) {
    modal({
      eyebrow: `${p.name} · Etappe ${s.no}`,
      title: 'Demo-Link für Bauherrschaft',
      body: `
        <p class="muted">Der Link führt die Bauherrschaft durch die ausgewählten Aufnahmen und ist nur während der gewählten Dauer gültig.</p>
        ${shotChecklist(s)}
        ${durationSelect()}
        <label class="field"><span>Nachricht an die Bauherrschaft <span class="muted">(optional)</span></span>
          <textarea name="note" rows="3" placeholder="z. B. Bitte erfassen Sie die Fotos bei Tageslicht."></textarea></label>
        <p class="form-error" hidden></p>
        <p class="hint">${icon('info')}<span>Demo: Ohne Backend funktioniert der Link nur in diesem Browser.</span></p>`,
      confirmLabel: 'Link erstellen',
      onConfirm(root) {
        const shots = [...root.querySelectorAll('input[name=shot]:checked')].map((i) => i.value);
        if (!shots.length) return formError(root, 'Bitte mindestens eine Aufnahme auswählen.');
        const link = S().createLink(p.id, s.id, { hours: Number(root.querySelector('[name=hours]').value), shots, note: root.querySelector('[name=note]').value.trim() });
        setTimeout(() => linkCreatedModal(link), 0);
        BC.app.render();
      },
    });
  }

  function linkCreatedModal(link) {
    const url = linkUrl(link.token);
    modal({
      eyebrow: 'Demo-Link erstellt',
      title: 'Link bereit zum Teilen',
      body: `
        <div class="link-box"><input readonly value="${esc(url)}" aria-label="Demo-Link"><button class="btn btn--secondary btn--sm" data-copy-url>${icon('copy')}Kopieren</button></div>
        <p class="muted small">${icon('clock', 'icon--inline')}Gültig bis ${fmtDateTime(link.expiresAt)} (noch ${countdown(link.expiresAt)})</p>
        <p class="hint">${icon('info')}<span>In einer echten Umgebung würde der Link per E-Mail oder SMS zugestellt. In dieser Demo wird nichts versendet.</span></p>`,
      cancelLabel: 'Schliessen',
      confirmLabel: 'Als Bauherr öffnen',
      onMount(root) {
        root.querySelector('[data-copy-url]').addEventListener('click', () => copyText(url));
      },
      onConfirm() {
        location.hash = `#/b/${link.token}`;
      },
    });
  }

  function decideModal(p, s, type) {
    const sub = S().latestSubmission(s);
    const missing = sub ? S().shotsFor(s).filter((sh) => !sub.photos.some((ph) => ph.shotKey === sh.key)).map((sh) => sh.key) : [];
    const head = { eyebrow: `${p.name} · Etappe ${s.no} ${s.title}` };
    if (type === 'ausreichend') {
      modal({
        ...head,
        title: 'Nachweise als ausreichend markieren',
        body: `
          <p>Sie bestätigen, dass die eingereichten Fotos den Baufortschritt der Etappe «${esc(s.title)}» ausreichend dokumentieren.</p>
          <label class="field"><span>Kommentar <span class="muted">(optional)</span></span><textarea name="comment" rows="3"></textarea></label>
          <label class="check check--box"><input type="checkbox" name="ack"><span>Mir ist bewusst, dass dieser Demo-Entscheid <strong>keine Kreditauszahlung</strong> auslöst. Eine Freigabe der Tranche erfolgt separat.</span></label>
          <p class="form-error" hidden></p>`,
        confirmLabel: 'Als ausreichend markieren',
        confirmTone: 'ok',
        onConfirm(root) {
          if (!root.querySelector('[name=ack]').checked) return formError(root, 'Bitte bestätigen Sie den Hinweis.');
          S().decide(p.id, s.id, 'ausreichend', root.querySelector('[name=comment]').value.trim());
          toast('Nachweise als ausreichend markiert (Demo)');
          BC.app.render();
        },
      });
    } else if (type === 'nachforderung') {
      modal({
        ...head,
        title: 'Weitere Fotos anfordern',
        body: `
          <label class="field"><span>Begründung für die Bauherrschaft</span><textarea name="comment" rows="3" placeholder="z. B. Bitte zusätzlich die Rückseite des Gebäudes fotografieren."></textarea></label>
          ${shotChecklist(s, missing.length ? missing : null)}
          ${durationSelect()}
          <p class="form-error" hidden></p>
          <p class="hint">${icon('info')}<span>Es wird ein neuer Demo-Link erstellt; die Begründung wird der Bauherrschaft angezeigt.</span></p>`,
        confirmLabel: 'Fotos anfordern',
        confirmTone: 'warn',
        onConfirm(root) {
          const comment = root.querySelector('[name=comment]').value.trim();
          const shots = [...root.querySelectorAll('input[name=shot]:checked')].map((i) => i.value);
          if (!comment) return formError(root, 'Bitte geben Sie eine Begründung an.');
          if (!shots.length) return formError(root, 'Bitte mindestens eine Aufnahme auswählen.');
          S().decide(p.id, s.id, 'nachforderung', comment);
          const link = S().createLink(p.id, s.id, { hours: Number(root.querySelector('[name=hours]').value), shots, note: comment });
          setTimeout(() => linkCreatedModal(link), 0);
          BC.app.render();
        },
      });
    } else {
      modal({
        ...head,
        title: 'Vor-Ort-Besuch empfehlen',
        body: `
          <p>Die Fotos genügen nicht für eine Beurteilung. Sie empfehlen eine Begehung durch eine Fachperson (z. B. Bauschätzer).</p>
          <label class="field"><span>Dringlichkeit</span><select name="prio"><option>Normal</option><option>Hoch</option></select></label>
          <label class="field"><span>Begründung</span><textarea name="comment" rows="3" placeholder="z. B. Baufortschritt auf den Fotos nicht eindeutig erkennbar."></textarea></label>
          <p class="form-error" hidden></p>
          <p class="hint">${icon('info')}<span>Demo: Es wird kein Termin gebucht und niemand benachrichtigt.</span></p>`,
        confirmLabel: 'Vor-Ort-Besuch empfehlen',
        confirmTone: 'alert',
        onConfirm(root) {
          const comment = root.querySelector('[name=comment]').value.trim();
          if (!comment) return formError(root, 'Bitte geben Sie eine Begründung an.');
          S().decide(p.id, s.id, 'vorort', `Dringlichkeit ${root.querySelector('[name=prio]').value}: ${comment}`);
          toast('Vor-Ort-Besuch empfohlen (Demo)');
          BC.app.render();
        },
      });
    }
  }

  BC.views = BC.views || {};
  Object.assign(BC.views, {
    bankOverview: overview,
    bankInbox: { render: () => overview.render({ inboxOnly: true }) },
    bankProject: project,
  });
})();
