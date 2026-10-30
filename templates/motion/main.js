// 3D motion-graphics template (ADR-0007). Every visual state is a pure function
// of t (0 ≤ t ≤ duration): window.__render.seek(t) renders that exact frame.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  applyDocument,
  clamp,
  ease,
  fontStack,
  fontsReady,
  hashString,
  markReady,
  param,
  prng,
  spec,
  textDirection,
} from "./lib/runtime.js";

applyDocument();

const W = spec.width;
const H = spec.height;
const DURATION = spec.duration_s ?? 15;
const SCENES = spec.scenes.length
  ? spec.scenes
  : [
      {
        index: 1,
        start_s: 0,
        end_s: DURATION,
        text: spec.copy.hook,
        visual: "",
        camera: {
          start: [0, 1.5, 7],
          end: [1, 1.3, 6],
          look_at: [0, 1, 0],
          easing: "easeInOutCubic",
        },
      },
    ];
const C = spec.colors;
const STYLE = spec.style;
const DARK = spec.color_mode === "dark" || STYLE === "holographic_scifi";

const FX = {
  clean: { bloom: 0, grain: 0, vignette: 0, ca: 0 },
  cinematic: { bloom: 0.55, grain: 0.035, vignette: 0.35, ca: 0.0015 },
  bold: { bloom: 1.1, grain: 0.045, vignette: 0.5, ca: 0.004 },
}[spec.post_fx ?? "cinematic"] ?? { bloom: 0.55, grain: 0.035, vignette: 0.35, ca: 0.0015 };

// ── renderer ──────────────────────────────────────────────────────────────
const glCanvas = document.getElementById("gl");
const overlay = document.getElementById("overlay");
overlay.width = W;
overlay.height = H;
const renderer = new THREE.WebGLRenderer({
  canvas: glCanvas,
  antialias: false,
  preserveDrawingBuffer: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = DARK ? 1.05 : 0.85;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(W < H ? 50 : 36, W / H, 0.1, 200);

const bg = new THREE.Color(DARK && STYLE === "holographic_scifi" ? "#05070d" : C.background);
const accent = new THREE.Color(C.accent);
const palette = [accent, ...C.palette.map((p) => new THREE.Color(p.hex))];

// ── environment: backdrop dome, floor, lights ─────────────────────────────
{
  const top = bg.clone().lerp(new THREE.Color(DARK ? "#3a3f5c" : "#ffffff"), DARK ? 0.25 : 0.55);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(80, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: top },
        uBottom: { value: bg },
        uAccent: { value: accent },
        uGlow: { value: DARK ? 0.18 : 0.08 },
      },
      vertexShader:
        "varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 uTop; uniform vec3 uBottom; uniform vec3 uAccent; uniform float uGlow; varying vec3 vPos;
        void main(){
          float h = clamp(normalize(vPos).y * 0.5 + 0.5, 0.0, 1.0);
          vec3 col = mix(uBottom, uTop, smoothstep(0.35, 0.95, h));
          float glow = pow(clamp(1.0 - abs(normalize(vPos).y - 0.05) * 3.0, 0.0, 1.0), 3.0);
          gl_FragColor = vec4(col + uAccent * glow * uGlow, 1.0);
        }`,
    }),
  );
  scene.add(dome);

  if (STYLE === "holographic_scifi") {
    const grid = new THREE.GridHelper(60, 60, accent, accent);
    grid.material.transparent = true;
    grid.material.opacity = 0.18;
    scene.add(grid);
  } else {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.ShadowMaterial({ opacity: DARK ? 0.45 : 0.18 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
  }

  scene.add(new THREE.HemisphereLight(DARK ? 0x9aa4ff : 0xffffff, bg, DARK ? 0.9 : 0.8));
  const key = new THREE.DirectionalLight(0xffffff, DARK ? 2.4 : 2.0);
  key.position.set(5, 10, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  key.shadow.blurSamples = 12;
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 });
  scene.add(key);
  if (STYLE === "glassmorphism" || STYLE === "holographic_scifi") {
    const rim = new THREE.PointLight(accent, 30, 30);
    rim.position.set(-4, 3, -3);
    scene.add(rim);
  }
}

// ── materials (fresnel rim via onBeforeCompile) ───────────────────────────
function withRim(material, color, strength = 0.6, power = 2.5) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = { value: color };
    shader.uniforms.uRimStrength = { value: strength };
    shader.uniforms.uRimPower = { value: power };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform vec3 uRimColor; uniform float uRimStrength; uniform float uRimPower;",
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        float rimDot = clamp(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0);
        totalEmissiveRadiance += uRimColor * pow(max(rimDot, 1e-4), uRimPower) * uRimStrength;`,
      );
  };
  return material;
}

