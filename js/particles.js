// ============================================================
// One persistent particle field that morphs into a different
// "shape" for every world. Each shape is a function that places
// point i at time t, given section progress p (0..1).
// ============================================================
import * as THREE from "three";

const TAU = Math.PI * 2;
const hash = (i, k) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
const smooth = (x) => x * x * (3 - 2 * x);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

function fib(i, n, out) {
  const y = 1 - ((i + 0.5) / n) * 2;
  const r = Math.sqrt(1 - y * y);
  const th = i * 2.399963;
  out[0] = Math.cos(th) * r; out[1] = y; out[2] = Math.sin(th) * r;
}
const tmp = [0, 0, 0];

// ---------- world definitions ----------
// bg2: optional colour the background deepens to across the section.
export const WORLDS = {
  clean:   { name: "clean", bg: "#05070c", fg: "#e6ecf5", accent: "#5b93ff", point: "#5b93ff", opacity: 0, cam: [0, 0, 10], look: [0, 0, 0], noPan: true },
  research: { name: "research", bg: "#150b2c", bg2: "#07040f", fg: "#efe9ff", accent: "#b69cff", point: "#c4b5fd", opacity: 0.22, cam: [0, 0.4, 9], look: [0, 0, 0], noPan: true },
  projects: { name: "projects", bg: "#04141d", bg2: "#020609", fg: "#e0f6ff", accent: "#5ad1ff", point: "#7fdcff", opacity: 0.5, cam: [0, 0, 10], look: [0, 0, 0], noPan: true },
  intro:   { name: "surface / portfolio",       bg: "#f6f3ee", fg: "#16161a", accent: "#c2410c", point: "#3b3b46", opacity: 0.75, cam: [0, 0, 10],  look: [0, 0, 0] },
  memory:  { name: "memory / bounded state",    bg: "#0b0a14", fg: "#ebe9f5", accent: "#a78bfa", point: "#c4b5fd", opacity: 1.0, cam: [0, 0.4, 9], look: [0, 0, 0] },
  lidar:   { name: "occupancy / lidar",         bg: "#020a05", fg: "#c9f7d5", accent: "#22c55e", point: "#4ade80", opacity: 1.0,  cam: [0, 7, 5.5], look: [0, 0, 0.6] },
  mapping: { name: "3d / vision-language",      bg: "#07101e", fg: "#e6edf7", accent: "#38bdf8", point: "#7dd3fc", opacity: 1.0,  cam: [0, 2.6, 8], look: [0, -0.6, 0] },
  shield:  { name: "security / tool calls",     bg: "#12070a", fg: "#f6e9ec", accent: "#f43f5e", point: "#fb7185", opacity: 0.95, cam: [0, 0.6, 9], look: [0, 0, 0] },
  lab:     { name: "evaluation / lab notebook", bg: "#f3f4ef", fg: "#17181c", accent: "#2563eb", point: "#1e3a8a", opacity: 0.8,  cam: [0, 0, 10], look: [0, 0, 0] },
  ocean:   { name: "ocean / vakan",             bg: "#0c4a6e", bg2: "#010812", fg: "#e0f7ff", accent: "#5eead4", point: "#bae6fd", opacity: 0.9, cam: [0, 0, 9], look: [0, 0, 0], noPan: true },
  people:  { name: "community",                 bg: "#fbf0e4", fg: "#2b1d14", accent: "#ea580c", point: "#f59e0b", opacity: 0.85, cam: [0, 2.2, 9], look: [0, -1, 0] },
  contact: { name: "contact",                   bg: "#f6f3ee", fg: "#16161a", accent: "#c2410c", point: "#9a9aa5", opacity: 0.5,  cam: [0, 0, 10], look: [0, 0, 0], noPan: true },
};

