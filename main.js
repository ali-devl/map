import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// Blue globe sphere
const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0x1e90ff, shininess: 5 });
const globe = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(globe);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Load GeoJSON map (country outlines)
fetch('/map.geojson')
  .then(res => res.json())
  .then(data => {
    const group = new THREE.Group();

    data.features.forEach(feature => {
      const coords = feature.geometry.coordinates;
      const type = feature.geometry.type;

      if (type === 'Polygon') {
        coords.forEach(polygon => drawPolygon(polygon, group));
      } else if (type === 'MultiPolygon') {
        coords.forEach(multi => multi.forEach(polygon => drawPolygon(polygon, group)));
      }
    });

    scene.add(group);
  });

// Helper: convert lat/lon to 3D coords and draw country borders
function drawPolygon(polygon, group) {
  const shape = new THREE.BufferGeometry();
  const points = [];

  polygon.forEach(([lon, lat]) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (-lon + 180) * (Math.PI / 180);
    const r = 1.001;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);
    points.push(x, y, z);
  });

  shape.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const line = new THREE.Line(shape, new THREE.LineBasicMaterial({ color: 0xffffff }));
  group.add(line);
}

// Handle resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
