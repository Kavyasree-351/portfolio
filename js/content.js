// ============================================================
//  ALL PAGE CONTENT LIVES HERE.
//
//  To add a block, copy an existing entry in the list you want
//  (a paper, a project, an award, a card…) and edit it. Sections
//  grow on their own, and their animations re-measure to fit.
//
//  Text fields may contain simple HTML such as <b>bold</b>.
//
//  stats: { to, from?, dec?, prefix?, suffix?, label }  → animated count
//         { text, label }                              → fixed value
//  links: { label, link }  where `link` is a key in js/config.js
// ============================================================

export const INTRO = {
  title: "Hi, I'm Kavyasree",
  text: "Final-year CS student at BITS Pilani, Dubai. I research how <b>language agents remember</b>, how <b>robots map their surroundings</b>, and how <b>AI agents can act safely</b>, and I co-founded an underwater robotics venture. Open to research internships and ML / AI engineering roles.",
  glance: [
    { value: "4", label: "papers submitted / under review" },
    { value: "72.44%", label: "exact-value accuracy after 5,000 turns (CHALM)" },
    { value: "INR 2L", label: "SPARKS Innovation Grant for VAKAN" },
    { value: "WTM", label: "Women Techmakers Dubai Ambassador" },
  ],
  tour: "↓ start the tour: research → projects → VAKAN",
};

// ---------------- RESEARCH (memory-graph world) ----------------
// `memory`: the nodes this paper "writes" into the graph beside its card.
export const RESEARCH = {
  kicker: "01 — Research · one question, four papers",
  title: "What should a machine remember, and how does it find it again?",
  meta: "Memory for language agents, maps for robots, labels for 3D scenes · 4 papers submitted / under review",
  blocks: [
    {
      title: "CHALM: Hybrid Retrieval &amp; Centered Prefix Reads",
      status: "ACL Rolling Review · under review", when: "Aug – Oct 2026",
      text: "Bounded conversational memory: an 8-slot recurrent state plus a 512-record exact-text cache in a 1.32 MB footprint. Dense and BM25 rankings are fused with reciprocal rank fusion, and frozen readers are conditioned with a 16-token centered prefix. Evaluated on LongMemEval and LoCoMo.",
      stats: [
        { to: 72.44, dec: 2, suffix: "%", label: "exact-value accuracy (± 6.71) after 5,000 turns" },
        { to: 10.44, dec: 2, prefix: "+", suffix: " pp", label: "over full-history reads" },
        { from: 8.03, to: 1.32, dec: 2, suffix: " MB", label: "memory, down from 8.03 MB" },
      ],
      widget: "rrf",
      memory: ["8-slot state", "512-record cache", "dense", "BM25", "RRF", "16-token prefix", "LongMemEval", "LoCoMo"],
    },
    {
      title: "LALM: Continuous-State Memory for Language Agents",
      status: "Manuscript submitted · under review", when: "Jun – Oct 2026",
      text: "Bounded conversational memory for long-horizon language agents, compared against six retrieval, symbolic, latent-state and hybrid alternatives. Built Python experiment workflows with synthetic 5,000-turn dialogues, multiple seeds and ablations.",
      note: "An earlier version was accepted at IEEE ICTAI and withdrawn because in-person attendance wasn't possible. The revised work is under review elsewhere.",
      memory: ["latent state", "symbolic", "hybrid", "5,000 turns", "multi-seed", "ablation"],
    },
    {
      title: "DiFEN: Fuzzy Evidence &amp; Staged Occupancy-Map Verification",
      status: "ACIIDS 2027 · under review", when: "Jul – Aug 2026",
      text: "Ran implementations and verified outputs for LiDAR occupancy-map maintenance, contributed to the methodology, and created the system architecture diagram. Four-observation staged verification was evaluated on LILocBench.",
      stats: [
        { from: 1524, to: 974, label: "cell writes, down from 1,524" },
        { to: 36.1, dec: 1, suffix: "%", label: "fewer writes in the dynamic scene" },
      ],
      links: [{ label: "code", link: "difen" }],
      memory: ["LiDAR scan", "occupancy cell", "fuzzy evidence", "4 observations", "LILocBench"],
    },
    {
      title: "Uncertainty-Aware 3D Vision-Language &amp; Motion Mapping",
      status: "Submitted to MoSICom 2026 · with a PhD scholar", when: "May – Oct 2026",
      text: "A pipeline over 2,091 iPhone RGB-D frames combining geometric depth calibration with YOLO, CLIP and SAM-based segmentation for semantic mapping.",
      stats: [
        { from: 31.53, to: 3.76, dec: 2, suffix: "%", label: "median depth error, down from 31.53%" },
        { to: 13, suffix: "/15", label: "false classifications corrected" },
        { to: 23.81, dec: 2, prefix: "+", suffix: "%", label: "valid correspondences (SAM 3.1)" },
      ],
      links: [{ label: "code", link: "mapping" }],
      memory: ["RGB-D frame", "depth calibration", "YOLO", "CLIP: “chair”", "SAM mask", "semantic map"],
    },
  ],
};

