import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createScene(canvas, { mobile }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  // o mapa de ambiente só existe na GPU: se o contexto WebGL cair, é refeito na volta (senão o metal fica escuro)
  function makeEnv() {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment?.dispose();
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    pmrem.dispose();
  }
  makeEnv();
  canvas.addEventListener('webglcontextrestored', makeEnv);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  const key = new THREE.DirectionalLight('#fff', 2.2); key.position.set(4, 5, 5); scene.add(key);
  const rim = new THREE.DirectionalLight('#fff', 3); rim.position.set(-5, 2, -4); scene.add(rim);
  const rim2 = new THREE.DirectionalLight('#fff', 1.5); rim2.position.set(5, 1, -4); scene.add(rim2);

  // luz de recorte dos dois lados tingida pela cor do sabor; k = 1 troca direto
  function setRim(color, intensity, k = 0.08) {
    rim.color.lerp(color, k); rim.intensity += (intensity - rim.intensity) * k;
    rim2.color.copy(rim.color); rim2.intensity = rim.intensity * 0.5;
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

  const render = () => renderer.render(scene, camera);

  return { renderer, scene, camera, viewSize, render, setRim };
}