// ---------- mapping (room) transform, shared with the HTML labels ----------
export function roomAngle(p) { return -0.75 + p * 1.3; }
export function roomTransform(x, y, z, p, out) {
  const a = roomAngle(p), ca = Math.cos(a), sa = Math.sin(a), s = 0.9;
  out[0] = (x * ca - z * sa) * s; out[1] = y * s; out[2] = (x * sa + z * ca) * s;
  return out;
}
export const ROOM_LABELS = [
  { pos: [-0.2, -0.45, 0.2], html: "table<i>YOLO ✓</i>" },
  { pos: [-0.2, 0.05, -0.15], html: "monitor<i>CLIP ✓</i>" },
  { pos: [-1.2, -0.15, -2.5], html: "sofa<i>SAM track</i>" },
  { pos: [1.6, -0.15, 1.6], html: "chair<i>CLIP ✓</i>" },
  { pos: [2.3, 0.0, -2.3], html: "<s>trash bin</s>plant<i>corrected</i>" },
];

// ---------- shapes ----------
const SHAPES = {
  intro(i, n, a, b, c, d, t, p, o) {
    fib(i, n, tmp);
    const R = 3.1 + (a - 0.5) * 0.9;
    const ang = t * 0.06, ca = Math.cos(ang), sa = Math.sin(ang);
    const X = tmp[0] * R, Z = tmp[2] * R;
    o[0] = X * ca - Z * sa; o[1] = tmp[1] * R + Math.sin(t * 0.5 + b * TAU) * 0.05; o[2] = X * sa + Z * ca;
    o[3] = 0.3 + c * 0.5;
  },

  // 8 recurrent slots (2×4 cubes) + a ring of 512 cached records
  memory(i, n, a, b, c, d, t, p, o) {
    const slotsN = Math.floor(n * 0.5);
    if (i < slotsN) {
      const slot = i % 8, col = slot % 4, row = Math.floor(slot / 4);
      const cx = (col - 1.5) * 1.3, cy = row ? -0.7 : 0.7;
      const phase = (t * 1.4) % 8;
      const dist = (phase - slot + 8) % 8;
      const glow = dist < 1 ? 1 - dist : 0;
      const s = 0.5 * (1 + glow * 0.22);
      const face = Math.floor(d * 6), u = (a - 0.5) * 2 * s, v = (b - 0.5) * 2 * s, w = face % 2 ? s : -s;
      let x, y, z;
      if (face < 2) { x = w; y = u; z = v; } else if (face < 4) { x = u; y = w; z = v; } else { x = u; y = v; z = w; }
      const rot = t * 0.3 + slot;
      const cr = Math.cos(rot), sr = Math.sin(rot);
      o[0] = cx + x * cr - z * sr; o[1] = cy + y; o[2] = x * sr + z * cr;
      o[3] = 0.6 + glow * 0.4;
    } else {
      const ang = a * TAU + t * 0.22;
      const r = 3.0 + (b - 0.5) * 0.3;
      o[0] = Math.cos(ang) * r;
      o[1] = Math.sin(ang) * r * 0.32 + (c - 0.5) * 0.12;
      o[2] = Math.sin(ang) * r * 0.55;
      o[3] = d > 0.985 ? 1 : 0.22 + c * 0.2;
    }
  },

  // LiDAR occupancy grid with a sweeping scan and a moving obstacle
  lidar(i, n, a, b, c, d, t, p, o) {
    const G = Math.ceil(Math.sqrt(n));
    const gx = i % G, gz = Math.floor(i / G);
    const x = (gx / (G - 1) - 0.5) * 11, z = (gz / (G - 1) - 0.5) * 11;
    let occ = 0;
    if (Math.abs(x) > 5.1 || Math.abs(z) > 5.1) occ = 1;                       // outer walls
    if (x > -3.5 && x < 1 && Math.abs(z + 2) < 0.16) occ = 1;                   // inner wall
    if (x > 2 && x < 3.6 && z > 1 && z < 2.6) occ = 1;                          // box
    if (Math.abs(x + 3) < 0.16 && z > 0.5 && z < 4) occ = 1;                    // wall
    const px = Math.sin(t * 0.45) * 3.2, pz = 0.6;                              // moving person
    const dyn = (x - px) ** 2 + (z - pz) ** 2 < 0.3 ? 1 : 0;
    const sweep = t * 1.3;
    let diff = (sweep - Math.atan2(z, x)) % TAU; if (diff < 0) diff += TAU;
    const glow = diff < 0.7 ? 1 - diff / 0.7 : 0;
    o[0] = x; o[2] = z;
    o[1] = occ ? 0.15 + a * 0.45 : dyn ? 0.2 + a * 0.6 : 0;
    o[3] = Math.min(1, (occ ? 0.8 : dyn ? 1 : 0.22) + glow * 0.55);
  },

  // A scanned room; depth noise shrinks as you scroll (calibration)
  mapping(i, n, a, b, c, d, t, p, o) {
    const f = i / n;
    let x, y, z, br;
    if (f < 0.28) { x = (a - 0.5) * 6; z = (b - 0.5) * 6; y = -1.5; br = 0.3; }                      // floor
    else if (f < 0.42) { x = (a - 0.5) * 6; y = -1.5 + b * 3; z = -3; br = 0.25; }                   // back wall
    else if (f < 0.52) { x = -3; y = -1.5 + b * 3; z = (a - 0.5) * 6; br = 0.25; }                    // left wall
    else if (f < 0.60) { x = -0.2 + (a - 0.5) * 2; z = 0.2 + (b - 0.5) * 1.1; y = -0.7; br = 0.9; }  // table top
    else if (f < 0.63) { const k = Math.floor(a * 4); x = -0.2 + (k % 2 ? 0.9 : -0.9); z = 0.2 + (k < 2 ? 0.45 : -0.45); y = -1.5 + b * 0.8; br = 0.7; }
    else if (f < 0.67) { x = -0.2 + (a - 0.5) * 0.9; y = -0.65 + b * 0.55; z = -0.15; br = 1; }       // monitor
    else if (f < 0.79) {                                                                               // sofa
      x = -1.2 + (a - 0.5) * 2.6;
      if (c < 0.5) { y = -0.9; z = -2.9 + b * 0.9; } else if (c < 0.8) { z = -2.65; y = -0.9 + b * 0.7; } else { z = -2.0; y = -1.5 + b * 0.6; }
      br = 0.85;
    } else if (f < 0.86) {                                                                             // chair
      if (c < 0.55) { x = 1.6 + (a - 0.5) * 0.7; z = 1.4 + (b - 0.5) * 0.7; y = -1.0; }
      else if (c < 0.8) { x = 1.6 + (a - 0.5) * 0.7; z = 1.75; y = -1.0 + b * 0.7; }
      else { const k = Math.floor(a * 4); x = 1.6 + (k % 2 ? 0.3 : -0.3); z = 1.4 + (k < 2 ? 0.3 : -0.3); y = -1.5 + b * 0.5; }
      br = 0.9;
    } else if (f < 0.93) {                                                                             // plant
      if (c < 0.4) { const ang = a * TAU; x = 2.3 + Math.cos(ang) * 0.25; z = -2.3 + Math.sin(ang) * 0.25; y = -1.5 + b * 0.45; }
      else { fib(i, 400, tmp); const r = 0.45 * Math.cbrt(b); x = 2.3 + tmp[0] * r; y = -0.6 + tmp[1] * r; z = -2.3 + tmp[2] * r; }
      br = 0.95;
    } else { x = (a - 0.5) * 6; y = -1.5 + b * 3; z = (c - 0.5) * 6; br = 0.15; }                   // outliers

    const noise = 0.03 + 0.5 * (1 - smooth(clamp01(p * 1.6)));
    x += (hash(i, 1) - 0.5) * noise; y += (hash(i, 2) - 0.5) * noise; z += (hash(i, 3) - 0.5) * noise;
    roomTransform(x, y, z, p, o);
    o[3] = br * (0.8 + 0.2 * Math.sin(t * 2 + d * TAU));
  },

  // Tool calls converge into a policy gate, then split into allow / review / block
  shield(i, n, a, b, c, d, t, p, o) {
    let x, y, z, br;
    if (i < n * 0.2) {
      const ang = a * TAU, r = 1.5 + (b - 0.5) * 0.08;
      x = (c - 0.5) * 0.12; y = Math.cos(ang) * r; z = Math.sin(ang) * r;
      br = 0.55 + 0.45 * Math.max(0, Math.sin(ang * 3 - t * 3));
    } else {
      const u = (a + t * (0.07 + b * 0.04)) % 1;
      const y0 = (hash(i, 1) - 0.5) * 5, z0 = (hash(i, 2) - 0.5) * 5;
      if (u < 0.5) {
        const k = u / 0.5, m = smooth(k);
        x = -6 + 6 * k; y = y0 * (1 - m) * 0.9; z = z0 * (1 - m) * 0.9; br = 0.35 + 0.4 * k;
      } else {
        const k = (u - 0.5) / 0.5;
        const lane = d < 0.62 ? 1.4 : d < 0.84 ? 0 : -1.4;
        const e = smooth(Math.min(1, k * 2.5));
        x = 6 * k; y = lane * e + (c - 0.5) * 0.15; z = (hash(i, 3) - 0.5) * 0.25;
        br = d < 0.62 ? 0.75 : d < 0.84 ? 0.6 + 0.4 * Math.sin(t * 5) ** 2 : 0.9;
        if (lane < 0 && k > 0.25) {   // blocked: stopped and dropped
          x = 1.5; const fall = (k - 0.25) * 4; y = lane - fall * 0.8; z += (hash(i, 4) - 0.5) * fall * 0.6; br = 0.9 * (1 - k);
        }
      }
    }
    const ang = -0.6, ca = Math.cos(ang), sa = Math.sin(ang);
    o[0] = x * ca - z * sa; o[1] = y; o[2] = x * sa + z * ca; o[3] = br;
  },

  // Vector clusters with drifting centroids (index rebuilds)
  lab(i, n, a, b, c, d, t, p, o) {
    const K = 7, k = i % K;
    fib(k, K, tmp);
    const cx = tmp[0] * 2.5 + Math.sin(t * 0.35 + k) * 0.35;
    const cy = tmp[1] * 2.2 + Math.cos(t * 0.3 + k * 2) * 0.3;
    const cz = tmp[2] * 2.5;
    let x, y, z, br;
    if (i < K * 40) {
      const ax = Math.floor(d * 3), off = (a - 0.5) * 0.55;
      x = cx + (ax === 0 ? off : 0); y = cy + (ax === 1 ? off : 0); z = cz + (ax === 2 ? off : 0); br = 1;
    } else {
      const r1 = Math.sqrt(-2 * Math.log(a + 1e-6)), r2 = Math.sqrt(-2 * Math.log(c + 1e-6));
      const s = 0.4;
      x = cx + r1 * Math.cos(TAU * b) * s; y = cy + r1 * Math.sin(TAU * b) * s; z = cz + r2 * Math.cos(TAU * d) * s;
      br = 0.35 + 0.25 * d;
    }
    const ang = t * 0.05, ca = Math.cos(ang), sa = Math.sin(ang);
    o[0] = x * ca - z * sa; o[1] = y; o[2] = x * sa + z * ca; o[3] = br;
  },

  // Rising bubble columns + drifting marine snow
  ocean(i, n, a, b, c, d, t, p, o) {
    if (i < n * 0.45) {
      const col = Math.floor(a * 14);
      const colX = (hash(col, 3) - 0.5) * 13, colZ = (hash(col, 4) - 0.5) * 5 - 1;
      const yy = (c + t * (0.04 + b * 0.05)) % 1;
      const y = -5 + yy * 10;
      o[0] = colX + Math.sin(y * 1.6 + d * TAU) * 0.2 * (0.4 + yy);
      o[1] = y;
      o[2] = colZ + Math.cos(y * 1.3 + d * TAU) * 0.15;
      o[3] = 0.5 + 0.5 * yy;
    } else {
      o[0] = (a - 0.5) * 17 + Math.sin(t * 0.2 + d * TAU) * 0.25;
      o[1] = 5 - ((b + t * 0.006 * (0.5 + c)) % 1) * 10;
      o[2] = (c - 0.5) * 8 - 1;
      o[3] = 0.15 + d * 0.3;
    }
  },

  // Calm surface waves
  people(i, n, a, b, c, d, t, p, o) {
    const G = Math.ceil(Math.sqrt(n));
    const gx = i % G, gz = Math.floor(i / G);
    const x = (gx / (G - 1) - 0.5) * 15, z = (gz / (G - 1) - 0.5) * 10;
    const y = Math.sin(x * 0.55 + t * 0.7) * 0.35 + Math.cos(z * 0.8 + t * 0.5) * 0.28 - 1.3;
    o[0] = x; o[1] = y; o[2] = z; o[3] = 0.3 + (y + 2) * 0.45;
  },

  clean(i, n, a, b, c, d, t, p, o) { SHAPES.intro(i, n, a, b, c, d, t, p, o); },
  research(i, n, a, b, c, d, t, p, o) { SHAPES.memory(i, n, a, b, c, d, t, p, o); o[0] = o[0] * 1.15 + 2.2; },
  projects(i, n, a, b, c, d, t, p, o) { SHAPES.lab(i, n, a, b, c, d, t, p, o); o[0] = o[0] * 1.1 + 2.2; },

  contact(i, n, a, b, c, d, t, p, o) {
    SHAPES.intro(i, n, a, b, c, d, t, p, o);
    o[0] *= 1.5; o[1] *= 1.5; o[2] *= 1.5; o[3] *= 0.6;
  },
};

