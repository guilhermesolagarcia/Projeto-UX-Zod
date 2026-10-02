import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createScene(canvas, { mobile }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture;
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  const key = new THREE.DirectionalLight('#fff', 2.2); key.position.set(4, 5, 5); scene.add(key);
  const rim = new THREE.DirectionalLight('#fff', 3); rim.position.set(-5, 2, -4); scene.add(rim);

  // partículas: um InstancedMesh reaproveitado por todas as explosões
  const COUNT = mobile ? 40 : 120;
  const pMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.06, 1), new THREE.MeshStandardMaterial({ roughness: 0.4 }), COUNT);
  pMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  pMesh.frustumCulled = false;
  scene.add(pMesh);
  const parts = Array.from({ length: COUNT }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, s: 1 }));
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), col = new THREE.Color();
  for (let i = 0; i < COUNT; i++) pMesh.setColorAt(i, col.set('#ffffff'));

  function burst(origin, colors, { up = false } = {}) {
    parts.forEach((pt, i) => {
      pt.p.copy(origin);
      if (up) pt.v.set((Math.random() - 0.5) * 0.05, 0.06 + Math.random() * 0.08, (Math.random() - 0.5) * 0.05);
      else pt.v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(0.04 + Math.random() * 0.07);
      pt.life = 1;
      pt.s = (up ? 0.4 : 0.8) + Math.random() * 1.2;
      pMesh.setColorAt(i, col.set(colors[i % colors.length]));
    });
    pMesh.instanceColor.needsUpdate = true;
  }

  function stepParticles(dt) {
    const k = dt * 60;
    parts.forEach((pt, i) => {
      if (pt.life > 0) {
        pt.p.addScaledVector(pt.v, k);
        pt.v.multiplyScalar(Math.pow(0.96, k));
        pt.v.y -= 0.0015 * k;
        pt.life -= 0.012 * k;
      }
      sc.setScalar(Math.max(pt.life, 0) * pt.s);
      m.compose(pt.p, q, sc);
      pMesh.setMatrixAt(i, m);
    });
    pMesh.instanceMatrix.needsUpdate = true;
  }

  function viewSize() {
    const h = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    return { w: h * camera.aspect, h };
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  function render(dt) {
    stepParticles(dt);
    renderer.render(scene, camera);
  }

  return { renderer, scene, camera, viewSize, burst, render };
}
