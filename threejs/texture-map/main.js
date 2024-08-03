import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function createMaterial() {
  // create a texture loader.
  const textureLoader = new THREE.TextureLoader();

  // load a texture
  const texture = textureLoader.load(
    'textures/dirt.png',
  );

  // create a "standard" material using
  // the texture we just loaded as a color map
  const material = new THREE.MeshStandardMaterial({
    map: texture,
  });

  return material;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(2, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const geometry = new THREE.BoxGeometry(2, 2, 2);
geometry.isBufferGeometry = true;

const material = createMaterial();

//const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
//material.wireframe = true;

const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.set(50, 20, 100);
controls.update();

function animate() {
  requestAnimationFrame(animate);

  controls.update();

  renderer.render(scene, camera);
}

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);

document.body.appendChild(renderer.domElement);
