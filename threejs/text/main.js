import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1500);
camera.position.set(0, 400, 700);

const cameraTarget = new THREE.Vector3(0, 150, 0);
camera.lookAt(cameraTarget);

const materials = [
  new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true }), // front
];

const textGeo = new TextGeometry("AA");
textGeo.computeBoundingBox();

const group = new THREE.Group();
group.position.y = 100;

const textMesh1 = new THREE.Mesh(textGeo, materials);

textMesh1.position.x = 100;
textMesh1.position.z = 0;

textMesh1.rotation.x = 0;
textMesh1.rotation.y = Math.PI * 2;

group.add(textMesh1);

function animate() {
  renderer.render(scene, camera);
}

const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);

document.body.appendChild(renderer.domElement);