// ---------------- PROJECTS (agent-network world) ----------------
export const PROJECTS = {
  kicker: "02 — Projects · agents, routing &amp; retrieval",
  title: "Building agents you can trust",
  meta: "Every tool call on the right passes the AgentShield checkpoint.",
  blocks: [
    {
      title: "AgentShield: Tool-Call Security for AI Agents",
      text: "An experimental layer that intercepts proposed agent tool calls and decides to <b class=\"v-allow\">allow</b>, <b class=\"v-block\">block</b>, or <b class=\"v-review\">request human review</b> before execution. It combines schema validation, contextual authorization, deterministic policies, risk analysis, provenance tracking and session state, with audit logging and a governance dashboard. Evaluated with a mock-agent harness: attack success, benign completion, false blocking, review frequency and latency.",
      widget: "audit",
      links: [{ label: "code", link: "agentshield" }],
    },
    {
      title: "LLM Routing Lifecycle Benchmarks",
      text: "A CPU evaluation workflow testing when an LLM router can recover feedback and validation costs while preserving quality, using historical RouterBench outcomes on math, reasoning and law workloads. It compares TF-IDF ridge, cosine kNN, prompt-length, fixed-model and fixed-mixture controls.",
      stats: [
        { to: 36497, label: "queries · 11 models" },
        { to: 2592, label: "decisions from 18 runs" },
      ],
      note: "Negative result reported openly: no superior new routing method or current cost savings was established.",
      links: [{ label: "code", link: "routing" }],
    },
    {
      title: "Dynamic Vector Ingestion: Recall Calibration Under Corpus Growth",
      text: "How recall calibration behaves as an inverted-file index grows or its centroids are rebuilt, comparing static, periodic, incremental and audit-based calibration across two datasets.",
      stats: [
        { to: 1800, label: "conditions retained" },
        { text: "5 × 3", label: "seeds × mutation modes" },
      ],
      note: "Negative result reported openly: the hypothesised recall breakdown did not replicate.",
      links: [{ label: "code", link: "vector" }],
    },
  ],
};

// ---------------- VAKAN (ocean world) ----------------
export const VAKAN = {
  kicker: "06 — Venture · Autonomous marine robotics",
  title: "VAKAN: an underwater robot that cleans coastal plastic",
  meta: "Co-Founder &amp; Strategy Lead · Dubai · Nov 2024 – Jun 2026",
  text: "Co-founded a venture building an autonomous underwater robot for coastal plastic-waste removal. Coordinated a <b>10+ person team</b> across computer science, mechanical and electrical engineering, from concept to working prototype. Presented technical demos and grant pitches to faculty and innovation panels.",
  awards: [
    { title: "SPARKS Innovation Grant", detail: "INR 200,000 · BITS Pilani" },
    { title: "Top Performer award", detail: "INR 15,000 · BITS Pilani" },
    { title: "Top 30 of 1,000+ teams", detail: "Eureka! GCC" },
    { title: "Top 21 of 200+ teams", detail: "Mukherjee Innovation Fund Venture Challenge" },
    { title: "James Dyson Award 2025", detail: "Featured on the UAE national page" },
  ],
};

// ---------------- COMMUNITY ----------------
export const COMMUNITY = [
  {
    title: "Women Techmakers", when: "Dubai / WANA",
    status: "Dubai Ambassador (current) · previously Council Member",
    text: "Contributed to regional technology initiatives through the Women Techmakers with Technovation council, whose scope covered 20+ countries.",
  },
  {
    title: "Millennium Fellowship", when: "2024",
    status: "UN Academic Impact &amp; MCN · Fellow &amp; Project Lead",
    text: "Led the “Bring a Smile Initiative”: independently designed and delivered a 6+ month computer-science education program for shelter-camp residents, adapting it to participant feedback.",
  },
];

// ---------------- TOOLKIT ----------------
export const TOOLKIT = [
  { title: "programming", items: ["Python", "C++", "SQL", "React", "Node.js"] },
  { title: "deep learning &amp; vision", items: ["PyTorch", "CLIP", "YOLO", "SAM", "RGB-D", "depth calibration"] },
  { title: "research &amp; evaluation", items: ["LLM agents", "bounded memory", "dense / BM25", "RRF", "benchmarks", "ablations", "multi-seed eval", "synthetic data"] },
];

// ---------------- CONTACT ----------------
export const CONTACT = {
  lead: "Open to <b>research internships</b> and <b>ML / AI engineering roles</b>. Based in Dubai, UAE. Email is the fastest way to reach me.",
  items: [
    { icon: "mail", title: "Email", text: "For roles, internships or research collaborations.", link: "email", value: "sree.kn3501@gmail.com →", copy: "sree.kn3501@gmail.com", primary: true },
    { icon: "linkedin", title: "LinkedIn", text: "Experience, recommendations and updates.", link: "linkedin", value: "View profile ↗" },
    { icon: "code", title: "GitHub", text: "Code for the research and projects above.", link: "github", value: "github.com/Kavyasree-351 ↗" },
    { icon: "doc", title: "Résumé", text: "Two-page PDF with full details.", link: "resume", value: "Download PDF ↓" },
  ],
};
