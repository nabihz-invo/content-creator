// Stacko Motion engine — 3D scenes with Three.js (ENGINE.md §9).
// A Three.js scene inside an engine scene, drawn by an engine driver, so every frame is a pure
// function of time like the rest of the page (no requestAnimationFrame, no clock).
//
//   <script type="importmap">{ "imports": { "three": "/studio/vendor/three.module.js",
//                                           "three/addons/": "/studio/vendor/addons/" } }</script>
//   <script type="module">
//     import { three } from "/studio/engine/sm-three.js";
//     three(c, ({ THREE, scene, camera }) => {
//       const box = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial({ color: 0x2f86b8 }));
//       scene.add(box);
//       return (p, lt) => { box.rotation.y = lt * 0.8; };   // p: 0..1 over at→until · lt: seconds since at
//     }, { bloom: true });
//   </script>
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export { THREE };
/** Brand colours as THREE.Color, for materials and lights. */
export const BRAND = {
  abyss: new THREE.Color("#0E2440"),
  night: new THREE.Color("#1B416B"),
  signal: new THREE.Color("#0895A6"),
  glow: new THREE.Color("#2EF2EE"),
  ocean: new THREE.Color("#2F86B8"),
  dolphin: new THREE.Color("#79C0DE"),
  deep: new THREE.Color("#2C5974"),
  visor: new THREE.Color("#C9D8E4"),
  foam: new THREE.Color("#EEF6F9"),
};

/** The brand Night gradient (radial, #1B416B → #0E2440) as a scene background. */
function nightTexture(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  const r = Math.hypot(w, h) * 0.75;
  const g = x.createRadialGradient(w * 0.3, h * 0.35, 0, w * 0.3, h * 0.35, r);
  g.addColorStop(0, "#1B416B");
  g.addColorStop(0.62, "#0E2440");
  g.addColorStop(1, "#0E2440");
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Adds a 3D layer to scene `s`.
 * setup(ctx) builds the scene and returns update(p, lt, t) (or a promise of it, e.g. after loading
 * a model; the page waits for it before rendering). ctx: { THREE, BRAND, scene, camera, renderer, el, w, h }.
 * o: x, y, w, h (stage px, top-left; default full frame) · at, until (scene-local s; default the
 * whole scene) · fov (35) · camera [x,y,z] ([0,0,10]) · bg ('night' = the brand gradient, or a
 * CSS colour; default transparent over the scene background — bloom needs an opaque bg) ·
 * env (true: soft studio reflections) · bloom (true or { strength, radius, threshold }) ·
 * exposure (1) · front (true: above the scene's text) · parent (element).
 */
export function three(s, setup, o = {}) {
  const R = s.R;
  const w = o.w || R.w, h = o.h || R.h;
  const el = document.createElement("div");
  el.style.cssText = `position:absolute;left:${o.x || 0}px;top:${o.y || 0}px;width:${w}px;height:${h}px;pointer-events:none`;
  // Above the scene background, under the scene's text and components (o.front: on top of them).
  const parent = o.parent || s.el;
  const bgs = o.front || o.parent ? [] : parent.querySelectorAll(":scope > .sm-bgwrap");
  if (o.front || o.parent) parent.appendChild(el);
  else parent.insertBefore(el, bgs.length ? bgs[bgs.length - 1].nextSibling : parent.firstChild);
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "width:100%;height:100%;display:block";
  el.appendChild(canvas);

  // preserveDrawingBuffer: the renderer screenshots the page after seek(t).
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !o.bg, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = o.exposure ?? 1;
  const scene = new THREE.Scene();
  if (o.bg === "night") scene.background = nightTexture(w, h);
  else if (o.bg) scene.background = new THREE.Color(o.bg);
  if (o.env) {
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
  }
  const camera = new THREE.PerspectiveCamera(o.fov || 35, w / h, 0.1, 1000);
  camera.position.set(...(o.camera || [0, 0, 10]));
  camera.lookAt(0, 0, 0);

  let draw = () => renderer.render(scene, camera);
  if (o.bloom) {
    const b = o.bloom === true ? {} : o.bloom;
    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(1);
    composer.setSize(w, h);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), b.strength ?? 0.8, b.radius ?? 0.4, b.threshold ?? 0.2));
    composer.addPass(new OutputPass());
    draw = () => composer.render();
  }

  let update = null;
  const made = Promise.resolve(setup({ THREE, BRAND, scene, camera, renderer, el, w, h })).then((fn) => {
    update = typeof fn === "function" ? fn : () => {};
  });
  // Hold the page's ready signal until the setup (models, textures) is done.
  R.vids.push({ ready: () => made, sync: () => Promise.resolve(), preview: () => {} });

  const start = s.T(o.at || 0), end = o.until != null ? s.T(o.until) : s.end;
  R.driver(start, end, (p, lt, t) => {
    // Only draw while the scene is on screen (including its transitions).
    if (!update || t < s.visStart - 1e-6 || t > s.visEnd + 1e-6) return;
    update(p, lt, t);
    draw();
  });
  return { el, canvas, scene, camera, renderer };
}
