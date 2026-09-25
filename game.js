// 🚗 Car Showroom Explorer with Interior Dive
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import TWEEN from '@tweenjs/tween.js'; // install via npm or include script

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Camera
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(0, 2, 6);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("arena").appendChild(renderer.domElement);

// Lighting
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
scene.add(hemiLight);

const spotLight = new THREE.SpotLight(0xffffff, 1.2);
spotLight.position.set(5, 10, 5);
spotLight.castShadow = true;
scene.add(spotLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enablePan = true;
controls.minDistance = 0.5;
controls.maxDistance = 10;

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Load Car Model (make sure file is in My Website/models/bmw_i7.glb)
const loader = new GLTFLoader();
let carModel;
loader.load('models/bmw_i7.glb', function(gltf) {
  carModel = gltf.scene;
  carModel.scale.set(1.2, 1.2, 1.2);
  carModel.position.set(0, 0, 0);
  scene.add(carModel);
}, undefined, function(error) {
  console.error("Error loading car model:", error);
});

// Animate loop
function animate(time) {
  requestAnimationFrame(animate);
  controls.update();
  TWEEN.update(time);
  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Camera transition helper
function moveCameraTo(x, y, z, focusX, focusY, focusZ) {
  new TWEEN.Tween(camera.position)
    .to({ x, y, z }, 2000)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start();
  new TWEEN.Tween(controls.target)
    .to({ x: focusX, y: focusY, z: focusZ }, 2000)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start();
}

// Tap detection
function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (carModel) {
    const intersects = raycaster.intersectObjects(carModel.children, true);
    if (intersects.length > 0) {
      const part = intersects[0].object.name.toLowerCase();
      console.log("Tapped on:", part);

      if (part.includes("door") || part.includes("windshield")) {
        // Dive into driver seat
        moveCameraTo(0, 1, 0.5, 0, 1, 0);
      } else if (part.includes("seat") || part.includes("dashboard")) {
        // Focus on dashboard
        moveCameraTo(0, 1.2, 0.2, 0, 1.2, 0.5);
      } else {
        // Reset to exterior view
        moveCameraTo(0, 2, 6, 0, 1, 0);
      }
    }
  }
}
window.addEventListener('click', onClick);
