// ============================================================
// Research + Projects worlds. Like VAKAN, everything is driven by
// scroll progress (so scrolling back reverses it), and each world
// lays itself out from the blocks it finds, so adding content in
// js/content.js automatically extends the animation.
// ============================================================
import { RESEARCH } from "./content.js";

const hash = (i, k) => { const s = Math.sin(i * 91.17 + k * 47.31) * 24634.6345; return s - Math.floor(s); };
const SVGNS = "http://www.w3.org/2000/svg";

// offset of el relative to an ancestor (ignores CSS transforms, unlike getBoundingClientRect)
function offsetIn(el, ancestor) {
  let x = 0, y = 0, n = el;
  while (n && n !== ancestor) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return { x, y };
}
// free horizontal band to the right of the text column
function freeBand(section, rightPad) {
  const col = section.querySelector(".col");
  const c = offsetIn(col, section);
  const W = section.clientWidth;
  return { W, H: section.offsetHeight, xmin: Math.max(c.x + col.offsetWidth + 60, W * 0.46), xmax: W - rightPad };
}

// ---------------- RESEARCH: a memory graph that each paper writes into ----------------
export function createResearch(section, { reduced = false } = {}) {
  const svg = section.querySelector(".graph");
  const layer = section.querySelector(".nodes");
  const meter = document.getElementById("m-research");
  const bagCount = meter.querySelector(".m-bag b"), bagTotal = meter.querySelector(".m-bag i");
  let nodes = [], edges = [], pulse = null, written = -1, H = 1;

  function build() {
    const band = freeBand(section, 300);
    H = band.H;
    svg.setAttribute("width", band.W); svg.setAttribute("height", H);
    svg.innerHTML = ""; layer.innerHTML = ""; nodes = []; edges = []; written = -1;
    if (band.xmax - band.xmin < 160) return;               // too narrow (phones): graph hidden by CSS

    const blocks = [...section.querySelectorAll("[data-block]")];
    let prevCluster = null;
    blocks.forEach((card, b) => {
      const data = RESEARCH.blocks[+card.dataset.block] || {};
      const head = (data.title || "").split(":")[0].replace(/&amp;/g, "&");
      const labels = [head, ...(data.memory || [])];
      const top = offsetIn(card, section).y, h = card.offsetHeight;
      const cluster = labels.map((label, k) => {
        const f = labels.length > 1 ? k / (labels.length - 1) : 0.5;
        const swing = 0.5 + 0.4 * Math.sin(k * 1.9 + b * 1.3) + (hash(b * 31 + k, 1) - 0.5) * 0.18;
        const node = {
          x: band.xmin + Math.min(1, Math.max(0, swing)) * (band.xmax - band.xmin),
          y: top + 30 + f * Math.max(0, h - 60),
          head: k === 0, on: false,
        };
        const el = document.createElement("div");
        el.className = `node${node.head ? " head" : ""}`;
        el.innerHTML = `<i></i><span>${label}</span>`;
        el.style.transform = `translate(${node.x - 6}px, ${node.y - 11}px)`;
        layer.appendChild(el);
        node.el = el;
        nodes.push(node);
        return node;
      });
      const link = (a, c, cls = "") => {
        const l = document.createElementNS(SVGNS, "line");
        l.setAttribute("x1", a.x); l.setAttribute("y1", a.y); l.setAttribute("x2", c.x); l.setAttribute("y2", c.y);
        const len = Math.hypot(c.x - a.x, c.y - a.y);
        l.setAttribute("class", `edge ${cls}`);
        l.style.strokeDasharray = len; l.style.strokeDashoffset = len;
        svg.appendChild(l);
        edges.push({ a, b: c, el: l, len, on: false });
      };
      for (let k = 1; k < cluster.length; k++) link(cluster[k - 1], cluster[k]);
      for (let k = 2; k < cluster.length; k += 3) link(cluster[0], cluster[k], "spoke");
      if (prevCluster) link(prevCluster[prevCluster.length - 1], cluster[0], "cross");
      prevCluster = cluster;
    });
    pulse = document.createElementNS(SVGNS, "circle");
    pulse.setAttribute("r", 3.5); pulse.setAttribute("class", "pulse");
    svg.appendChild(pulse);
    bagTotal.textContent = nodes.length;
  }

  function update(p, t) {
    const front = p * H + window.innerHeight * 0.1;   // the "write head" rides just below screen centre
    let count = 0;
    for (const n of nodes) {
      const on = n.y <= front;
      if (on !== n.on) { n.on = on; n.el.classList.toggle("on", on); }
      if (on) count++;
    }
    const drawn = [];
    for (const e of edges) {
      const on = e.a.on && e.b.on;
      if (on !== e.on) { e.on = on; e.el.style.strokeDashoffset = on ? 0 : e.len; }
      if (on) drawn.push(e);
    }
    if (count !== written) { written = count; bagCount.textContent = count; }
    // a retrieval pulse runs along the most recently written links
    if (pulse) {
      if (!drawn.length || reduced) { pulse.style.opacity = 0; return; }
      const recent = drawn.slice(-4);
      const u = (t * 0.9) % recent.length, e = recent[Math.floor(u)], f = u % 1;
      pulse.style.opacity = 1;
      pulse.setAttribute("cx", e.a.x + (e.b.x - e.a.x) * f);
      pulse.setAttribute("cy", e.a.y + (e.b.y - e.a.y) * f);
    }
  }

  build();
  window.addEventListener("load", build);
  return { update, meter, rebuild: build };
}

