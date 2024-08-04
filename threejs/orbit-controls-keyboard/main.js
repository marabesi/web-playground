import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

var xSpeed = 0.000001;
var ySpeed = 10;



const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(2, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const cube = new THREE.Mesh(geometry, material);

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
  var keyCode = event.which;
  if (keyCode == 87) {
    cube.position.y += ySpeed;
  } else if (keyCode == 83) {
    cube.position.y -= ySpeed;
  } else if (keyCode == 65) {
    cube.position.x -= xSpeed;
  } else if (keyCode == 68) {
    cube.position.x += xSpeed;
  } else if (keyCode == 32) {
    cube.position.set(0, 0, 0);
  }
};

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
