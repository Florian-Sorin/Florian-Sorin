// Banner generator for the profile README.
// Usage:  cd .github/banner && npm install && node generate.js
// Writes ../../assets/banner.svg. Edit the text in the "text" section at the bottom,
// or change `seed` to get a different skyline.
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const OUT = process.argv[2] || path.join(__dirname, '../../assets/banner.svg');
const W = 1280, H = 420;

// ---------- seeded random ----------
let seed = 20261026;
function rnd() {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const R = (a, b) => a + rnd() * (b - a);
const RI = (a, b) => Math.floor(R(a, b + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const f = (n) => Math.round(n * 10) / 10;

// ---------- fonts ----------
const fdir = path.join(__dirname, 'node_modules/@fontsource');
const serif = opentype.loadSync(path.join(fdir, 'instrument-serif/files/instrument-serif-latin-400-normal.woff'));
const serifIt = opentype.loadSync(path.join(fdir, 'instrument-serif/files/instrument-serif-latin-400-italic.woff'));
const mono = opentype.loadSync(path.join(fdir, 'jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff'));

function textPath(font, str, x, y, size, tracking = 0) {
  if (!tracking) return font.getPath(str, x, y, size).toPathData(2);
  let d = '', cx = x;
  for (const ch of str) {
    d += font.getPath(ch, cx, y, size).toPathData(2);
    cx += font.getAdvanceWidth(ch, size) + tracking;
  }
  return d;
}

// ---------- palette ----------
const C = {
  far: '#1c2337',
  farEdge: '#232a40',
  mid: '#0f1422',
  near: '#090c15',
  unlit: '#1b2233',
  lit: ['#f6c56f', '#ffd690', '#eaa055', '#f3b866', '#ffe2a8'],
  cream: '#f2e8d5',
  amber: '#e2a85a',
  muted: '#9aa3b8',
};

let svg = [];
const push = (s) => svg.push(s);

// ---------- defs ----------
push(`<defs>
  <clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#05080f"/>
    <stop offset="0.42" stop-color="#0d1426"/>
    <stop offset="0.72" stop-color="#1d1d2e"/>
    <stop offset="1" stop-color="#3a2a26"/>
  </linearGradient>
  <radialGradient id="cityglow" cx="0.68" cy="1.05" r="0.75">
    <stop offset="0" stop-color="#f0a253" stop-opacity="0.42"/>
    <stop offset="0.45" stop-color="#b7663a" stop-opacity="0.14"/>
    <stop offset="1" stop-color="#000" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="moonhalo" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#e8e0c8" stop-opacity="0.28"/>
    <stop offset="1" stop-color="#e8e0c8" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="cloud" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0b1020" stop-opacity="0"/>
    <stop offset="0.55" stop-color="#2a2433" stop-opacity="0.55"/>
    <stop offset="1" stop-color="#6b4636" stop-opacity="0.35"/>
  </linearGradient>
  <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#c98d5c" stop-opacity="0"/>
    <stop offset="0.5" stop-color="#c98d5c" stop-opacity="0.13"/>
    <stop offset="1" stop-color="#c98d5c" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="vignetteL" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#04060c" stop-opacity="0.82"/>
    <stop offset="0.38" stop-color="#04060c" stop-opacity="0.45"/>
    <stop offset="0.6" stop-color="#04060c" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="vignetteB" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0.7" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity="0.45"/>
  </linearGradient>
  <linearGradient id="zinc" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1c2232"/>
    <stop offset="1" stop-color="#0a0d16"/>
  </linearGradient>
  <filter id="blur12" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
  <filter id="blur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="winglow" x="-10%" y="-10%" width="120%" height="120%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>`);

// ---------- styles / animation ----------
push(`<style>
  .rain-far { animation: rainFar 1.5s linear infinite; }
  .rain-near { animation: rainNear 0.85s linear infinite; }
  @keyframes rainFar { from { transform: translate(0px, 0px); } to { transform: translate(-84px, ${H}px); } }
  @keyframes rainNear { from { transform: translate(0px, 0px); } to { transform: translate(-105px, ${H}px); } }
  .clouds { animation: drift 70s ease-in-out infinite alternate; }
  @keyframes drift { from { transform: translateX(-30px); } to { transform: translateX(40px); } }
  .blink { animation: blink 2.4s steps(1, end) infinite; }
  @keyframes blink { 0%, 70% { opacity: 0.15; } 71%, 100% { opacity: 1; } }
  .w1 { animation: wA 11s ease-in-out infinite; }
  .w2 { animation: wB 17s ease-in-out infinite; }
  .w3 { animation: wC 23s ease-in-out infinite; }
  @keyframes wA { 0%, 46% { opacity: 1; } 50%, 78% { opacity: 0.08; } 82%, 100% { opacity: 1; } }
  @keyframes wB { 0%, 30% { opacity: 0.08; } 34%, 88% { opacity: 1; } 92%, 100% { opacity: 0.08; } }
  @keyframes wC { 0%, 62% { opacity: 1; } 63%, 64% { opacity: 0.4; } 65%, 100% { opacity: 1; } }
  .tv { animation: tv 3.2s steps(4, end) infinite; }
  @keyframes tv { 0% { fill: #8fb3d9; } 25% { fill: #b9c9e8; } 50% { fill: #7c9cc4; } 75% { fill: #a7bde0; } }
  @media (prefers-reduced-motion: reduce) {
    .rain-far, .rain-near, .clouds, .blink, .w1, .w2, .w3, .tv { animation: none; }
  }
</style>`);

push(`<g clip-path="url(#frame)">`);

// ---------- sky ----------
push(`<rect width="${W}" height="${H}" fill="url(#sky)"/>`);
push(`<rect width="${W}" height="${H}" fill="url(#cityglow)"/>`);
// moon behind clouds
push(`<circle cx="1105" cy="72" r="120" fill="url(#moonhalo)"/>`);
push(`<circle cx="1105" cy="72" r="23" fill="#ece5d2" opacity="0.88"/>`);
// clouds lit from below by the city
{
  let g = `<g class="clouds" opacity="0.9" filter="url(#blur12)">`;
  const bands = [
    [180, 70, 420, 26], [620, 52, 380, 22], [1040, 92, 360, 20], [1180, 60, 260, 16],
    [380, 130, 520, 30], [900, 150, 560, 34], [120, 180, 420, 24], [1240, 190, 300, 26],
  ];
  for (const [cx, cy, rx, ry] of bands) g += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#cloud)"/>`;
  g += `</g>`;
  push(g);
}
// a few stars where the clouds break
{
  let g = `<g fill="#e9e4d6">`;
  for (let i = 0; i < 26; i++) {
    const x = R(0, W), y = R(6, 120);
    g += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(R(0.5, 1.1))}" opacity="${f(R(0.15, 0.5))}"/>`;
  }
  g += `</g>`;
  push(g);
}

// ---------- far skyline ----------
function farSkyline() {
  const base = 338;
  let d = '';
  let x = -10;
  const extras = [];
  while (x < W + 10) {
    const w = R(28, 78);
    const t = Math.min(1, Math.max(0, x / W));
    const h = R(40, 88) * (0.55 + 0.8 * t);
    const top = base - h;
    const roof = rnd();
    if (roof < 0.35) {
      // mansard roof
      const m = R(8, 14);
      d += `M${f(x)} ${base}V${f(top + m)}L${f(x + m * 0.6)} ${f(top)}H${f(x + w - m * 0.6)}L${f(x + w)} ${f(top + m)}V${base}Z`;
    } else if (roof < 0.6) {
      // Amsterdam-ish gable
      const s = w * 0.22;
      d += `M${f(x)} ${base}V${f(top + 14)}H${f(x + s)}V${f(top + 6)}H${f(x + 2 * s)}V${f(top)}H${f(x + w - 2 * s)}V${f(top + 6)}H${f(x + w - s)}V${f(top + 14)}H${f(x + w)}V${base}Z`;
    } else {
      d += `M${f(x)} ${base}V${f(top)}H${f(x + w)}V${base}Z`;
      if (rnd() < 0.5) extras.push(`<rect x="${f(x + R(4, w - 10))}" y="${f(top - R(8, 14))}" width="5" height="14" fill="${C.far}"/>`);
    }
    x += w - R(0, 6);
  }
  return { d, extras };
}
{
  const { d, extras } = farSkyline();
  let g = `<g>`;
  g += `<path d="${d}" fill="${C.far}"/>`;
  g += extras.join('');
  // generic dome
  g += `<path d="M392 300 Q392 252 432 248 Q472 252 472 300Z" fill="${C.far}"/><rect x="386" y="298" width="92" height="40" fill="${C.far}"/><rect x="428" y="234" width="8" height="16" fill="${C.far}"/><path d="M432 222 L436 234 H428Z" fill="${C.far}"/>`;
  // spire
  g += `<path d="M756 338 V282 H772 V338Z M760 282 L764 214 L768 282Z" fill="${C.far}"/>`;
  // clock tower
  g += `<rect x="880" y="236" width="30" height="102" fill="${C.far}"/><path d="M876 238 L895 200 L914 238Z" fill="${C.far}"/><circle cx="895" cy="254" r="7" fill="#d9b277" opacity="0.55"/>`;
  // crane with blinking light
  g += `<g fill="none" stroke="${C.far}" stroke-width="4"><path d="M612 338 V188"/><path d="M560 192 H700"/></g><path d="M612 188 L606 176 H618Z" fill="${C.far}"/><circle class="blink" cx="700" cy="190" r="3" fill="#ff5a3c"/>`;
  g += `</g>`;
  push(g);
}
// haze between layers
push(`<rect x="0" y="250" width="${W}" height="120" fill="url(#haze)"/>`);

// ---------- mid layer: Haussmann-like blocks with lit windows ----------
{
  const base = H;
  let bodies = '', unlit = '', lit = '', flick = '';
  let x = -6;
  while (x < W + 10) {
    const w = R(70, 140);
    const t = Math.min(1, Math.max(0, x / W));
    const h = R(78, 122) * (0.62 + 0.72 * t);
    const top = base - h;
    const m = R(12, 18); // mansard depth
    bodies += `M${f(x)} ${base}V${f(top + m)}L${f(x + 9)} ${f(top)}H${f(x + w - 9)}L${f(x + w)} ${f(top + m)}V${base}Z`;
    // chimneys
    for (let c = 0; c < RI(1, 3); c++) {
      const cx = x + R(12, w - 24), ch = R(8, 16);
      bodies += `M${f(cx)} ${f(top + 2)}V${f(top - ch)}H${f(cx + 12)}V${f(top + 2)}Z`;
      for (let p = 0; p < RI(2, 4); p++) bodies += `M${f(cx + 1 + p * 3.4)} ${f(top - ch)}V${f(top - ch - 4)}H${f(cx + 3.4 + p * 3.4)}V${f(top - ch)}Z`;
    }
    // dormer windows in the mansard
    for (let dx = x + 14; dx < x + w - 18; dx += R(22, 30)) {
      bodies += `M${f(dx)} ${f(top + m)}V${f(top + 5)}L${f(dx + 5)} ${f(top + 1)}L${f(dx + 10)} ${f(top + 5)}V${f(top + m)}Z`;
      const r = rnd();
      const win = `<rect x="${f(dx + 2.5)}" y="${f(top + 6)}" width="5" height="${f(m - 8)}" `;
      if (r < 0.22) lit += win + `fill="${pick(C.lit)}"/>`; else unlit += win + `/>`;
    }
    // facade windows
    const cols = Math.max(2, Math.floor((w - 16) / 15));
    const gap = (w - 16) / cols;
    for (let ry = top + m + 9; ry < base - 12; ry += 19) {
      for (let c = 0; c < cols; c++) {
        const wx = x + 8 + c * gap + (gap - 6) / 2;
        const win = `<rect x="${f(wx)}" y="${f(ry)}" width="6" height="10" `;
        const r = rnd();
        if (r < 0.04 && x > 640) flick += `<rect class="tv" x="${f(wx)}" y="${f(ry)}" width="6" height="10"/>`;
        else if (r < 0.1) flick += win + `class="${pick(['w1', 'w2', 'w3'])}" fill="${pick(C.lit)}"/>`;
        else if (r < 0.27) lit += win + `fill="${pick(C.lit)}"/>`;
        else unlit += win + `/>`;
      }
    }
    // balcony line
    bodies += `M${f(x)} ${f(top + m + 4)}H${f(x + w)}V${f(top + m + 6)}H${f(x)}Z`;
    x += w + R(-2, 3);
  }
  push(`<path d="${bodies}" fill="${C.mid}"/>`);
  push(`<g fill="${C.unlit}" opacity="0.75">${unlit}</g>`);
  push(`<g filter="url(#winglow)" opacity="0.92">${lit}${flick}</g>`);
}

// ---------- foreground rooftop ----------
{
  const ridgeY = 356;
  let g = '';
  // zinc roof
  g += `<path d="M700 ${H} L770 ${ridgeY} H${W} V${H}Z" fill="url(#zinc)"/>`;
  // standing seams
  let seams = '';
  for (let sx = 790; sx < W; sx += 15) seams += `M${sx} ${ridgeY + 2}L${sx - 42} ${H}`;
  g += `<path d="${seams}" stroke="#262e42" stroke-width="1.2" opacity="0.7"/>`;
  // ridge highlight (wet zinc catching city light)
  g += `<path d="M770 ${ridgeY} H${W}" stroke="#e7a660" stroke-width="1.2" opacity="0.45"/>`;
  // chimney stack with terracotta pots
  g += `<rect x="1168" y="276" width="64" height="${ridgeY - 276 + 2}" fill="${C.near}"/>`;
  g += `<rect x="1164" y="272" width="72" height="7" fill="#111523"/>`;
  for (let i = 0; i < 4; i++) {
    const px = 1172 + i * 15;
    const ph = [16, 12, 18, 13][i];
    g += `<path d="M${px} 272 V${272 - ph} Q${px + 5} ${272 - ph - 4} ${px + 10} ${272 - ph} V272Z" fill="#2b1c1a"/>`;
  }
  g += `<path d="M1164 272.5 H1236" stroke="#e7a660" stroke-width="1" opacity="0.35"/>`;
  // TV antenna
  g += `<g stroke="${C.near}" stroke-width="2.2" fill="none"><path d="M1252 ${ridgeY} V262"/><path d="M1236 272 H1268 M1240 282 H1264 M1243 292 H1261"/></g>`;
  push(g);
}

// ---------- the figure: seen from behind, headphones on ----------
{
  const cx = 1010, rg = 357;
  const sil = '#05070d';
  const body =
    `M${cx - 38} ${rg + 1}Q${cx - 45} ${rg - 12} ${cx - 40} ${rg - 30}` +
    `C${cx - 40} ${rg - 46} ${cx - 37} ${rg - 55} ${cx - 27} ${rg - 58}` +
    `C${cx - 17} ${rg - 61} ${cx - 10} ${rg - 64} ${cx - 7} ${rg - 72}` +
    `H${cx + 7}` +
    `C${cx + 10} ${rg - 64} ${cx + 17} ${rg - 61} ${cx + 27} ${rg - 58}` +
    `C${cx + 37} ${rg - 55} ${cx + 40} ${rg - 46} ${cx + 40} ${rg - 30}` +
    `Q${cx + 45} ${rg - 12} ${cx + 38} ${rg + 1}Z`;
  const hy = rg - 87;
  const head = `<ellipse cx="${cx}" cy="${hy}" rx="14.5" ry="16.5"/>`;
  const cups = `<rect x="${cx - 21.5}" y="${hy - 7}" width="8.5" height="18" rx="3.6"/><rect x="${cx + 13}" y="${hy - 7}" width="8.5" height="18" rx="3.6"/>`;
  const bandD = `M${cx - 17.5} ${hy - 2} A17.5 19.5 0 0 1 ${cx + 17.5} ${hy - 2}`;
  const shape = `<path d="${body}"/>${head}${cups}`;
  // soft warm glow so the silhouette separates from the haze
  push(`<g fill="#f0a253" opacity="0.32" filter="url(#blur12)">${shape}</g>`);
  push(`<g fill="${sil}">${shape}<path d="${bandD}" fill="none" stroke="${sil}" stroke-width="5" stroke-linecap="round"/></g>`);
  // rim light on the top edges (hair, headphone band, shoulders)
  const rim = '#f2b06a';
  push(`<g fill="none" stroke="${rim}" stroke-linecap="round">` +
    `<path d="M${cx - 15.5} ${hy - 11} A17.5 19.5 0 0 1 ${cx + 15.5} ${hy - 11}" stroke-width="1.3" opacity="0.75"/>` +
    `<path d="M${cx - 27} ${rg - 58} C${cx - 17} ${rg - 61} ${cx - 10} ${rg - 64} ${cx - 7.5} ${rg - 70}" stroke-width="1.1" opacity="0.5"/>` +
    `<path d="M${cx + 27} ${rg - 58} C${cx + 17} ${rg - 61} ${cx + 10} ${rg - 64} ${cx + 7.5} ${rg - 70}" stroke-width="1.1" opacity="0.5"/>` +
    `<path d="M${cx - 38.5} ${rg - 44} C${cx - 37} ${rg - 53} ${cx - 33} ${rg - 56} ${cx - 27} ${rg - 58}" stroke-width="1.1" opacity="0.4"/>` +
    `<path d="M${cx + 38.5} ${rg - 44} C${cx + 37} ${rg - 53} ${cx + 33} ${rg - 56} ${cx + 27} ${rg - 58}" stroke-width="1.1" opacity="0.4"/>` +
    `<path d="M${cx - 20.5} ${hy - 5} V${hy + 8} M${cx + 20.5} ${hy - 5} V${hy + 8}" stroke-width="1" opacity="0.45"/>` +
    `</g>`);
}

// ---------- rain ----------
function rainLayer(n, len, dxPerH, opMin, opMax, width, cls, color) {
  const lines = [];
  for (let i = 0; i < n; i++) {
    const x = R(0, W + 140), y = R(0, H), l = R(len[0], len[1]);
    const dx = -l * dxPerH;
    const o = f(R(opMin, opMax));
    lines.push([x, y, dx, l, o]);
  }
  let d = '';
  const shift = H * dxPerH;
  let g = `<g class="${cls}" stroke="${color}" stroke-width="${width}" stroke-linecap="round">`;
  for (const [x, y, dx, l, o] of lines) {
    // tile + copy one screen above so the loop is seamless
    g += `<path d="M${f(x)} ${f(y)}l${f(dx)} ${f(l)}M${f(x + shift)} ${f(y - H)}l${f(dx)} ${f(l)}" opacity="${o}"/>`;
  }
  g += `</g>`;
  return g;
}
push(rainLayer(150, [8, 14], 0.2, 0.10, 0.24, 0.8, 'rain-far', '#a9b9d6'));
push(rainLayer(70, [16, 26], 0.25, 0.14, 0.32, 1.1, 'rain-near', '#c3cfe6'));

// ---------- legibility vignettes ----------
push(`<rect width="${W}" height="${H}" fill="url(#vignetteL)"/>`);
push(`<rect width="${W}" height="${H}" fill="url(#vignetteB)"/>`);

// ---------- text ----------
push(`<path d="${textPath(mono, 'FULL-STACK DEVELOPER  ·  NANTES  ·  47.21°N 1.55°W', 74, 126, 15.5, 2.8)}" fill="${C.amber}"/>`);
push(`<path d="${textPath(serif, 'Florian Sorin', 68, 214, 96)}" fill="${C.cream}"/>`);
push(`<path d="${textPath(serifIt, 'Building small things after dark.', 72, 262, 34)}" fill="${C.muted}"/>`);

push(`</g>`);
// inner border
push(`<rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="17.5" fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1.5"/>`);

const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">
<title id="t">Florian Sorin, full-stack developer in Nantes</title>
<desc id="d">A European city at night, in the rain. Someone wearing headphones sits on a zinc rooftop, looking at the lit windows.</desc>
${svg.join('\n')}
</svg>
`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);
console.log('wrote', OUT, (out.length / 1024).toFixed(1) + ' KB');
