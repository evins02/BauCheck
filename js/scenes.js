/* BauCheck – Generator für synthetische Baustellen-Illustrationen (SVG).
   Ersetzt echte Fotos in den Beispieldaten. Jedes Bild ist als "Synthetisches Demobild" gekennzeichnet. */
(function () {
  const BC = (window.BC = window.BC || {});
  const cache = new Map();

  function rng(seed) {
    let s = 0;
    for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  const PROGRESS = { fundament: 0, rohbau: 1, dach: 2, huelle: 3, technik: 4, ausbau: 5, abschluss: 6 };
  const W = 800;
  const H = 600;

  function sky(r) {
    const warm = r() > 0.5;
    return `<defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${warm ? '#cfdbe6' : '#bcd0e2'}"/><stop offset="1" stop-color="${warm ? '#eef0ec' : '#e6edf2'}"/>
      </linearGradient>
      <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>
    <path d="M0 330 L90 270 L150 300 L260 190 L330 250 L380 220 L470 300 L560 230 L620 150 L700 240 L800 200 V380 H0z" fill="#9fb2c4" opacity=".55"/>
    <path d="M230 215 L260 190 L290 220 L272 214 L258 226z M595 178 L620 150 L648 190 L628 182 L612 196z" fill="#fff" opacity=".85"/>
    <path d="M0 380 Q 140 ${330 + r() * 30} 280 360 T 560 ${345 + r() * 20} T 800 360 V 420 H0z" fill="#b9c4bd" opacity=".7"/>
    <path d="M0 400 Q 200 ${370 + r() * 20} 420 392 T 800 385 V 440 H0z" fill="#a3b3a6" opacity=".7"/>`;
  }

  function ground(color = '#8d8371') {
    return `<rect y="430" width="${W}" height="170" fill="${color}"/><rect y="430" width="${W}" height="6" fill="#000" opacity=".08"/>`;
  }

  function crane(x, r) {
    const h = 250 + r() * 40;
    const top = 430 - h;
    let lattice = '';
    for (let y = top + 10; y < 430; y += 18) lattice += `<path d="M${x - 7} ${y}L${x + 7} ${y + 18}M${x + 7} ${y}L${x - 7} ${y + 18}" stroke="#d9a21b" stroke-width="1.4"/>`;
    return `<g>
      <rect x="${x - 8}" y="${top}" width="16" height="${h}" fill="none" stroke="#d9a21b" stroke-width="3"/>${lattice}
      <rect x="${x - 170}" y="${top - 12}" width="290" height="10" fill="#e0aa22"/>
      <rect x="${x + 70}" y="${top - 2}" width="40" height="22" fill="#6d6d6d"/>
      <rect x="${x - 6}" y="${top - 32}" width="22" height="20" fill="#e0aa22"/>
      <line x1="${x - 140}" y1="${top - 2}" x2="${x - 140}" y2="${top + 90}" stroke="#444" stroke-width="1.5"/>
      <rect x="${x - 152}" y="${top + 90}" width="24" height="14" fill="#7b5b3a"/>
    </g>`;
  }

  function building(level, r, x0 = 220, w = 380) {
    const floorH = 78;
    const floors = level >= 1 ? 2 : 0;
    const base = 430;
    let g = '';
    if (level === 0) {
      // Baugrube mit Bodenplatte
      g += `<path d="M120 432 L680 432 L640 520 L160 520 Z" fill="#5f5546"/>
            <path d="M175 505 L625 505 L600 470 L200 470Z" fill="#a7a7a2"/>`;
      for (let i = 0; i < 14; i++) g += `<line x1="${208 + i * 28}" y1="472" x2="${195 + i * 30}" y2="503" stroke="#6b4b2f" stroke-width="2"/>`;
      for (let i = 0; i < 3; i++) g += `<line x1="${205 - i * 4}" y1="${478 + i * 10}" x2="${596 + i * 4}" y2="${478 + i * 10}" stroke="#6b4b2f" stroke-width="2"/>`;
      // Bagger
      g += `<g transform="translate(${560 + r() * 60},380)"><rect x="0" y="30" width="90" height="34" rx="4" fill="#e3a51e"/><rect x="45" y="5" width="38" height="30" rx="3" fill="#e3a51e"/><rect x="52" y="10" width="24" height="14" fill="#9cc0d6"/><rect x="-6" y="62" width="104" height="16" rx="8" fill="#333"/><path d="M5 40 L-50 0 L-80 30" stroke="#e3a51e" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M-80 30 l-10 22 h24z" fill="#555"/></g>`;
      return g;
    }
    const top = base - floors * floorH;
    const wall = level >= 3 ? ['#efe8dc', '#e6efe9', '#ebe5dd'][Math.floor(r() * 3)] : '#b8b6b0';
    g += `<rect x="${x0}" y="${top}" width="${w}" height="${floors * floorH}" fill="${wall}"/>`;
    g += `<rect x="${x0}" y="${top}" width="${w}" height="${floors * floorH}" fill="url(#shade)"/>`;
    for (let f = 0; f < floors; f++) {
      const y = top + f * floorH;
      g += `<rect x="${x0 - 6}" y="${y}" width="${w + 12}" height="8" fill="${level >= 3 ? '#d4cdc1' : '#9d9b95'}"/>`;
      for (let k = 0; k < 4; k++) {
        const wx = x0 + 30 + k * ((w - 60) / 4);
        const glass = level >= 3;
        g += `<rect x="${wx}" y="${y + 22}" width="52" height="40" fill="${glass ? '#7fa4bd' : '#3c3a36'}" ${glass ? 'stroke="#5c5c5c" stroke-width="3"' : ''}/>`;
        if (glass) g += `<path d="M${wx + 6} ${y + 56} L${wx + 30} ${y + 28}" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>`;
      }
    }
    if (level >= 2) {
      g += `<path d="M${x0 - 30} ${top} L${x0 + w / 2} ${top - 110} L${x0 + w + 30} ${top}Z" fill="${level >= 3 ? '#6f4a3a' : '#c39a6b'}"/>`;
      if (level === 2) for (let i = 1; i < 9; i++) g += `<line x1="${x0 - 30 + i * ((w + 60) / 9)}" y1="${top}" x2="${x0 + w / 2}" y2="${top - 110}" stroke="#8a6440" stroke-width="2" opacity=".6"/>`;
    }
    if (level >= 1 && level <= 4) {
      // Gerüst
      for (let i = 0; i <= 8; i++) g += `<line x1="${x0 - 14 + i * ((w + 28) / 8)}" y1="${top - 8}" x2="${x0 - 14 + i * ((w + 28) / 8)}" y2="${base}" stroke="#7b7b7b" stroke-width="2.5"/>`;
      for (let f = 0; f <= floors; f++) g += `<rect x="${x0 - 18}" y="${top + f * floorH - 4}" width="${w + 36}" height="5" fill="#9c7a4d"/>`;
    }
    if (level === 1) {
      // Bewehrungseisen ragen aus der Decke
      for (let i = 0; i < 18; i++) g += `<line x1="${x0 + 12 + i * (w / 18)}" y1="${top}" x2="${x0 + 12 + i * (w / 18)}" y2="${top - 22}" stroke="#6b4b2f" stroke-width="2"/>`;
    }
    if (level >= 6) {
      g += `<rect x="0" y="${base}" width="${W}" height="40" fill="#7f9e6b"/>`;
      g += `<circle cx="120" cy="${base - 60}" r="48" fill="#6f915c"/><rect x="115" y="${base - 20}" width="10" height="24" fill="#5a4636"/>`;
      g += `<circle cx="690" cy="${base - 46}" r="36" fill="#7a9b66"/><rect x="686" y="${base - 14}" width="8" height="18" fill="#5a4636"/>`;
      g += `<rect x="${x0 + w / 2 - 26}" y="${base - 66}" width="52" height="66" fill="#4f4a45"/>`;
    }
    return g;
  }

  function interior(stageKey, r) {
    let g = `<rect width="${W}" height="${H}" fill="#d9d6cf"/>
      <path d="M0 0 L180 120 L620 120 L800 0Z" fill="#cfccc4"/>
      <path d="M0 600 L180 440 L620 440 L800 600Z" fill="${stageKey === 'ausbau' || stageKey === 'abschluss' ? '#b89a76' : '#9e9a92'}"/>
      <path d="M0 0 L180 120 L180 440 L0 600Z" fill="#c6c2b9"/>
      <path d="M800 0 L620 120 L620 440 L800 600Z" fill="#bdb9b0"/>
      <rect x="180" y="120" width="440" height="320" fill="${stageKey === 'ausbau' || stageKey === 'abschluss' ? '#f1eee8' : '#c9c6bf'}"/>
      <rect x="300" y="170" width="200" height="150" fill="#bcd3e3" stroke="#8c8c8c" stroke-width="6"/>
      <path d="M320 300 L380 190" stroke="#fff" stroke-opacity=".5" stroke-width="6"/>`;
    if (stageKey === 'technik') {
      g += `<path d="M200 380 H600" stroke="#c0392b" stroke-width="10"/><path d="M200 400 H600" stroke="#2f6db5" stroke-width="10"/>
            <path d="M560 380 V160" stroke="#c0392b" stroke-width="10"/><path d="M580 400 V160" stroke="#2f6db5" stroke-width="10"/>
            <rect x="210" y="210" width="70" height="120" rx="6" fill="#e9e9e6" stroke="#9a9a9a" stroke-width="3"/>
            <circle cx="245" cy="250" r="12" fill="none" stroke="#666" stroke-width="3"/>
            <path d="M640 250 C 700 260, 700 330, 760 340" stroke="#e4b400" stroke-width="5" fill="none"/>
            <path d="M640 270 C 690 280, 690 350, 760 360" stroke="#6d6d6d" stroke-width="5" fill="none"/>`;
    } else if (stageKey === 'rohbau' || stageKey === 'dach') {
      for (let i = 0; i < 6; i++) g += `<rect x="${200 + i * 70}" y="120" width="10" height="320" fill="#a49a85" opacity=".9"/>`;
      g += `<rect x="180" y="112" width="440" height="10" fill="#8d8a83"/>`;
    } else {
      g += `<rect x="460" y="380" width="120" height="60" fill="#e8e3da" stroke="#c9c1b4"/><rect x="200" y="360" width="140" height="80" rx="6" fill="#8b9aa3"/>`;
    }
    g += `<rect x="${60 + r() * 40}" y="470" width="90" height="40" fill="#cdb98f" opacity=".8"/>`;
    return g;
  }

  function detail(stageKey, r) {
    let g = '';
    if (stageKey === 'fundament') {
      g += `<rect width="${W}" height="${H}" fill="#a5a49f"/>`;
      for (let i = 0; i < 20; i++) g += `<line x1="${i * 44 - 20}" y1="0" x2="${i * 44 + 40}" y2="${H}" stroke="#6b4b2f" stroke-width="7"/>`;
      for (let i = 0; i < 15; i++) g += `<line x1="0" y1="${i * 44}" x2="${W}" y2="${i * 44 + 30}" stroke="#7a5535" stroke-width="7"/>`;
      g += `<rect x="560" y="420" width="160" height="30" rx="4" fill="#e3c21d"/><text x="572" y="441" font-family="Inter,Arial" font-size="15" fill="#222">0 10 20 30 40 cm</text>`;
    } else if (stageKey === 'dach') {
      g += `<rect width="${W}" height="${H}" fill="#c39a6b"/>`;
      for (let i = 0; i < 9; i++) g += `<rect x="${i * 95}" y="0" width="34" height="${H}" fill="#a77c4f"/>`;
      for (let i = 0; i < 12; i++) g += `<rect x="0" y="${i * 52}" width="${W}" height="10" fill="#8e6a44"/>`;
    } else if (stageKey === 'huelle') {
      g += `<rect width="${W}" height="${H}" fill="#ece5d9"/><rect x="170" y="90" width="460" height="420" fill="#4f5a5e"/>
            <rect x="190" y="110" width="200" height="380" fill="#9fbfd2"/><rect x="410" y="110" width="200" height="380" fill="#9fbfd2"/>
            <path d="M220 450 L360 160" stroke="#fff" stroke-opacity=".5" stroke-width="10"/><rect x="380" y="290" width="14" height="40" rx="4" fill="#ccc"/>`;
    } else {
      g += `<rect width="${W}" height="${H}" fill="#bdbab3"/>`;
      for (let i = 0; i < 120; i++) g += `<circle cx="${r() * W}" cy="${r() * H}" r="${1 + r() * 3}" fill="#8f8c86" opacity=".6"/>`;
    }
    return g;
  }

  function signboard(projectName, owner, r) {
    return `${sky(r)}${ground('#8a8170')}
      <rect x="0" y="360" width="${W}" height="80" fill="#e8e3d9" opacity=".9"/>
      ${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 52}" y="356" width="4" height="84" fill="#9a958b"/>`).join('')}
      <rect x="390" y="200" width="10" height="240" fill="#555"/><rect x="590" y="200" width="10" height="240" fill="#555"/>
      <rect x="180" y="110" width="440" height="240" rx="6" fill="#fdfdfb" stroke="#222" stroke-width="4"/>
      <rect x="180" y="110" width="440" height="48" rx="6" fill="#111"/>
      <text x="204" y="142" font-family="Inter,Arial" font-weight="700" font-size="22" fill="#fff">BAUPROJEKT</text>
      <text x="204" y="196" font-family="Inter,Arial" font-weight="700" font-size="26" fill="#111">${BC.ui.esc(projectName)}</text>
      <text x="204" y="232" font-family="Inter,Arial" font-size="17" fill="#333">Bauherrschaft: ${BC.ui.esc(owner)}</text>
      <text x="204" y="260" font-family="Inter,Arial" font-size="17" fill="#333">Architektur: Beispiel Architekten (fiktiv)</text>
      <text x="204" y="288" font-family="Inter,Arial" font-size="17" fill="#333">Baubewilligung Nr. DEMO-${100 + Math.floor(r() * 800)}</text>
      <text x="204" y="326" font-family="Inter,Arial" font-size="13" fill="#888">Fiktive Angaben – nur zu Demonstrationszwecken</text>`;
  }

  /** Liefert eine Data-URL für eine synthetische Szene. */
  function scene({ stageKey, view, seed, title, projectName, owner }) {
    const key = [stageKey, view, seed, title, projectName].join('|');
    if (cache.has(key)) return cache.get(key);
    const r = rng(key);
    let body;
    if (view === 'tafel') body = signboard(projectName, owner, r);
    else if (view === 'innen') body = interior(stageKey, r);
    else if (view === 'detail') body = detail(stageKey, r);
    else {
      const lvl = PROGRESS[stageKey] ?? 1;
      const flip = r() > 0.5;
      body = `${sky(r)}${ground(lvl >= 6 ? '#8f8a7c' : '#8d8371')}
        ${lvl >= 1 && lvl <= 3 ? crane(flip ? 150 : 670, r) : ''}
        ${building(lvl, r, 200 + r() * 40, 360 + r() * 40)}
        <rect x="0" y="470" width="${W}" height="10" fill="#6e6658" opacity=".6"/>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      ${body}
      <rect x="16" y="${H - 44}" width="232" height="28" rx="14" fill="#111" fill-opacity=".72"/>
      <text x="32" y="${H - 25}" font-family="Inter,Arial" font-size="13" font-weight="600" letter-spacing=".8" fill="#fff">SYNTHETISCHES DEMOBILD</text>
    </svg>`;
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    cache.set(key, url);
    return url;
  }

  BC.scene = scene;
})();