// ---------------- PROJECTS: agents carrying tool calls through AgentShield ----------------
const CALLS = [
  ["search_docs()", "allow"], ["send_email()", "review"], ["shell(curl | sh)", "block"],
  ["read_file()", "allow"], ["transfer_funds()", "review"], ["drop_table()", "block"],
  ["calendar.create()", "allow"], ["http_post(untrusted)", "block"], ["summarize()", "allow"],
  ["update_crm()", "review"], ["web_search()", "allow"],
];
const AGENTS = [
  { name: "planner", color: "#5b93ff", phase: 0.0, dy: -120 },
  { name: "coder", color: "#5ad1ff", phase: 0.21, dy: 0 },
  { name: "research", color: "#9b8cff", phase: 0.42, dy: 120 },
];
const agentSVG = (c) => `<svg viewBox="0 0 64 72"><line x1="32" y1="5" x2="32" y2="15" stroke="${c}" stroke-width="3"/><circle cx="32" cy="5" r="4.5" fill="${c}"/><rect x="8" y="15" width="48" height="36" rx="11" fill="#e9f3ff"/><rect x="14" y="22" width="36" height="21" rx="7" fill="#08131f"/><circle cx="25" cy="32.5" r="4" fill="${c}"/><circle cx="39" cy="32.5" r="4" fill="${c}"/><rect x="18" y="53" width="28" height="15" rx="5" fill="${c}" opacity=".9"/></svg>`;

export function createProjects(section, { reduced = false } = {}) {
  const layer = section.querySelector(".agents");
  const gate = section.querySelector(".gate");
  const meter = document.getElementById("m-projects");
  const valEl = meter.querySelector(".m-val span");
  const tallyEls = meter.querySelectorAll(".m-bag b");
  const L = CALLS.length, BW = 60;
  // the patrol gets more passes as the section grows (one pass per ~550px of content)
  const g = { W: 0, H: 0, xmin: 0, xmax: 0, passes: 3 };
  function measure() {
    const band = freeBand(section, BW + 110);
    Object.assign(g, band);
    if (g.xmax - g.xmin < 180) { g.xmin = 12; g.xmax = g.W - BW - 12; }
    g.passes = Math.max(2, Math.round(g.H / 550));
  }
  const at = (p, phase) => {
    const ph = (p * g.passes + phase) * Math.PI * 2;
    return { x: g.xmin + (0.5 - 0.5 * Math.cos(ph)) * (g.xmax - g.xmin), y: Math.max(130, p * g.H + window.innerHeight * 0.06) };
  };

  const agents = AGENTS.map((a, k) => {
    const el = document.createElement("div");
    el.className = "agent";
    el.innerHTML = `<div class="chip"></div>${agentSVG(a.color)}<span class="name">${a.name}</span>`;
    layer.appendChild(el);
    return { ...a, k, el, chip: el.querySelector(".chip"), key: "" };
  });

  // the gate sits mid-patrol; the patrol reaches it at phase 0.25 + 0.5m
  const crossings = (ph) => (ph < 0.25 ? 0 : Math.floor((ph - 0.25) / 0.5) + 1);
  const callFor = (k, j) => CALLS[(k * 4 + j) % L];

  function update(p, t) {
    if (!g.W) measure();
    const gx = (g.xmin + g.xmax) / 2 + BW / 2;
    const cy = Math.max(130, p * g.H + window.innerHeight * 0.06);
    gate.style.transform = `translate(${gx}px, ${cy - 190}px)`;

    const tally = { allow: 0, review: 0, block: 0 };
    let total = 0;
    for (const a of agents) {
      const ph = p * g.passes + a.phase;
      const r = at(p, a.phase);
      const wob = reduced ? 0 : Math.sin(t * 2 + a.k * 2) * 5;
      a.el.style.transform = `translate(${r.x}px, ${r.y + a.dy + wob}px)`;
      const c = crossings(ph);
      for (let j = 0; j < c; j++) { tally[callFor(a.k, j)[1]]++; total++; }
      const sinceCross = c > 0 ? ph - (0.25 + 0.5 * (c - 1)) : 1;
      const key = sinceCross < 0.16 ? `v${c - 1}` : `p${c}`;
      if (key !== a.key) {
        a.key = key;
        if (key[0] === "v") {
          const [name, v] = callFor(a.k, c - 1);
          a.chip.className = `chip ${v}`;
          a.chip.innerHTML = `${name}<i>${v.toUpperCase()}</i>`;
        } else {
          a.chip.className = "chip";
          a.chip.textContent = callFor(a.k, c)[0];
        }
      }
    }
    valEl.textContent = total;
    tallyEls[0].textContent = tally.allow; tallyEls[1].textContent = tally.review; tallyEls[2].textContent = tally.block;
  }

  window.addEventListener("load", measure);
  return { update, meter, rebuild: measure };
}
