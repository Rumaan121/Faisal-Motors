/* ---------------- Car data ---------------- */
const CARS = [
  {
    id:'sedan', name:'Aurel GT', tag:'Executive Sedan', price:'$58,400', body:0x1c2b3d, accent:0xe8a94c,
    blurb:'A quiet, long-legged cruiser built for the motorway more than the corner.',
    ext:[['0–60 mph','4.6s'],['Top Speed','161 mph'],['Range','340 mi'],['Drivetrain','AWD']],
    intr:[['Seating','5, ventilated leather'],['Display','14.9" curved OLED'],['Sound','16-speaker studio'],['Trim','Brushed aluminum']]
  },
  {
    id:'suv', name:'Kessel Ridge', tag:'Performance SUV', price:'$71,900', body:0x3a2f22, accent:0xe8a94c,
    blurb:'Raised stance, wide track — everyday utility with real off-road reserve.',
    ext:[['0–60 mph','5.1s'],['Top Speed','149 mph'],['Range','305 mi'],['Drivetrain','AWD']],
    intr:[['Seating','7, three rows'],['Display','12.3" digital cluster'],['Sound','12-speaker'],['Trim','Open-pore walnut']]
  },
  {
    id:'coupe', name:'Vesper S', tag:'Sport Coupe', price:'$94,200', body:0x241417, accent:0xe8586b,
    blurb:'Low, wide, and stripped of anything that doesn\u2019t make it faster.',
    ext:[['0–60 mph','3.2s'],['Top Speed','188 mph'],['Range','255 mi'],['Drivetrain','RWD']],
    intr:[['Seating','2, carbon buckets'],['Display','10.2" driver-focused'],['Sound','8-speaker lightweight'],['Trim','Alcantara + carbon']]
  }
];

/* ---------------- Three.js scene ---------------- */
const wrap = document.getElementById('arena-wrap');
const mount = document.getElementById('arena');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0e0e10, 8, 22);

const camera = new THREE.PerspectiveCamera(45, mount.clientWidth/mount.clientHeight, 0.1, 100);
const EXT_POS = new THREE.Vector3(5.2, 2.4, 5.6);
const EXT_TARGET = new THREE.Vector3(0, 0.6, 0);
camera.position.copy(EXT_POS);

const renderer = new THREE.WebGLRenderer({antialias:true, alpha:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(mount.clientWidth, mount.clientHeight);
renderer.shadowMap.enabled = true;
mount.appendChild(renderer.domElement);

// Floor
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(14, 48),
  new THREE.MeshStandardMaterial({color:0x1a1a1c, roughness:0.4, metalness:0.3})
);
floor.rotation.x = -Math.PI/2;
floor.receiveShadow = true;
scene.add(floor);
const ring = new THREE.Mesh(new THREE.RingGeometry(3.6,3.65,64), new THREE.MeshBasicMaterial({color:0xe8a94c, transparent:true, opacity:0.35, side:THREE.DoubleSide}));
ring.rotation.x = -Math.PI/2; ring.position.y = 0.01;
scene.add(ring);

// Lights
scene.add(new THREE.HemisphereLight(0x8899aa, 0x14100c, 0.7));
const spot = new THREE.SpotLight(0xfff4e0, 2.2, 30, Math.PI/6, 0.4, 1.2);
spot.position.set(4, 9, 3); spot.castShadow = true;
scene.add(spot);
const rim = new THREE.DirectionalLight(0x6fa8ff, 0.6);
rim.position.set(-6, 4, -4);
scene.add(rim);

// Simple orbit controls (self-contained, no extra import)
let target = EXT_TARGET.clone();
let sph = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));
let dragging = false, lastX=0, lastY=0;
let userControl = true;
mount.addEventListener('pointerdown', e=>{dragging=true; lastX=e.clientX; lastY=e.clientY;});
window.addEventListener('pointerup', ()=>dragging=false);
window.addEventListener('pointermove', e=>{
  if(!dragging || !userControl) return;
  const dx=(e.clientX-lastX)/200, dy=(e.clientY-lastY)/200;
  lastX=e.clientX; lastY=e.clientY;
  sph.theta -= dx; sph.phi = Math.min(Math.max(sph.phi + dy, 0.25), Math.PI/2 - 0.05);
});
mount.addEventListener('wheel', e=>{
  if(!userControl) return;
  e.preventDefault();
  sph.radius = Math.min(Math.max(sph.radius + e.deltaY*0.003, 1.2), 9);
}, {passive:false});

