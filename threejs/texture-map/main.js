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
  const material = new THREE.MeshBasicMaterial({
    // color: 0x00ff00,
    map: texture,
    // wireframe: true,
  });
  // const material = new THREE.MeshStandardMaterial({
  //   map: texture,
  //   color: 'purple'
  // });

  return material;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  // 2, window.innerWidth / window.innerHeight, 0.1, 1000
 35, // fov = Field Of View
  1, // aspect ratio (dummy value)
  0.1, // near clipping plane
  100, // far clipping plane
);
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const geometry = new THREE.BoxGeometry(1, 1, 1);
// geometry.isBufferGeometry = true;

const material = createMaterial();

// const material = new THREE.MeshStandardMaterial({ color: 'purple' });
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
//material.wireframe = true;

const cube = new THREE.Mesh(geometry, material);
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

