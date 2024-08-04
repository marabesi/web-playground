import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ambientLight = new THREE.AmbientLight('white', 2);

const mainLight = new THREE.DirectionalLight('white', 5);
mainLight.position.set(10, 10, 10);

function createCubeWithMaterial() {
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(
    'textures/dirt.png',
  );

  const material = new THREE.MeshStandardMaterial({
    map: texture,
  });

  return new THREE.Mesh(geometry, material);
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  35, // fov = Field Of View
  1, // aspect ratio (dummy value)
  0.1, // near clipping plane
  100, // far clipping plane
);

const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const geometry = new THREE.BoxGeometry(1, 1, 1);

const cube = createCubeWithMaterial();

scene.add(ambientLight, mainLight, cube);

camera.position.set(0, 0, 10);

controls.update();

function animate() {
  requestAnimationFrame(animate);

  controls.update();

  renderer.render(scene, camera);
}

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);

document.body.appendChild(renderer.domElement);

