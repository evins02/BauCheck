/* BauCheck – Hash-Router und App-Start */
(function () {
  const BC = (window.BC = window.BC || {});

  const routes = [
    [/^#?\/?$/, () => BC.views.landing],
    [/^#\/bank\/?$/, () => BC.views.bankOverview],
    [/^#\/bank\/inbox\/?$/, () => BC.views.bankInbox],
    [/^#\/bank\/p\/?$/, () => BC.views.bankProject, () => ({})],
    [/^#\/bank\/p\/([\w-]+)(?:\/([\w-]+))?\/?$/, () => BC.views.bankProject, (m) => ({ pid: m[1], sid: m[2] })],
    [/^#\/b\/(\w+)\/?$/, () => BC.views.builder, (m) => ({ token: m[1] })],
    [/^#\/bauherr\/?$/, () => BC.views.builderNoLink],
  ];

  let lastHash = null;

  function render() {
    const hash = location.hash || '#/';
    let view = BC.views.notFound;
    let params = {};
    for (const [re, get, map] of routes) {
      const m = hash.match(re);
      if (m) {
        view = get();
        params = map ? map(m) : {};
        break;
      }
    }
    const root = document.getElementById('app');
    root.innerHTML = typeof view === 'function' ? view(params) : view.render(params);
    if (view.bind) view.bind(root, params);
    document.querySelectorAll('[data-action="reset"]').forEach((b) =>
      b.addEventListener('click', () =>
        BC.ui.modal({
          title: 'Demo zurücksetzen?',
          body: '<p>Alle lokal gespeicherten Einreichungen, Entscheide und Links werden gelöscht und die synthetischen Beispieldaten neu geladen.</p>',
          confirmLabel: 'Zurücksetzen',
          confirmTone: 'danger',
          onConfirm: () => {
            BC.store.reset();
            BC.ui.toast('Demo wurde zurückgesetzt');
            render();
          },
        })
      )
    );
    document.body.dataset.area = hash.startsWith('#/b/') || hash.startsWith('#/bauherr') ? 'builder' : hash.startsWith('#/bank') ? 'bank' : 'home';
    if (hash !== lastHash) {
      lastHash = hash;
      BC.ui.closeOverlay();
      window.scrollTo({ top: 0 });
    }
  }

  // Countdowns jede Sekunde aktualisieren; bei Ablauf neu rendern
  setInterval(() => {
    let expired = false;
    document.querySelectorAll('[data-countdown]').forEach((el) => {
      const ms = Number(el.dataset.countdown) - Date.now();
      el.textContent = BC.ui.fmtRemaining(ms);
      if (ms <= 0 && !el.dataset.done) {
        el.dataset.done = '1';
        expired = true;
      }
    });
    if (expired && !document.body.classList.contains('has-overlay')) render();
  }, 1000);

  // Änderungen aus einem anderen Tab (z. B. Bauherr-Link) übernehmen
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('baucheck.')) {
      BC.store.load();
      if (!document.body.classList.contains('has-overlay')) render();
    }
  });

  window.addEventListener('hashchange', render);
  BC.store.load();
  BC.app = { render };
  render();
})();
