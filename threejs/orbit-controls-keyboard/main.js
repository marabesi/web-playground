import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(2, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const cube = new THREE.Mesh(geometry, material);

controls.keys = {
  LEFT: 'ArrowRight', //left arrow
  UP: 'ArrowDown', // up arrow
  RIGHT: 'ArrowLeft', // right arrow
  BOTTOM: 'ArrowUp' // down arrow
}
controls.enableDamping = true;
controls.listenToKeyEvents(window);

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
