// ============================================================
// VAKAN dive: the robot sweeps back and forth as you scroll and
// collects the plastic lying on its path. Everything is driven by
// scroll progress, so scrolling back up puts the debris back.
// ============================================================
const JUNK = {
  bottle: `<svg viewBox="0 0 20 50"><rect x="6" y="0" width="8" height="6" rx="1"/><path d="M4 8h12l2 6v32a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V14z"/></svg>`,
  bag: `<svg viewBox="0 0 60 50"><path d="M5 10q25-15 50 0l-6 35q-19 8-38 0z" fill-opacity=".55"/><path d="M18 8q2-8 8 0M34 8q2-8 8 0" fill="none"/></svg>`,
  can: `<svg viewBox="0 0 26 44"><rect x="2" y="4" width="22" height="36" rx="4"/><rect x="5" y="0" width="16" height="5" rx="2"/></svg>`,
  cup: `<svg viewBox="0 0 34 40"><path d="M2 4h30l-5 34H7z"/><rect x="0" y="0" width="34" height="5" rx="2"/></svg>`,
  rings: `<svg viewBox="0 0 60 26"><g fill="none" stroke-width="4" stroke="rgba(226,242,255,.62)"><circle cx="11" cy="13" r="8"/><circle cx="30" cy="13" r="8"/><circle cx="49" cy="13" r="8"/></g></svg>`,
  straw: `<svg viewBox="0 0 50 10"><rect x="0" y="2" width="50" height="5" rx="2.5"/></svg>`,
  net: `<svg viewBox="0 0 50 40"><path d="M2 6l46 4-6 28-36-6z" fill-opacity=".35"/><path d="M2 6l40 26M48 10L6 32M14 8l-4 26M28 9l-2 26" fill="none"/></svg>`,
};
const KINDS = Object.keys(JUNK);
const SIZES = { bottle: 22, bag: 52, can: 24, cup: 30, rings: 50, straw: 40, net: 50 };
const hash = (i, k) => { const s = Math.sin(i * 91.17 + k * 47.31) * 24634.6345; return s - Math.floor(s); };

export function createOcean(section, { reduced = false } = {}) {
  const rov = section.querySelector(".rov");
  const rovText = rov.querySelector(".rov-text");
  const layer = section.querySelector(".debris");
  const plus = section.querySelector(".plus");
  const bagCount = document.querySelector(".depth-bag b");
  const bagTotal = document.querySelector(".depth-bag i");

  const PASSES = 2.5;
  let N = 18;   // recomputed from the section height in build()
  let W = 0, H = 0, vh = 0, rovW = 0, rovH = 0, xmin = 0, xmax = 0;
  let items = [], collected = 0, lastDir = 1;

  function rovAt(p) {
    const ph = p * Math.PI * 2 * PASSES;
    const x = xmin + (0.5 - 0.5 * Math.cos(ph)) * (xmax - xmin);
    const dir = Math.sin(ph) >= 0 ? 1 : -1;
    const y = Math.max(120, p * H - rovH / 2 + vh * 0.06);
    return { x, y, dir };
  }
  const mouth = (r) => ({ x: r.x + (r.dir > 0 ? 0.8 : 0.2) * rovW, y: r.y + 0.45 * rovH });

  function build() {
    W = section.clientWidth; H = section.offsetHeight; vh = window.innerHeight;
    rovW = rov.getBoundingClientRect().width; rovH = rovW * 0.5;
    xmin = Math.max(W * 0.46, 660); xmax = W - rovW - 80;
    if (xmax - xmin < 200) { xmin = 12; xmax = W - rovW - 12; }   // narrow screens: sweep full width
    layer.innerHTML = ""; items = []; collected = 0;
    N = Math.max(18, Math.round(H / 88));   // longer section → more plastic to collect

    // collectible pieces, placed exactly on the robot's path
    for (let i = 0; i < N; i++) {
      const p = 0.07 + (i / (N - 1)) * 0.86;
      const m = mouth(rovAt(p));
      const kind = KINDS[Math.floor(hash(i, 1) * KINDS.length)];
      const s = SIZES[kind] * (0.8 + hash(i, 2) * 0.5);
      const x = m.x - s / 2, y = m.y - s / 2 + (hash(i, 3) - 0.5) * 30;
      const rot = Math.round((hash(i, 4) - 0.5) * 120);
      const el = document.createElement("div");
      el.className = "junk"; el.style.width = `${s}px`; el.innerHTML = JUNK[kind];
      el.firstElementChild.style.animationDelay = `${-hash(i, 5) * 5}s`;
      const base = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
      el.style.transform = base;
      layer.appendChild(el);
      items.push({ el, p, s, base, got: false });
    }
    // ambient far-away debris for depth (not collectible)
    for (let i = 0; i < 12; i++) {
      const kind = KINDS[Math.floor(hash(i, 7) * KINDS.length)];
      const el = document.createElement("div");
      el.className = "junk amb";
      el.style.width = `${SIZES[kind] * 0.45}px`;
      el.style.transform = `translate(${hash(i, 8) * W}px, ${vh * 0.3 + hash(i, 9) * (H - vh * 0.4)}px) rotate(${hash(i, 10) * 360}deg)`;
      el.innerHTML = JUNK[kind];
      el.firstElementChild.style.animationDelay = `${-hash(i, 11) * 16}s`;
      layer.appendChild(el);
    }
    bagTotal.textContent = N;
    bagCount.textContent = 0;
  }

  function pop(m) {
    if (reduced) return;
    plus.style.transform = `translate(${m.x}px, ${m.y - 30}px)`;
    plus.classList.remove("pop"); void plus.offsetWidth; plus.classList.add("pop");
  }

  function update(p, t) {
    const r = rovAt(p);
    const bob = reduced ? 0 : Math.sin(t * 1.3) * 7;
    rov.style.transform = `translate(${r.x}px, ${r.y + bob}px) scaleX(${r.dir})`;
    if (r.dir !== lastDir) {
      lastDir = r.dir;
      rovText.setAttribute("transform", r.dir < 0 ? "translate(220 0) scale(-1 1)" : "");
    }
    const m = mouth(r);
    let changed = false;
    for (const it of items) {
      if (!it.got && p >= it.p) {
        it.got = true; collected++; changed = true;
        it.el.classList.add("got");
        it.el.style.transform = `translate(${m.x - it.s / 2}px, ${m.y - it.s / 2}px) scale(.15) rotate(200deg)`;
        pop(m);
      } else if (it.got && p < it.p) {
        it.got = false; collected--; changed = true;
        it.el.classList.remove("got");
        it.el.style.transform = it.base;
      }
    }
    if (changed) bagCount.textContent = collected;
  }

  build();
  window.addEventListener("resize", build);
  window.addEventListener("load", build);
  return { update, rebuild: build };
}