function syncCameraFromSpherical(){
  const p = new THREE.Vector3().setFromSpherical(sph).add(target);
  camera.position.copy(p);
  camera.lookAt(target);
}

/* ---------------- Car builder (procedural, low-poly) ---------------- */
let carGroup = null;
let hotspots = [];

function buildCar(car){
  if(carGroup) scene.remove(carGroup);
  hotspots.forEach(h=>scene.remove(h));
  hotspots = [];

  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({color:car.body, metalness:0.6, roughness:0.35});
  const glassMat = new THREE.MeshStandardMaterial({color:0x9fd0ff, metalness:0.2, roughness:0.1, transparent:true, opacity:0.55});
  const trimMat = new THREE.MeshStandardMaterial({color:0x0c0c0d, metalness:0.4, roughness:0.5});

  // lower body
  const lower = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.6, 1.9), bodyMat);
  lower.position.y = 0.45; lower.castShadow = true;
  g.add(lower);

  // cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 1.7), bodyMat);
  cabin.position.set(-0.2, 0.95, 0); cabin.castShadow = true;
  g.add(cabin);

  // windshield/glass band
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.32, 1.72), glassMat);
  glass.position.set(-0.2, 1.02, 0);
  g.add(glass);

  // hood + trunk tapers
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 1.75), bodyMat);
  hood.position.set(1.75, 0.78, 0);
  g.add(hood);
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 1.75), bodyMat);
  trunk.position.set(-2.1, 0.78, 0);
  g.add(trunk);

  // bumper trim
  [1.95,-2.25].forEach(x=>{
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 1.85), trimMat);
    b.position.set(x, 0.35, 0);
    g.add(b);
  });

  // wheels
  const wheelGeo = new THREE.CylinderGeometry(0.42,0.42,0.32,20);
  const wheelMat = new THREE.MeshStandardMaterial({color:0x111113, metalness:0.5, roughness:0.6});
  const hubMat = new THREE.MeshStandardMaterial({color:0xcfcfd2, metalness:0.8, roughness:0.3});
  [[1.4,0.95],[1.4,-0.95],[-1.4,0.95],[-1.4,-0.95]].forEach(([x,z])=>{
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI/2; w.position.set(x, 0.42, z); w.castShadow = true;
    g.add(w);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,0.34,14), hubMat);
    hub.rotation.z = Math.PI/2; hub.position.set(x, 0.42, z);
    g.add(hub);
  });

  // headlights (emissive) - hotspot
  [0.95,-0.95].forEach(z=>{
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.16,0.4), new THREE.MeshStandardMaterial({color:0xfff6dc, emissive:0xfff2c8, emissiveIntensity:1.4}));
    hl.position.set(2.18, 0.62, z);
    g.add(hl);
  });

  // accent side stripe
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.6,0.06,0.02), new THREE.MeshStandardMaterial({color:car.accent, emissive:car.accent, emissiveIntensity:0.4}));
  stripe.position.set(0, 0.6, 0.96);
  g.add(stripe);
  const stripe2 = stripe.clone(); stripe2.position.z = -0.96; g.add(stripe2);

  scene.add(g);
  carGroup = g;

  // Hotspots: exterior (front) + interior (cabin)
  addHotspot(new THREE.Vector3(2.2, 0.6, 1.05), 'exterior', 'Front fascia & lighting');
  addHotspot(new THREE.Vector3(-0.2, 1.0, 0.9), 'interior', 'Cabin — tap to step inside');
  addHotspot(new THREE.Vector3(1.4, 0.42, 1.35), 'exterior', 'Wheel & brake package');
}

function addHotspot(pos, kind, label){
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 16, 16),
    new THREE.MeshBasicMaterial({color:0xe8a94c})
  );
  dot.position.copy(pos);
  dot.userData = {kind, label};
  scene.add(dot);
  hotspots.push(dot);
}

/* Pulse hotspots */
function pulseHotspots(t){
  hotspots.forEach((h,i)=>{
    const s = 1 + 0.25*Math.sin(t*0.004 + i);
    h.scale.setScalar(s);
  });
}