// ---------- renderer ----------
export function createField(canvas, { mobile = false } = {}) {
  const N = mobile ? 3600 : 7000;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

  const pos = new Float32Array(N * 3);
  const bright = new Float32Array(N);
  const seedAttr = new Float32Array(N);
  const seeds = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < 4; k++) seeds[i * 4 + k] = hash(i + 1, k + 1);
    seedAttr[i] = hash(i, 9);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("aBright", new THREE.BufferAttribute(bright, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seedAttr, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 50);

  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color() },
      uOpacity: { value: 1 },
      uSize: { value: mobile ? 34 : 30 },
      uPR: { value: dpr },
      uRects: { value: Array.from({ length: 16 }, () => new THREE.Vector4()) },
      uRectN: { value: 0 },
      uView: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: /* glsl */`
      attribute float aBright; attribute float aSeed;
      uniform float uSize; uniform float uPR;
      uniform vec4 uRects[16]; uniform int uRectN; uniform vec2 uView;
      varying float vB;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPR * (0.6 + aSeed * 0.7) * (0.55 + aBright * 0.7) / -mv.z;
        // portrait: slide points out from behind on-screen text blocks
        if (uRectN > 0) {
          vec2 ndc = gl_Position.xy / gl_Position.w;
          vec2 px = vec2((ndc.x * 0.5 + 0.5) * uView.x, (0.5 - ndc.y * 0.5) * uView.y);
          float band = 4.0 + aSeed * 18.0;
          for (int i = 0; i < 16; i++) {
            if (i >= uRectN) break;
            vec4 r = uRects[i] + vec4(-6.0, -6.0, 6.0, 6.0);
            if (px.x > r.x && px.x < r.z && px.y > r.y && px.y < r.w) {
              float dl = px.x - r.x, dr = r.z - px.x, dt = px.y - r.y, db = r.w - px.y;
              float m = min(min(dl, dr), min(dt, db));
              if (m == dl) px.x = r.x - band; else if (m == dr) px.x = r.z + band;
              else if (m == dt) px.y = r.y - band; else px.y = r.w + band;
            }
          }
          gl_Position.xy = vec2(px.x / uView.x * 2.0 - 1.0, 1.0 - px.y / uView.y * 2.0) * gl_Position.w;
        }
        vB = aBright;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uOpacity;
      varying float vB;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.15, d);
        gl_FragColor = vec4(uColor * (0.75 + 0.45 * vB), a * uOpacity * (0.3 + 0.7 * vB));
      }`,
  });
  scene.add(new THREE.Points(geo, mat));

  const oA = new Float32Array(4), oB = new Float32Array(4);
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  const cA = new THREE.Color(), cB = new THREE.Color();

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  // state: { A, B, mix, pA, pB, t, pan, dim }
  function render(s) {
    // nothing visible (clean sections): skip the per-point work entirely
    if (WORLDS[s.A].opacity === 0 && WORLDS[s.B].opacity === 0) { renderer.clear(); return; }
    const fa = SHAPES[s.A], fb = SHAPES[s.B];
    const same = s.A === s.B || s.mix <= 0.001 || s.mix >= 0.999;
    const only = s.mix >= 0.999 ? fb : fa, onlyP = s.mix >= 0.999 ? s.pB : s.pA;
    const m = s.mix;
    for (let i = 0; i < N; i++) {
      const j = i * 4, a = seeds[j], b = seeds[j + 1], c = seeds[j + 2], d = seeds[j + 3];
      if (same) {
        only(i, N, a, b, c, d, s.t, onlyP, oA);
        pos[i * 3] = oA[0]; pos[i * 3 + 1] = oA[1]; pos[i * 3 + 2] = oA[2]; bright[i] = oA[3];
      } else {
        // stagger each point slightly so the morph feels like a swarm, not a crossfade
        const mm = smooth(clamp01((m - seedAttr[i] * 0.3) / 0.7));
        fa(i, N, a, b, c, d, s.t, s.pA, oA);
        fb(i, N, a, b, c, d, s.t, s.pB, oB);
        pos[i * 3] = oA[0] + (oB[0] - oA[0]) * mm;
        pos[i * 3 + 1] = oA[1] + (oB[1] - oA[1]) * mm;
        pos[i * 3 + 2] = oA[2] + (oB[2] - oA[2]) * mm;
        bright[i] = oA[3] + (oB[3] - oA[3]) * mm;
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aBright.needsUpdate = true;

    const WA = WORLDS[s.A], WB = WORLDS[s.B];
    const panA = WA.noPan ? 0 : s.pan, panB = WB.noPan ? 0 : s.pan;
    camPos.set(WA.cam[0] + panA, WA.cam[1], WA.cam[2]).lerp(new THREE.Vector3(WB.cam[0] + panB, WB.cam[1], WB.cam[2]), m);
    camLook.set(WA.look[0] + panA, WA.look[1], WA.look[2]).lerp(new THREE.Vector3(WB.look[0] + panB, WB.look[1], WB.look[2]), m);
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    cA.set(WA.point); cB.set(WB.point);
    mat.uniforms.uColor.value.copy(cA).lerp(cB, m);
    mat.uniforms.uOpacity.value = (WA.opacity + (WB.opacity - WA.opacity) * m) * s.dim;
    const rects = s.rects || [];
    mat.uniforms.uRectN.value = rects.length;
    rects.forEach((r, i) => mat.uniforms.uRects.value[i].set(r[0], r[1], r[2], r[3]));
    mat.uniforms.uView.value.set(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
  }

  const v = new THREE.Vector3();
  function project(x, y, z) {
    v.set(x, y, z).project(camera);
    return [(v.x * 0.5 + 0.5) * window.innerWidth, (-v.y * 0.5 + 0.5) * window.innerHeight, v.z];
  }

  return { render, project };
}
