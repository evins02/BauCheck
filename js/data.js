/* BauCheck – Datenmodell, synthetische Seed-Daten und lokaler Speicher (localStorage).
   Es gibt kein Backend: Bankansicht und Bauherr-Link teilen sich den Speicher dieses Browsers. */
(function () {
  const BC = (window.BC = window.BC || {});
  const STORE_KEY = 'baucheck.demo.v1';
  const HOUR = 3600 * 1000;
  const DAY = 24 * HOUR;

  BC.BANK = { name: 'Demo Bank AG', note: 'fiktives Institut', user: 'Lea Beispiel', role: 'Kundenberaterin Baufinanzierung (Demo)' };

  BC.STATUS = {
    geplant: { label: 'Geplant', short: 'Geplant', tone: 'neutral' },
    angefordert: { label: 'Nachweis angefordert', short: 'Angefordert', tone: 'info' },
    eingereicht: { label: 'In Prüfung', short: 'In Prüfung', tone: 'review' },
    ausreichend: { label: 'Nachweis ausreichend', short: 'Ausreichend', tone: 'ok' },
    nachforderung: { label: 'Nachreichung angefordert', short: 'Nachreichung', tone: 'warn' },
    vorort: { label: 'Vor-Ort-Besuch empfohlen', short: 'Vor-Ort', tone: 'alert' },
  };

  BC.DECISIONS = {
    ausreichend: { label: 'Nachweis als ausreichend markiert', short: 'Ausreichend', icon: 'check-circle', tone: 'ok' },
    nachforderung: { label: 'Weitere Fotos angefordert', short: 'Weitere Fotos', icon: 'camera', tone: 'warn' },
    vorort: { label: 'Vor-Ort-Besuch empfohlen', short: 'Vor-Ort-Besuch', icon: 'pin', tone: 'alert' },
  };

  const TABLET = { key: 'tafel', view: 'tafel', title: 'Baustellentafel', hint: 'Fotografieren Sie die Bautafel so, dass Projektname und Bauherrschaft lesbar sind.' };

  BC.STAGE_TEMPLATES = {
    fundament: {
      title: 'Baugrube & Fundament',
      shots: [
        { key: 'gesamt', view: 'aussen', title: 'Gesamtansicht Baugrube', hint: 'Stellen Sie sich an den Rand der Baugrube, sodass die ganze Fläche im Bild ist. Bitte im Querformat.' },
        { key: 'platte', view: 'detail', title: 'Bodenplatte / Armierung', hint: 'Nahaufnahme der Bodenplatte oder der verlegten Armierung. Achten Sie auf genügend Licht.' },
        TABLET,
      ],
    },
    rohbau: {
      title: 'Rohbau',
      shots: [
        { key: 'strasse', view: 'aussen', title: 'Ansicht Strassenseite', hint: 'Ganzes Gebäude von der Strasse aus, inklusive aller Geschosse.' },
        { key: 'rueck', view: 'aussen', title: 'Ansicht Rückseite', hint: 'Gebäude von der gegenüberliegenden Seite, möglichst mit etwas Abstand.' },
        { key: 'decke', view: 'innen', title: 'Geschoss innen', hint: 'Blick in ein Geschoss, sodass Wände und Decke erkennbar sind.' },
        TABLET,
      ],
    },
    dach: {
      title: 'Dach',
      shots: [
        { key: 'gesamt', view: 'aussen', title: 'Gesamtansicht mit Dach', hint: 'Gebäude mit vollständiger Dachkonstruktion von der Strasse aus.' },
        { key: 'konstruktion', view: 'detail', title: 'Dachkonstruktion (Detail)', hint: 'Sparren, Lattung oder Eindeckung aus der Nähe – nur von sicherem Standort aus.' },
        TABLET,
      ],
    },
    huelle: {
      title: 'Fenster & Fassade',
      shots: [
        { key: 'fassade', view: 'aussen', title: 'Fassade Strassenseite', hint: 'Ganze Fassade mit eingebauten Fenstern.' },
        { key: 'fenster', view: 'detail', title: 'Fenster eingebaut (Detail)', hint: 'Ein eingebautes Fenster aus der Nähe, inkl. Rahmen.' },
        { key: 'rueck', view: 'aussen', title: 'Fassade Rückseite', hint: 'Rückseitige Fassade mit Fenstern.' },
      ],
    },
    technik: {
      title: 'Haustechnik',
      shots: [
        { key: 'technikraum', view: 'innen', title: 'Heizung / Technikraum', hint: 'Wärmeerzeuger bzw. Technikraum mit installierten Anlagen.' },
        { key: 'leitungen', view: 'innen', title: 'Leitungen Sanitär & Elektro', hint: 'Verlegte Leitungen in einem Raum, bevor sie verputzt werden.' },
        { key: 'aussen', view: 'aussen', title: 'Gesamtansicht aussen', hint: 'Aktueller Zustand des Gebäudes von aussen.' },
      ],
    },
    ausbau: {
      title: 'Innenausbau',
      shots: [
        { key: 'wohnen', view: 'innen', title: 'Wohnraum', hint: 'Wohnraum mit fertigen Wänden und Boden.' },
        { key: 'nass', view: 'innen', title: 'Küche oder Bad', hint: 'Eingebaute Küche oder Nasszelle.' },
        { key: 'aussen', view: 'aussen', title: 'Gesamtansicht aussen', hint: 'Aktueller Zustand des Gebäudes von aussen.' },
      ],
    },
    abschluss: {
      title: 'Bauvollendung',
      shots: [
        { key: 'strasse', view: 'aussen', title: 'Gesamtansicht Strasse', hint: 'Fertiges Gebäude inkl. Umgebung von der Strasse aus.' },
        { key: 'garten', view: 'aussen', title: 'Gesamtansicht Garten', hint: 'Fertiges Gebäude von der Gartenseite.' },
        { key: 'innen', view: 'innen', title: 'Innenraum fertig', hint: 'Ein fertiger Wohnraum.' },
      ],
    },
  };

  BC.LINK_DURATIONS = [
    { value: 0.5, label: '30 Minuten' },
    { value: 24, label: '24 Stunden' },
    { value: 72, label: '72 Stunden' },
    { value: 168, label: '7 Tage' },
  ];

  const rid = (n = 10) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('');
  const ref = () => `BC-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

  /* ---------- Seed ---------- */
  function seed() {
    const now = Date.now();
    const links = [];
    const state = { version: 1, createdAt: now, projects: [], links };

    function project(p, stageDefs) {
      const proj = { activity: [], ...p };
      let cursor = p.start;
      proj.stages = stageDefs.map(([key, share, status], i) => {
        cursor += p.stageDays * DAY;
        return {
          id: `${p.id}-s${i + 1}`,
          key,
          no: i + 1,
          title: BC.STAGE_TEMPLATES[key].title,
          share,
          amount: Math.round((p.creditLimit * share) / 100 / 1000) * 1000,
          dueDate: cursor,
          status,
          submissions: [],
          decisions: [],
        };
      });
      state.projects.push(proj);
      return proj;
    }

    function addSubmission(proj, stage, agoHours, opts = {}) {
      const tpl = BC.STAGE_TEMPLATES[stage.key];
      const at = now - agoHours * HOUR;
      const token = rid();
      const shots = opts.shots || tpl.shots.map((s) => s.key);
      links.push({ token, projectId: proj.id, stageId: stage.id, createdAt: at - 30 * HOUR, expiresAt: at + 42 * HOUR, shots, note: '', status: 'eingereicht' });
      const sub = {
        id: rid(),
        ref: ref(),
        token,
        submittedAt: at,
        note: opts.note || '',
        photos: tpl.shots
          .filter((s) => shots.includes(s.key))
          .map((s, i) => ({ id: rid(), shotKey: s.key, title: s.title, kind: 'synthetic', seed: `${stage.id}-${s.key}-${agoHours}`, takenAt: at - (20 - i * 3) * 60000, w: 4032, h: 3024 })),
      };
      stage.submissions.push(sub);
      proj.activity.push({ at, who: proj.owner.name, text: `Fotos für Etappe «${stage.title}» eingereicht (${sub.ref})` });
      return sub;
    }

    function addDecision(proj, stage, type, agoHours, comment) {
      const at = now - agoHours * HOUR;
      stage.decisions.push({ id: rid(), type, comment, at, by: BC.BANK.user, demo: true });
      proj.activity.push({ at, who: BC.BANK.user, text: `${BC.DECISIONS[type].label} – Etappe «${stage.title}» (Demo)` });
    }

    function addLink(proj, stage, { createdAgoHours, validHours, note = '', shots, status = 'aktiv' }) {
      const createdAt = now - createdAgoHours * HOUR;
      const link = {
        token: rid(),
        projectId: proj.id,
        stageId: stage.id,
        createdAt,
        expiresAt: createdAt + validHours * HOUR,
        shots: shots || BC.STAGE_TEMPLATES[stage.key].shots.map((s) => s.key),
        note,
        status,
      };
      links.push(link);
      proj.activity.push({ at: createdAt, who: BC.BANK.user, text: `Demo-Link für Etappe «${stage.title}» erstellt` });
      return link;
    }

    // 1) Einfamilienhaus – Rohbau zur Prüfung
    const a = project(
      {
        id: 'p-sonnenhalde',
        name: 'EFH Sonnenhalde',
        type: 'Neubau Einfamilienhaus',
        address: 'Beispielweg 12, 8999 Musterlingen ZH',
        owner: { name: 'Anna & Marco Beispiel', email: 'familie.beispiel@example.ch' },
        builder: 'Holzbau Demo GmbH (fiktiv)',
        creditLimit: 1180000,
        start: now - 120 * DAY,
        stageDays: 45,
        advisor: BC.BANK.user,
        ref: 'BK-DEMO-24017',
      },
      [['fundament', 15, 'ausreichend'], ['rohbau', 30, 'eingereicht'], ['dach', 15, 'geplant'], ['huelle', 15, 'geplant'], ['ausbau', 20, 'geplant'], ['abschluss', 5, 'geplant']]
    );
    addSubmission(a, a.stages[0], 24 * 52);
    addDecision(a, a.stages[0], 'ausreichend', 24 * 51, 'Bodenplatte und Baugrube gut dokumentiert. Bautafel lesbar.');
    addSubmission(a, a.stages[1], 3, { note: 'Rohbau Obergeschoss diese Woche fertiggestellt. Gerüst steht noch.' });

    // 2) Mehrfamilienhaus – Dach: weitere Fotos angefordert
    const b = project(
      {
        id: 'p-seeblick',
        name: 'MFH Seeblick',
        type: 'Neubau Mehrfamilienhaus, 6 Wohnungen',
        address: 'Demostrasse 4, 6999 Seedorf-Muster LU',
        owner: { name: 'Muster Wohnbau AG (fiktiv)', email: 'bau@muster-wohnbau.example.ch' },
        builder: 'Generalunternehmung Beispiel AG (fiktiv)',
        creditLimit: 4650000,
        start: now - 260 * DAY,
        stageDays: 70,
        advisor: BC.BANK.user,
        ref: 'BK-DEMO-23988',
      },
      [['fundament', 12, 'ausreichend'], ['rohbau', 33, 'ausreichend'], ['dach', 15, 'nachforderung'], ['huelle', 15, 'geplant'], ['technik', 10, 'geplant'], ['ausbau', 10, 'geplant'], ['abschluss', 5, 'geplant']]
    );
    addSubmission(b, b.stages[0], 24 * 190);
    addDecision(b, b.stages[0], 'ausreichend', 24 * 189, 'Nachweis vollständig.');
    addSubmission(b, b.stages[1], 24 * 70);
    addDecision(b, b.stages[1], 'ausreichend', 24 * 69, 'Alle Geschosse erkennbar. In Ordnung.');
    addSubmission(b, b.stages[2], 30, { shots: ['gesamt', 'tafel'] });
    addDecision(b, b.stages[2], 'nachforderung', 26, 'Bitte zusätzlich eine Detailaufnahme der Dachkonstruktion einreichen; die Gesamtansicht lässt die Eindeckung nicht erkennen.');
    addLink(b, b.stages[2], { createdAgoHours: 26, validHours: 72, note: 'Bitte zusätzlich eine Detailaufnahme der Dachkonstruktion einreichen.', shots: ['konstruktion'] });

    // 3) Umbau – Vor-Ort-Besuch empfohlen, abgelaufener Link
    const c = project(
      {
        id: 'p-linde',
        name: 'Umbau Bauernhaus Linde',
        type: 'Umbau & energetische Sanierung',
        address: 'Lindenhof 7, 3999 Fiktivwil BE',
        owner: { name: 'Sandro Muster', email: 's.muster@example.ch' },
        builder: 'Baugeschäft Exempel AG (fiktiv)',
        creditLimit: 860000,
        start: now - 70 * DAY,
        stageDays: 40,
        advisor: BC.BANK.user,
        ref: 'BK-DEMO-24102',
      },
      [['rohbau', 35, 'vorort'], ['dach', 25, 'geplant'], ['technik', 25, 'geplant'], ['abschluss', 15, 'geplant']]
    );
    addSubmission(c, c.stages[0], 24 * 4, { note: 'Teilweise Rückbau der Scheune, neue Tragwände eingezogen.' });
    addDecision(c, c.stages[0], 'vorort', 24 * 3, 'Baufortschritt auf den Fotos schwer abschätzbar (Umbau mit Bestand). Vor-Ort-Begehung durch Bauschätzer empfohlen.');
    addLink(c, c.stages[1], { createdAgoHours: 24 * 6, validHours: 48, status: 'aktiv', note: 'Vorzeitige Anfrage – Link inzwischen abgelaufen.' });

    // 4) Anbau – Nachweis angefordert, aktiver Link (Standard-Demo für Bauherr)
    const d = project(
      {
        id: 'p-rebberg',
        name: 'Anbau Atelier Rebberg',
        type: 'Anbau an bestehendes Wohnhaus',
        address: 'Rebbergstrasse 21, 1999 Exempelbourg VD',
        owner: { name: 'Julia Exempel', email: 'julia.exempel@example.ch' },
        builder: 'Atelier Bau Demo Sàrl (fiktiv)',
        creditLimit: 420000,
        start: now - 35 * DAY,
        stageDays: 30,
        advisor: BC.BANK.user,
        ref: 'BK-DEMO-24155',
      },
      [['fundament', 25, 'angefordert'], ['rohbau', 35, 'geplant'], ['huelle', 25, 'geplant'], ['abschluss', 15, 'geplant']]
    );
    addLink(d, d.stages[0], { createdAgoHours: 2, validHours: 72, note: 'Guten Tag Frau Exempel, bitte erfassen Sie die Fotos zur Fertigstellung des Fundaments. Freundliche Grüsse, Lea Beispiel' });

    state.projects.forEach((p) => p.activity.sort((x, y) => y.at - x.at));
    return state;
  }

  /* ---------- Store ---------- */
  let state = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) state = JSON.parse(raw);
    } catch (_) {
      state = null;
    }
    if (!state || state.version !== 1) {
      state = seed();
      save();
    }
    return state;
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      BC.ui.toast('Lokaler Speicher voll – bitte Demo zurücksetzen.', 'error');
      return false;
    }
  }

  function reset() {
    state = seed();
    save();
  }

  const getProject = (id) => state.projects.find((p) => p.id === id);
  const getStage = (p, sid) => p && p.stages.find((s) => s.id === sid);
  const getLink = (token) => state.links.find((l) => l.token === token);
  const linksFor = (stageId) => state.links.filter((l) => l.stageId === stageId).sort((a, b) => b.createdAt - a.createdAt);
  const shotsFor = (stage, keys) => BC.STAGE_TEMPLATES[stage.key].shots.filter((s) => !keys || keys.includes(s.key));
  const latestSubmission = (stage) => stage.submissions[stage.submissions.length - 1];
  const latestDecision = (stage) => stage.decisions[stage.decisions.length - 1];

  function linkState(link) {
    if (!link) return 'ungueltig';
    if (link.status === 'widerrufen') return 'widerrufen';
    if (link.status === 'eingereicht') return 'eingereicht';
    if (Date.now() > link.expiresAt) return 'abgelaufen';
    return 'aktiv';
  }

  function log(project, who, text) {
    project.activity.unshift({ at: Date.now(), who, text });
  }

  function createLink(projectId, stageId, { hours, shots, note }) {
    const p = getProject(projectId);
    const s = getStage(p, stageId);
    // Pro Etappe ist nur ein aktiver Link sinnvoll – ältere werden ersetzt.
    state.links.forEach((l) => {
      if (l.stageId === stageId && linkState(l) === 'aktiv') l.status = 'widerrufen';
    });
    const now = Date.now();
    const link = { token: rid(), projectId, stageId, createdAt: now, expiresAt: now + hours * HOUR, shots, note: note || '', status: 'aktiv' };
    state.links.push(link);
    if (s.status === 'geplant') s.status = 'angefordert';
    log(p, BC.BANK.user, `Demo-Link für Etappe «${s.title}» erstellt (gültig ${BC.LINK_DURATIONS.find((d) => d.value === hours)?.label || hours + ' Std'})`);
    save();
    return link;
  }

  function revokeLink(token) {
    const link = getLink(token);
    if (!link) return;
    link.status = 'widerrufen';
    const p = getProject(link.projectId);
    const s = getStage(p, link.stageId);
    if (s.status === 'angefordert' && !s.submissions.length) s.status = 'geplant';
    log(p, BC.BANK.user, `Demo-Link für Etappe «${s.title}» widerrufen`);
    save();
  }

  function submit(token, photos, note) {
    const link = getLink(token);
    if (linkState(link) !== 'aktiv') throw new Error('Link nicht mehr gültig');
    const p = getProject(link.projectId);
    const s = getStage(p, link.stageId);
    const sub = { id: rid(), ref: ref(), token, submittedAt: Date.now(), note: note || '', photos };
    s.submissions.push(sub);
    s.status = 'eingereicht';
    link.status = 'eingereicht';
    link.submissionId = sub.id;
    log(p, p.owner.name, `Fotos für Etappe «${s.title}» eingereicht (${sub.ref})`);
    if (!save()) {
      // Rückgängig machen, falls der Speicher voll ist
      s.submissions.pop();
      s.status = 'angefordert';
      link.status = 'aktiv';
      p.activity.shift();
      throw new Error('Speicher voll');
    }
    return sub;
  }

  function decide(projectId, stageId, type, comment) {
    const p = getProject(projectId);
    const s = getStage(p, stageId);
    s.decisions.push({ id: rid(), type, comment: comment || '', at: Date.now(), by: BC.BANK.user, demo: true, submissionId: latestSubmission(s)?.id });
    s.status = type;
    log(p, BC.BANK.user, `${BC.DECISIONS[type].label} – Etappe «${s.title}» (Demo)`);
    save();
  }

  /** Automatische Plausibilitätshinweise (Demo) – ersetzen keine fachliche Prüfung. */
  function checks(stage, sub) {
    const link = getLink(sub.token);
    const required = link?.shots || shotsFor(stage).map((s) => s.key);
    const have = new Set(sub.photos.map((ph) => ph.shotKey));
    const missing = required.filter((k) => !have.has(k));
    const minSide = Math.min(...sub.photos.map((ph) => Math.min(ph.w || 0, ph.h || 0)));
    const inWindow = link ? sub.photos.every((ph) => ph.takenAt >= link.createdAt - HOUR && ph.takenAt <= sub.submittedAt + 60000) : true;
    return [
      { ok: missing.length === 0, label: 'Angeforderte Aufnahmen vollständig', detail: missing.length ? `${missing.length} fehlend` : `${required.length}/${required.length}` },
      { ok: inWindow, label: 'Aufnahmezeit innerhalb Link-Gültigkeit', detail: inWindow ? 'plausibel' : 'prüfen' },
      { ok: minSide >= 720, label: 'Bildauflösung ausreichend', detail: minSide >= 720 ? `min. ${minSide} px` : `nur ${minSide} px` },
      { ok: sub.photos.some((ph) => ph.shotKey === 'tafel') || !required.includes('tafel'), label: 'Objektidentifikation (Bautafel)', detail: required.includes('tafel') ? 'vorhanden' : 'nicht angefordert' },
    ];
  }

  function photoSrc(project, stage, photo) {
    if (photo.kind === 'upload') return photo.src;
    const shot = BC.STAGE_TEMPLATES[stage.key].shots.find((s) => s.key === photo.shotKey) || { view: 'aussen' };
    return BC.scene({ stageKey: stage.key, view: shot.view, seed: photo.seed, title: photo.title, projectName: project.name, owner: project.owner.name });
  }

  BC.store = {
    load,
    save,
    reset,
    get state() {
      return state;
    },
    getProject,
    getStage,
    getLink,
    linksFor,
    shotsFor,
    latestSubmission,
    latestDecision,
    linkState,
    createLink,
    revokeLink,
    submit,
    decide,
    checks,
    photoSrc,
    rid,
  };
})();
