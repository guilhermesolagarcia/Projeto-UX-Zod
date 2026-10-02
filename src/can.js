import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { drawLabelMaps, LACRE } from './labels.js';

const V = (x, y) => new THREE.Vector2(x, y);
const BODY = [V(0.66, -1.55), V(0.66, 1.35)];
const TOP = [V(0.66, 1.35), V(0.655, 1.42), V(0.6, 1.55), V(0.56, 1.62), V(0.568, 1.665), V(0.574, 1.695), V(0.56, 1.712), V(0.542, 1.70), V(0.53, 1.66), V(0.3, 1.648), V(0, 1.645)];
const BOTTOM = [V(0, -1.6), V(0.3, -1.63), V(0.45, -1.685), V(0.5, -1.70), V(0.58, -1.68), V(0.64, -1.62), V(0.66, -1.55)];

// texturas de rótulo compartilhadas entre todas as latas; no celular em meia resolução (1024×716)
const LABEL_SCALE = matchMedia('(max-width: 768px)').matches ? 0.5 : 1;
const texCache = new Map();
function labelTextures(i) {
  if (texCache.has(i)) return texCache.get(i);
  const c = drawLabelMaps(i, { scale: LABEL_SCALE });
  const tex = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const out = { map: tex(c.color, true), rough: tex(c.rough), metal: tex(c.metal), bump: tex(c.bump) };
  texCache.set(i, out);
  return out;
}

// desenha e sobe pra GPU todos os rótulos antes do loop, pra troca de sabor não engasgar no meio do scroll
export function preloadLabels(renderer, count) {
  for (let i = 0; i < count; i++) Object.values(labelTextures(i)).forEach((t) => renderer.initTexture(t));
}

let tabGeo = null;
function tabGeometry() {
  if (tabGeo) return tabGeo;
  const svg = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill-rule="evenodd" d="${LACRE}"/></svg>`);
  tabGeo = new THREE.ExtrudeGeometry(SVGLoader.createShapes(svg.paths[0]), { depth: 3, bevelEnabled: true, bevelSize: 1, bevelThickness: 1, bevelSegments: 2 });
  tabGeo.center();
  return tabGeo;
}

function dropsTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 1024;
  const g = c.getContext('2d');
  let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 900; i++) {
    const x = r() * 512, y = r() * 1024, rad = 1 + r() * r() * 6;
    g.fillStyle = `rgba(255,255,255,${0.12 + r() * 0.25})`; g.beginPath(); g.ellipse(x, y, rad, rad * 1.25, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(x - rad * 0.35, y - rad * 0.4, rad * 0.3, 0, 7); g.fill();
  }
  for (let i = 0; i < 14; i++) {
    const x = r() * 512, y0 = r() * 700, len = 120 + r() * 260, w = 2 + r() * 3;
    const gr = g.createLinearGradient(0, y0, 0, y0 + len); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.35)');
    g.fillStyle = gr; g.fillRect(x, y0, w, len);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(x + w / 2, y0 + len, w * 1.4, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let shadowTex = null;
function shadowTexture() {
  if (shadowTex) return shadowTex;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, 'rgba(0,0,0,.45)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
  return (shadowTex = new THREE.CanvasTexture(c));
}

export function createCan({ condensation = true } = {}) {
  const group = new THREE.Group();
  const inner = new THREE.Group(); inner.rotation.y = Math.PI; group.add(inner); // frente do rótulo (u = 0,5) virada pra câmera

  // troca líquida: o rótulo B sobe por cima do A com uma onda na borda
  const uniforms = { uMix: { value: 0 }, uTime: { value: 0 }, mapB: { value: null }, roughnessMapB: { value: null }, metalnessMapB: { value: null } };
  const bodyMat = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 1, bumpScale: 1.2, clearcoat: 0.7, clearcoatRoughness: 0.18 });
  bodyMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform float uMix;
uniform float uTime;
uniform sampler2D mapB;
uniform sampler2D roughnessMapB;
uniform sampler2D metalnessMapB;`)
      .replace('#include <map_fragment>', `
float lq = step(vMapUv.y, uMix * 1.12 - 0.06 + 0.025 * sin(vMapUv.x * 18.85 + uTime * 2.0));
diffuseColor *= mix(texture2D(map, vMapUv), texture2D(mapB, vMapUv), lq);`)
      .replace('#include <roughnessmap_fragment>', `
float roughnessFactor = roughness;
roughnessFactor *= mix(texture2D(roughnessMap, vRoughnessMapUv), texture2D(roughnessMapB, vRoughnessMapUv), lq).g;`)
      .replace('#include <metalnessmap_fragment>', `
float metalnessFactor = metalness;
metalnessFactor *= mix(texture2D(metalnessMap, vMetalnessMapUv), texture2D(metalnessMapB, vMetalnessMapUv), lq).b;`);
  };
  inner.add(new THREE.Mesh(new THREE.LatheGeometry(BODY, 128), bodyMat));

  const alu = new THREE.MeshStandardMaterial({ color: '#d6dade', metalness: 1, roughness: 0.26, side: THREE.DoubleSide });
  inner.add(new THREE.Mesh(new THREE.LatheGeometry(TOP, 128), alu));
  inner.add(new THREE.Mesh(new THREE.LatheGeometry(BOTTOM, 128), alu));

  // lacre 3D com dobradiça
  const tabPivot = new THREE.Group(); tabPivot.position.set(0, 1.665, 0); inner.add(tabPivot);
  const tab = new THREE.Mesh(tabGeometry(), new THREE.MeshStandardMaterial({ color: '#c9ced4', metalness: 1, roughness: 0.22 }));
  tab.scale.setScalar(0.0045); tab.rotation.x = -Math.PI / 2; tab.position.set(0, 0, -0.12);
  tabPivot.add(tab);

  let drops = null;
  if (condensation) {
    drops = dropsTexture();
    const dropMat = new THREE.MeshPhysicalMaterial({ map: drops, transparent: true, depthWrite: false, roughness: 0.08, metalness: 0, clearcoat: 1 });
    inner.add(new THREE.Mesh(new THREE.LatheGeometry([V(0.664, -1.55), V(0.664, 1.35)], 128), dropMat));
  }

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.72; shadow.scale.y = 0.5;
  group.add(shadow);

  const cur = { from: -1, to: -1, bump: null };
  function setFlavors(from, to, mix) {
    if (from !== cur.from) {
      const t = labelTextures(from);
      bodyMat.map = t.map; bodyMat.roughnessMap = t.rough; bodyMat.metalnessMap = t.metal;
      if (cur.from === -1) bodyMat.needsUpdate = true;
      cur.from = from;
    }
    if (to !== cur.to) {
      const t = labelTextures(to);
      uniforms.mapB.value = t.map; uniforms.roughnessMapB.value = t.rough; uniforms.metalnessMapB.value = t.metal;
      cur.to = to;
    }
    uniforms.uMix.value = mix;
    const bump = labelTextures(mix < 0.5 ? from : to).bump;
    if (bump !== cur.bump) { bodyMat.bumpMap = bump; if (!cur.bump) bodyMat.needsUpdate = true; cur.bump = bump; }
  }

  function setOpen(p) { tabPivot.rotation.x = -p * 0.9; }

  function update(dt, t) {
    uniforms.uTime.value = t;
    if (drops) drops.offset.y -= dt * 0.01;
  }

  setFlavors(0, 1, 0);
  return { group, setFlavors, setOpen, update };
}