function material(rand, i) {
  const base = palette[Math.floor(rand() * palette.length)].clone();
  switch (STYLE) {
    case "claymorphism":
      return withRim(
        new THREE.MeshStandardMaterial({
          color: base.lerp(new THREE.Color("#ffffff"), DARK ? 0.3 : 0.12),
          roughness: 0.85,
          metalness: 0,
        }),
        new THREE.Color("#ffffff"),
        DARK ? 0.25 : 0.12,
        3,
      );
    case "glassmorphism":
      return i === 0
        ? withRim(
            new THREE.MeshPhysicalMaterial({
              color: "#ffffff",
              transmission: 0.92,
              thickness: 0.8,
              roughness: 0.18,
              ior: 1.4,
              metalness: 0,
              clearcoat: 1,
            }),
            accent,
            0.9,
            2,
          )
        : withRim(
            new THREE.MeshPhysicalMaterial({
              color: base,
              roughness: 0.25,
              metalness: 0.1,
              clearcoat: 1,
              emissive: accent,
              emissiveIntensity: 0.15,
            }),
            accent,
            0.7,
            2.5,
          );
    case "holographic_scifi":
      return new THREE.MeshBasicMaterial({
        color: base.lerp(accent, 0.6),
        wireframe: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
    case "editorial":
      return new THREE.MeshStandardMaterial({ color: base, roughness: 0.6, metalness: 0.05 });
    default:
      return withRim(
        new THREE.MeshStandardMaterial({
          color: base,
          roughness: 1,
          metalness: 0,
          flatShading: true,
        }),
        accent,
        0.2,
        3,
      );
  }
}

function geometry(rand, hero) {
  const s = hero ? 1.5 : 0.35 + rand() * 0.4;
  const pick = Math.floor(rand() * 4);
  if (STYLE === "holographic_scifi")
    return pick % 2
      ? new THREE.IcosahedronGeometry(s * 0.8, 1)
      : new THREE.TorusGeometry(s * 0.7, s * 0.06, 12, 64);
  if (STYLE === "editorial") return new THREE.BoxGeometry(s * 1.2, s * 1.6, 0.04);
  if (pick === 0) return new RoundedBoxGeometry(s, s, s, 4, s * 0.25);
  if (pick === 1) return new THREE.SphereGeometry(s * 0.6, 48, 32);
  if (pick === 2) return new THREE.TorusGeometry(s * 0.45, s * 0.18, 24, 64);
  return new THREE.CapsuleGeometry(s * 0.3, s * 0.6, 8, 24);
}

// ── one cluster per scene, seeded from its description ────────────────────
const clusters = SCENES.map((sc, i) => {
  const rand = prng(hashString(`${sc.visual}|${i}|${spec.project_id}`));
  const group = new THREE.Group();
  const items = [];
  const hero = new THREE.Mesh(geometry(rand, true), material(rand, 0));
  hero.position.set(0, 1.25, 0);
  hero.castShadow = true;
  group.add(hero);
  items.push({
    mesh: hero,
    angle: 0,
    radius: 0,
    y: 1.25,
    speed: 0.35 + rand() * 0.2,
    phase: rand() * 6.28,
    hero: true,
  });
  if (STYLE === "holographic_scifi") {
    const n = 1800;
    const pts = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
      const u = rand() * 2 - 1;
      const th = rand() * Math.PI * 2;
      const r = 1.9 + rand() * 0.25;
      const q = Math.sqrt(1 - u * u);
      pts.set([r * q * Math.cos(th), 1.25 + r * u, r * q * Math.sin(th)], k * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    const cloud = new THREE.Points(
      g,
      new THREE.PointsMaterial({
        color: accent,
        size: 0.035,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(cloud);
    items.push({ mesh: cloud, angle: 0, radius: 0, y: 0, speed: 0.15, phase: 0, cloud: true });
  }
  const count = 4 + Math.floor(rand() * 4);
  for (let k = 0; k < count; k++) {
    const m = new THREE.Mesh(geometry(rand, false), material(rand, k + 1));
    m.castShadow = true;
    group.add(m);
    items.push({
      mesh: m,
      angle: (k / count) * Math.PI * 2 + rand() * 0.4,
      radius: 1.9 + rand() * 0.9,
      y: 0.45 + rand() * 1.9,
      speed: 0.25 + rand() * 0.35,
      phase: rand() * 6.28,
    });
  }
  group.visible = false;
  scene.add(group);
  return { group, items, scene: sc };
});

// ── post-processing ───────────────────────────────────────────────────────
const target = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, target);
composer.setPixelRatio(1);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
// On light backgrounds bloom would haze the whole frame: only true highlights glow.
if (FX.bloom > 0)
  composer.addPass(
    new UnrealBloomPass(
      new THREE.Vector2(W, H),
      DARK ? FX.bloom : FX.bloom * 0.4,
      0.4,
      DARK ? 0.85 : 0.97,
    ),
  );
composer.addPass(new OutputPass());
const finish = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrain: { value: FX.grain },
    uVignette: { value: FX.vignette },
    uCA: { value: FX.ca },
    uRes: { value: new THREE.Vector2(W, H) },
  },
  vertexShader:
    "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; uniform float uGrain; uniform float uVignette; uniform float uCA; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5;
      vec2 off = d * uCA;
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      float vig = smoothstep(0.9, 0.25, length(d) * 1.3);
      col *= mix(1.0, vig, uVignette);
      col += (hash(floor(vUv * uRes) + floor(uTime * 60.0)) - 0.5) * uGrain;
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }`,
});
composer.addPass(finish);

// ── timing helpers ────────────────────────────────────────────────────────
const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
function safePosition(pos, look) {
  // Keep the camera outside the hero and above the floor; avoid NaN from bad keyframes.
  if (![pos.x, pos.y, pos.z].every(Number.isFinite)) pos.set(0, 1.6, 7);
  const d = pos.clone().sub(look);
  const len = d.length();
  const minDist = W < H ? 4.6 : 3.8; // portrait frames need more distance to fit the hero
  if (len < minDist) pos.copy(look).add(d.setLength(minDist));
  if (len > 16) pos.copy(look).add(d.setLength(16));
  pos.y = Math.max(pos.y, 0.35);
  return pos;
}
function sceneAt(t) {
  let i = 0;
  for (let k = 0; k < SCENES.length; k++) if (t >= SCENES[k].start_s) i = k;
  return i;
}
function cameraFor(i, t) {
  const sc = SCENES[i];
  const p = (ease[sc.camera.easing] ?? ease.easeInOutCubic)(
    clamp((t - sc.start_s) / Math.max(0.001, sc.end_s - sc.start_s)),
  );
  const look = v3(sc.camera.look_at ?? [0, 1.2, 0]);
  const pos = safePosition(v3(sc.camera.start).lerp(v3(sc.camera.end), p), look);
  return { pos, look };
}

// ── overlay text ──────────────────────────────────────────────────────────
const ctx = overlay.getContext("2d");
const headingFont = fontStack(spec.brand.fonts.heading);
const unit = Math.min(W, H) / 100;

function wrap(text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawOverlay(t) {
  ctx.clearRect(0, 0, W, H);
  const i = sceneAt(t);
  const sc = SCENES[i];
  const u = t - sc.start_s;
  const dur = sc.end_s - sc.start_s;
  const last = i === SCENES.length - 1;
  const alpha = clamp((u - 0.2) / 0.45) * (last ? 1 : clamp((dur - 0.15 - u) / 0.4));

  // Brand mark
  if (spec.brand.name) {
    ctx.globalAlpha = 0.9;
    ctx.font = `700 ${unit * 3}px ${headingFont}`;
    ctx.direction = textDirection(spec.brand.name);
    ctx.textAlign = "center";
    ctx.fillStyle = C.text;
    ctx.fillText(spec.brand.name, W / 2, H * 0.07);
  }

  const text = (sc.text ?? "").trim();
  if (text && alpha > 0) {
    let size = (W < H ? 7.2 : 6) * unit;
    const maxWidth = W * 0.84;
    let lines;
    do {
      ctx.font = `800 ${size}px ${headingFont}`;
      lines = wrap(text, maxWidth);
      size -= unit * 0.4;
    } while (lines.length > 3 && size > unit * 3.5);
    size += unit * 0.4;
    const lineH = size * (textDirection(text) === "rtl" ? 1.45 : 1.18);
    const blockH = lines.length * lineH;
    const yTop = H * (W < H ? 0.7 : 0.68) - blockH / 2;
    const width =
      Math.min(maxWidth, Math.max(...lines.map((l) => ctx.measureText(l).width))) + size * 1.2;
    ctx.globalAlpha = alpha * 0.82;
    ctx.fillStyle = DARK ? "rgba(6,8,14,0.55)" : "rgba(255,255,255,0.72)";
    roundRect(W / 2 - width / 2, yTop - size * 0.55, width, blockH + size * 0.6, size * 0.45);
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = C.text;
    ctx.direction = textDirection(text);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    lines.forEach((l, k) => ctx.fillText(l, W / 2, yTop + k * lineH));
    ctx.textBaseline = "alphabetic";
  }

  if (last && spec.copy.cta) {
    const a = clamp((u - dur * 0.35) / 0.5);
    if (a > 0) {
      ctx.globalAlpha = a;
      ctx.font = `800 ${unit * 4}px ${headingFont}`;
      ctx.direction = textDirection(spec.copy.cta);
      const w = ctx.measureText(spec.copy.cta).width + unit * 8;
      const h = unit * 8;
      const y = H * 0.86;
      ctx.fillStyle = C.accent;
      roundRect(W / 2 - w / 2, y - h / 2, w, h, h / 2);
      ctx.fill();
      ctx.fillStyle =
        getComputedStyle(document.documentElement).getPropertyValue("--on-accent").trim() || "#111";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(spec.copy.cta, W / 2, y + unit * 0.2);
      ctx.textBaseline = "alphabetic";
    }
  }
  ctx.globalAlpha = 1;
}

// ── the frame function ────────────────────────────────────────────────────
function renderAt(tIn) {
  const t = clamp(Number.isFinite(tIn) ? tIn : 0, 0, DURATION);
  const i = sceneAt(t);

  clusters.forEach((c, k) => {
    const sc = c.scene;
    const u = t - sc.start_s;
    const dur = sc.end_s - sc.start_s;
    const last = k === SCENES.length - 1;
    const appear = ease.easeOutExpo(clamp(u / 0.7));
    const leave = last ? 1 : 1 - ease.easeInOutCubic(clamp((u - (dur - 0.45)) / 0.45));
    const s = k === i ? appear * leave : 0;
    c.group.visible = s > 0.001;
    if (!c.group.visible) return;
    c.group.scale.setScalar(Math.max(s, 0.001));
    c.group.rotation.y = t * 0.12 + k * 0.7;
    for (const it of c.items) {
      if (it.cloud) {
        it.mesh.rotation.y = t * it.speed;
        continue;
      }
      if (it.hero) {
        it.mesh.rotation.set(t * 0.3 + it.phase, t * it.speed, 0);
        it.mesh.position.y = it.y + Math.sin(t * 1.1 + it.phase) * 0.08;
        continue;
      }
      const a = it.angle + t * it.speed;
      it.mesh.position.set(
        Math.cos(a) * it.radius,
        it.y + Math.sin(t * 1.3 + it.phase) * 0.12,
        Math.sin(a) * it.radius,
      );
      it.mesh.rotation.set(t * 0.6 + it.phase, t * 0.4, 0);
    }
  });

  // Camera: keyframes from the scene plan, a short glide from the previous scene's end, subtle drift.
  let { pos, look } = cameraFor(i, t);
  const u = t - SCENES[i].start_s;
  if (i > 0 && u < 0.6) {
    const prev = cameraFor(i - 1, SCENES[i - 1].end_s);
    const k = ease.easeInOutCubic(u / 0.6);
    pos = prev.pos.clone().lerp(pos, k);
    look = prev.look.clone().lerp(look, k);
  }
  pos.add(
    new THREE.Vector3(
      Math.sin(t * 0.35) * 0.12,
      Math.sin(t * 0.27) * 0.08,
      Math.cos(t * 0.31) * 0.1,
    ),
  );
  camera.position.copy(pos);
  camera.lookAt(look);

  finish.uniforms.uTime.value = t;
  composer.render();
  drawOverlay(t);
  return true;
}

window.__render = {
  duration: DURATION,
  fps: spec.fps ?? 60,
  width: W,
  height: H,
  scenes: SCENES.map((s) => ({ index: s.index, start_s: s.start_s, end_s: s.end_s })),
  seek: renderAt,
};

await fontsReady();
const still = param("t");
renderAt(still !== null ? parseFloat(still) : 0);
markReady();

// Live preview loops in real time unless a renderer controls time (?t= or ?still).
if (still === null && param("still") === null) {
  let start = null;
  const loop = (ts) => {
    start ??= ts;
    renderAt(((ts - start) / 1000) % DURATION);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
