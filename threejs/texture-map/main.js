import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function createCubeWithMaterial() {
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(
    'textures/dirt.png',
  );

  const material = new THREE.MeshBasicMaterial({
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

scene.add(cube);

camera.position.set(0, 0, 10);

// camera.position.set(50, 20, 100);
controls.update();

function animate() {
  requestAnimationFrame(animate);

  controls.update();

  renderer.render(scene, camera);
}

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);

document.body.appendChild(renderer.domElement);