/* ---------------- Interaction: click hotspots ---------------- */
const raycaster = new THREE.Raycaster();
const mouseV = new THREE.Vector2();
let insideView = false;

renderer.domElement.addEventListener('click', (e)=>{
  const rect = renderer.domElement.getBoundingClientRect();
  mouseV.x = ((e.clientX-rect.left)/rect.width)*2 - 1;
  mouseV.y = -((e.clientY-rect.top)/rect.height)*2 + 1;
  raycaster.setFromCamera(mouseV, camera);
  const hits = raycaster.intersectObjects(hotspots);
  if(hits.length){
    const kind = hits[0].object.userData.kind;
    if(kind === 'interior') goInside(); else goOutside();
  }
});

function tweenTo(fromPos, toPos, fromTarget, toTarget, dur, onDone){
  userControl = false;
  const start = performance.now();
  function step(now){
    const t = Math.min((now-start)/dur, 1);
    const e = t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; // easeInOutCubic
    camera.position.lerpVectors(fromPos, toPos, e);
    target.lerpVectors(fromTarget, toTarget, e);
    camera.lookAt(target);
    if(t<1) requestAnimationFrame(step);
    else {
      sph.setFromVector3(camera.position.clone().sub(target));
      userControl = true;
      if(onDone) onDone();
    }
  }
  requestAnimationFrame(step);
}

const toggleBtn = document.getElementById('view-toggle');
const panel = document.getElementById('interior-panel');

function goInside(){
  const from = camera.position.clone();
  const fromT = target.clone();
  const to = new THREE.Vector3(-0.1, 1.05, 0.35);
  const toT = new THREE.Vector3(-0.1, 1.0, -0.3);
  tweenTo(from, to, fromT, toT, 1400, ()=>{
    insideView = true;
    toggleBtn.textContent = 'Back to Exterior';
    panel.classList.add('open');
  });
}
function goOutside(){
  const from = camera.position.clone();
  const fromT = target.clone();
  tweenTo(from, EXT_POS.clone(), fromT, EXT_TARGET.clone(), 1200, ()=>{
    insideView = false;
    toggleBtn.textContent = 'Step Inside';
    panel.classList.remove('open');
  });
}
toggleBtn.addEventListener('click', ()=> insideView ? goOutside() : goInside());

/* ---------------- UI: tabs, price strip, interior specs, lineup ---------------- */
const tabsEl = document.getElementById('car-tabs');
const psName = document.getElementById('ps-name');
const psPrice = document.getElementById('ps-price');
const ipTitle = document.getElementById('ip-title');
const ipSub = document.getElementById('ip-sub');
const ipSpecs = document.getElementById('ip-specs');
const lineupEl = document.getElementById('lineup');

let currentCar = CARS[0];

function selectCar(car){
  currentCar = car;
  buildCar(car);
  psName.textContent = car.name;
  psPrice.textContent = car.price;
  ipTitle.textContent = car.name + ' — Interior';
  ipSub.textContent = car.blurb;
  ipSpecs.innerHTML = car.intr.map(([k,v])=>`<div class="spec-row"><span class="k">${k}</span><span>${v}</span></div>`).join('');
  [...tabsEl.children].forEach(b=> b.classList.toggle('active', b.dataset.id===car.id));
  if(insideView) goOutside();
  else { sph.setFromVector3(EXT_POS.clone().sub(EXT_TARGET)); target.copy(EXT_TARGET); syncCameraFromSpherical(); }
}

CARS.forEach(car=>{
  const b = document.createElement('button');
  b.className = 'car-tab'; b.textContent = car.name; b.dataset.id = car.id;
  b.addEventListener('click', ()=> selectCar(car));
  tabsEl.appendChild(b);

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `<div class="tag">${car.tag}</div><h4>${car.name}</h4>
    <div class="price">${car.price}</div><p>${car.blurb}</p>`;
  card.addEventListener('click', ()=>{ selectCar(car); wrap.scrollIntoView({behavior:'smooth'}); });
  lineupEl.appendChild(card);
});

selectCar(CARS[0]);
syncCameraFromSpherical();

/* ---------------- Render loop ---------------- */
function animate(t){
  requestAnimationFrame(animate);
  if(userControl) syncCameraFromSpherical();
  pulseHotspots(t||0);
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', ()=>{
  camera.aspect = mount.clientWidth/mount.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(mount.clientWidth, mount.clientHeight);
});
