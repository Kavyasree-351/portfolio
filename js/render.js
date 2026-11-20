// ============================================================
// Builds every section's blocks from js/content.js.
// Each container in index.html has data-render="<name>".
// ============================================================
import { INTRO, RESEARCH, PROJECTS, VAKAN, COMMUNITY, TOOLKIT, CONTACT } from "./content.js";

const fmt = (v, dec) => (dec > 0 ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US"));

function stats(list) {
  if (!list || !list.length) return "";
  return `<div class="stats">${list.map((s) => {
    if (s.text) return `<div><b>${s.text}</b><small>${s.label}</small></div>`;
    const dec = s.dec || 0, from = s.from ?? 0;
    return `<div><b>${s.prefix || ""}<span class="count" data-to="${s.to}" data-from="${from}" data-dec="${dec}">${fmt(from, dec)}</span>${s.suffix || ""}</b><small>${s.label}</small></div>`;
  }).join("")}</div>`;
}
const links = (list, cls = "rlinks") =>
  list && list.length ? `<p class="${cls}">${list.map((l) => `<a data-link="${l.link}" href="#" target="_blank" rel="noopener">${l.label} ↗</a>`).join(" &nbsp; ")}</p>` : "";

const WIDGETS = {
  rrf: `<figure class="rrf" aria-label="Illustrative reciprocal rank fusion demo">
      <figcaption>reciprocal rank fusion · illustrative · Σ 1/(60 + rank)</figcaption>
      <div class="rrf-q">Q: “When is the dentist appointment now?”</div>
      <div class="rrf-cols">
        <div><h5>dense</h5><ol class="rrf-dense"></ol></div>
        <div><h5>bm25</h5><ol class="rrf-bm25"></ol></div>
        <div><h5>fused</h5><ol class="rrf-fused"></ol></div>
      </div>
    </figure>`,
  audit: `<figure class="audit" aria-label="Illustrative audit log">
      <figcaption>audit.log · illustrative <span class="audit-counts"><b class="v-allow">0</b> allow · <b class="v-review">0</b> review · <b class="v-block">0</b> block</span></figcaption>
      <ul class="audit-log"></ul>
    </figure>`,
};

// Block used by the Research and Projects worlds
const worldBlock = (b, i) => `
  <article class="proj reveal" data-block="${i}">
    <h3>${b.title}</h3>
    ${b.status ? `<p class="rstatus"><span class="dot"></span>${b.status}${b.when ? ` · ${b.when}` : ""}</p>` : ""}
    <p>${b.text}</p>
    ${stats(b.stats)}
    ${b.widget ? WIDGETS[b.widget] || "" : ""}
    ${b.note ? `<p class="rnote">${b.note}</p>` : ""}
    ${links(b.links)}
  </article>`;

const worldHeader = (s) => `
  <p class="kicker reveal">${s.kicker}</p>
  <h2 class="reveal">${s.title}</h2>
  ${s.meta ? `<p class="meta reveal">${s.meta}</p>` : ""}`;

const ICONS = {
  mail: `<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>`,
  linkedin: `<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 10.5V16M8 7.8v.2M11.5 16v-5.5M11.5 13c0-1.8 1-2.6 2.2-2.6 1.3 0 2.3.8 2.3 2.6V16"/>`,
  code: `<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12"/>`,
  doc: `<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M9 13h6M9 16.5h6"/>`,
};

const RENDER = {
  intro: () => `
    <h2 class="reveal"><span class="slash">//</span> ${INTRO.title}</h2>
    <p class="lead reveal">${INTRO.text}</p>
    <div class="grid4">${INTRO.glance.map((g) => `<div class="card reveal glance"><b>${g.value}</b><span>${g.label}</span></div>`).join("")}</div>
    <a class="tour reveal" href="#research">${INTRO.tour}</a>`,

  research: () => worldHeader(RESEARCH) + RESEARCH.blocks.map(worldBlock).join(""),
  projects: () => worldHeader(PROJECTS) + PROJECTS.blocks.map(worldBlock).join(""),

  // Same markup VAKAN has always used, now filled from data.
  vakan: () => `
          <p class="kicker reveal">${VAKAN.kicker}</p>
          <h2 class="reveal">${VAKAN.title}</h2>
          <p class="meta reveal">${VAKAN.meta}</p>
          <article class="proj reveal">
            <p>${VAKAN.text}</p>
          </article>
          <div class="sonar">
            ${VAKAN.awards.map((a) => `<div class="ping reveal"><span class="ring"></span><b>${a.title}</b><small>${a.detail}</small></div>`).join("\n            ")}
          </div>`,

  community: () => `
    <h2 class="reveal"><span class="slash">//</span> Community</h2>
    <div class="grid2">${COMMUNITY.map((c) => `
      <article class="card reveal">
        <div class="head"><h3>${c.title}</h3>${c.when ? `<span class="when">${c.when}</span>` : ""}</div>
        ${c.status ? `<p class="status">${c.status}</p>` : ""}
        <p>${c.text}</p>
        ${links(c.links, "links")}
      </article>`).join("")}
    </div>`,

  toolkit: () => `
    <h2 class="reveal"><span class="slash">//</span> Toolkit</h2>
    <div class="grid3">${TOOLKIT.map((g) => `<div class="card reveal"><h4>${g.title}</h4><p class="chips">${g.items.map((x) => `<span>${x}</span>`).join("")}</p></div>`).join("")}</div>`,

  contact: () => `
    <h2 class="reveal"><span class="slash">//</span> Get in touch</h2>
    <p class="lead reveal">${CONTACT.lead}</p>
    <div class="grid2 contact">${CONTACT.items.map((c) => {
      const icon = `<span class="ic"><svg viewBox="0 0 24 24">${ICONS[c.icon] || ICONS.doc}</svg></span>`;
      if (c.copy) return `
      <div class="card reveal c-item${c.primary ? " primary" : ""}">${icon}
        <div class="c-body"><h3>${c.title}</h3><p>${c.text}</p>
          <div class="c-actions"><a class="c-val" data-link="${c.link}" href="#">${c.value}</a><button class="copy" type="button" data-copy="${c.copy}">copy</button></div>
        </div>
      </div>`;
      return `
      <a class="card reveal c-item${c.primary ? " primary" : ""}" data-link="${c.link}" href="#" target="_blank" rel="noopener">${icon}
        <div class="c-body"><h3>${c.title}</h3><p>${c.text}</p><span class="c-val">${c.value}</span></div>
      </a>`;
    }).join("")}
    </div>
    <footer class="foot">© <span id="yr"></span> Kavyasree Nunna</footer>`,
};

export function renderAll() {
  document.querySelectorAll("[data-render]").forEach((el) => {
    const fn = RENDER[el.dataset.render];
    if (fn) el.innerHTML = fn();
  });
}
