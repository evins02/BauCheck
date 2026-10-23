/* BauCheck – gemeinsame Bausteine und Startseite (Rollenauswahl) */
(function () {
  const BC = (window.BC = window.BC || {});
  const { esc, icon, logo, fmtRemaining } = BC.ui;

  const chip = (status, short = false) => {
    const s = BC.STATUS[status] || { label: status, short: status, tone: 'neutral' };
    return `<span class="chip chip--${s.tone}" title="${esc(s.label)}"><span class="chip__dot"></span>${esc(short ? s.short : s.label)}</span>`;
  };
  const demoTag = (text = 'Demo') => `<span class="demo-tag">${esc(text)}</span>`;
  const countdown = (expiresAt) => `<span data-countdown="${expiresAt}">${esc(fmtRemaining(expiresAt - Date.now()))}</span>`;
  const linkUrl = (token) => `${location.origin}${location.pathname}#/b/${token}`;

  const footer = () => `
    <footer class="site-foot">
      <p>BauCheck ist eine Demo-Anwendung mit ausschliesslich synthetischen Daten. Personen, Adressen, Projekte und die «${esc(BC.BANK.name)}» sind fiktiv.
      Entscheide in BauCheck haben keine Rechtswirkung und lösen keine Kreditauszahlungen aus.</p>
    </footer>`;

  const heroArt = () => `
    <svg class="hero-art" viewBox="0 0 1440 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs><linearGradient id="mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d6e8"/><stop offset="1" stop-color="#eef3f9" stop-opacity="0"/></linearGradient></defs>
      <path d="M0 330 L120 250 L210 290 L330 120 L410 200 L470 160 L600 300 L720 240 L800 280 L1440 260 V420 H0Z" fill="url(#mt)"/>
      <path d="M300 160 L330 120 L362 168 L342 158 L326 176z" fill="#fff"/>
      <g fill="none" stroke="#b9c8dc" stroke-width="2">
        <path d="M1130 380 V70 M1144 380 V70 M1130 70 H1360 M1050 70 H1130 M1130 110 L1144 90 M1130 150 L1144 130 M1130 190 L1144 170 M1130 230 L1144 210 M1130 270 L1144 250 M1130 310 L1144 290"/>
        <path d="M1137 70 L1137 40 L1300 70 M1137 40 L1060 70"/>
        <path d="M1300 70 V150"/>
        <path d="M1180 380 V230 H1400 V380 M1180 280 H1400 M1180 330 H1400 M1235 230 V380 M1290 230 V380 M1345 230 V380"/>
      </g>
    </svg>`;

  function landing() {
    const active = BC.store.state.links.filter((l) => BC.store.linkState(l) === 'aktiv');
    const first = active[0];
    return `
      <div class="landing">
        <header class="lhead"><div class="container lhead__inner">
          <a href="#/">${logo()}</a>
          <button class="btn btn--ghost btn--sm" data-action="reset">${icon('refresh')}Demo zurücksetzen</button>
        </div></header>

        <section class="hero">
          ${heroArt()}
          <div class="container hero__inner">
            <p class="hero__claim">Einfacher<br>Sicherer<br>Effizienter<br>Für die Schweiz</p>
            <h1 class="hero__title"><span class="wordmark wordmark--xl">Bau<span>Check</span></span></h1>
            <p class="hero__sub">Digitale Baufortschrittskontrolle für Schweizer Banken</p>
            <p class="hero__note">Mehr Transparenz für sichere Baufinanzierungen.</p>
          </div>
        </section>

        <main class="container landing__main">
          <section class="roles" aria-label="Rolle wählen">
            <a class="role-card" href="${first ? `#/b/${first.token}` : '#/bauherr'}">
              <span class="role-card__no">1</span>
              <span class="role-card__icon">${icon('camera')}</span>
              <span class="role-card__body">
                <strong>Kunde dokumentiert</strong>
                <span class="muted">Die Bauherrschaft öffnet einen zeitlich begrenzten Link und erfasst geführte Baustellenfotos.</span>
                <span class="role-card__cta">Als Bauherr starten ${icon('arrow-right')}</span>
              </span>
            </a>
            <a class="role-card" href="#/bank">
              <span class="role-card__no">2</span>
              <span class="role-card__icon">${icon('bank')}</span>
              <span class="role-card__body">
                <strong>Bank prüft</strong>
                <span class="muted">Bankmitarbeitende sehen Projekte, Bauetappen, Fotos und Kontrollstatus und beurteilen die Nachweise.</span>
                <span class="role-card__cta">Bank-Dashboard öffnen ${icon('arrow-right')}</span>
              </span>
            </a>
          </section>

          ${
            active.length
              ? `<section class="card">
                  <div class="card__head"><h2>Aktive Demo-Links</h2><span class="muted small">Funktionieren in diesem Browser</span></div>
                  <ul class="link-list">
                    ${active
                      .map((l) => {
                        const p = BC.store.getProject(l.projectId);
                        const s = BC.store.getStage(p, l.stageId);
                        return `<li><a href="#/b/${l.token}" class="link-list__item">
                          <span class="link-list__icon">${icon('link')}</span>
                          <span class="link-list__main"><strong>${esc(p.name)}</strong><span class="muted small">Etappe ${s.no} · ${esc(s.title)}</span></span>
                          <span class="link-list__meta">${icon('clock')}${countdown(l.expiresAt)}</span>
                          ${icon('chevron-right', 'muted')}
                        </a></li>`;
                      })
                      .join('')}
                  </ul>
                </section>`
              : ''
          }

          <section class="features" aria-label="Vorteile">
            <div class="feature"><span class="feature__icon feature__icon--green">${icon('leaf')}</span><div><h3>Weniger Fahrten</h3><p>Vor-Ort-Besuche nur, wenn sie wirklich nötig sind.</p></div></div>
            <div class="feature"><span class="feature__icon">${icon('zap')}</span><div><h3>Schnellere Prüfung</h3><p>Strukturierte Fotonachweise pro Bauetappe.</p></div></div>
            <div class="feature"><span class="feature__icon feature__icon--green">${icon('file')}</span><div><h3>Saubere Dokumentation</h3><p>Nachweise, Entscheide und Aktivitäten lückenlos protokolliert.</p></div></div>
          </section>

          <aside class="notice">
            ${icon('shield')}
            <div><strong>Keine automatischen Auszahlungen.</strong> BauCheck dokumentiert ausschliesslich den Baufortschritt. Alle Entscheide sind Demo-Vermerke; Auszahlungen erfolgen ausserhalb dieser Demo durch berechtigte Personen im Kernbankensystem.</div>
          </aside>
        </main>
        ${footer()}
      </div>`;
  }

  function builderNoLink() {
    return `
      <div class="builder"><div class="phone">
        <header class="b-head"><a href="#/">${logo()}</a><span class="b-lang">DE</span></header>
        <main class="b-main">
          <div class="state-screen">
            <span class="state-screen__icon">${icon('link')}</span>
            <h1>Kein aktiver Demo-Link</h1>
            <p class="muted">In einer echten Umgebung erhält die Bauherrschaft den Link per E-Mail oder SMS. Erstellen Sie in der Bankansicht einen neuen Demo-Link für eine Etappe.</p>
            <a class="btn btn--blue btn--block" href="#/bank/p">Zur Bankansicht</a>
          </div>
        </main>
      </div></div>`;
  }

  function notFound() {
    return `<main class="container"><div class="state-screen"><span class="state-screen__icon">${icon('info')}</span><h1>Seite nicht gefunden</h1><a class="btn btn--primary" href="#/">Zur Startseite</a></div></main>`;
  }

  BC.views = BC.views || {};
  Object.assign(BC.views, { landing, builderNoLink, notFound });
  BC.parts = { chip, demoTag, countdown, linkUrl, footer };
})();
