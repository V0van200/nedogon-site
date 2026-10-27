// 3D-глобус «Капитан Недогон». three.js и карта мира лежат в /vendor — никаких внешних CDN.
import * as THREE from '../vendor/three.module.min.js';

const R = 1;
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

function toVec(lat, lon, r = R) {
  const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}

export async function initGlobe(host, trips, { onSelect } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 4.2);

  const globe = new THREE.Group();
  globe.rotation.order = 'XYZ';
  scene.add(globe);

  // тело планеты и мягкое свечение края
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), new THREE.MeshBasicMaterial({ color: css('--lane') || '#1d1f21' })));
  const glow = new THREE.Mesh(new THREE.SphereGeometry(R * 1.12, 64, 48), new THREE.ShaderMaterial({
    transparent: true, side: THREE.BackSide, depthWrite: false,
    uniforms: { c: { value: new THREE.Color(css('--track') || '#ff5b47') } },
    vertexShader: 'varying vec3 n; void main(){ n = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 c; varying vec3 n; void main(){ float i = pow(0.62 - dot(n, vec3(0.,0.,1.)), 3.); gl_FragColor = vec4(c, clamp(i,0.,1.)*0.4); }',
  }));
  scene.add(glow);

  // сетка широт/долгот
  const gridMat = new THREE.LineBasicMaterial({ color: css('--chalk') || '#f4f1ea', transparent: true, opacity: 0.06 });
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = []; for (let lon = -180; lon <= 180; lon += 4) pts.push(toVec(lat, lon, R * 1.001));
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
  }
  for (let lon = -180; lon < 180; lon += 30) {
    const pts = []; for (let lat = -90; lat <= 90; lat += 4) pts.push(toVec(lat, lon, R * 1.001));
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
  }

  // контуры суши
  try {
    const topo = await (await fetch(new URL('../vendor/land-110m.json', import.meta.url))).json();
    const mesh = window.topojson.mesh(topo, topo.objects.land);
    const landMat = new THREE.LineBasicMaterial({ color: css('--chalk') || '#f4f1ea', transparent: true, opacity: 0.55 });
    for (const line of mesh.coordinates) {
      const pts = line.map(([lon, lat]) => toVec(lat, lon, R * 1.002));
      globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), landMat));
    }
  } catch (e) { console.warn('карта не загрузилась', e); }

  // метки путешествий
  const markers = trips.map((t) => {
    const g = new THREE.Group();
    const p = toVec(t.lat, t.lon, R * 1.004);
    g.position.copy(p); g.lookAt(p.clone().multiplyScalar(2));
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.022, 24), new THREE.MeshBasicMaterial({ color: css('--track') || '#ff5b47' }));
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.038, 32), new THREE.MeshBasicMaterial({ color: css('--blush') || '#ffb3c1', transparent: true, opacity: 0.9 }));
    const hit = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), new THREE.MeshBasicMaterial({ visible: false }));
    g.add(dot, ring, hit); g.userData = { trip: t, ring, dot, hit, dir: p.clone().normalize() };
    globe.add(g); return g;
  });

  // вращение
  let target = { x: 0.35, y: 0 }, cur = { x: 0.35, y: 0 }, dragging = false, last = null, idle = 0, active = null;
  const el = renderer.domElement;
  el.style.touchAction = 'pan-y';
  el.addEventListener('pointerdown', (e) => { dragging = true; last = { x: e.clientX, y: e.clientY, t: e.pointerType }; el.setPointerCapture(e.pointerId); idle = 0; });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - last.x, dy = e.clientY - last.y; last.x = e.clientX; last.y = e.clientY;
    target.y += dx * 0.006; target.x = Math.max(-1.1, Math.min(1.1, target.x + dy * 0.006));
  });
  el.addEventListener('pointerup', (e) => { dragging = false; idle = 0; pick(e); });

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(e) {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(markers.map((m) => m.userData.hit));
    if (hits.length) { const t = hits[0].object.parent.userData.trip; focus(t.id); onSelect && onSelect(t.id); }
  }

  function focus(id) {
    const m = markers.find((x) => x.userData.trip.id === id); if (!m) return;
    active = id; idle = 0;
    const d = m.userData.dir;
    const yaw = Math.atan2(d.x, d.z);
    let ty = -yaw; while (ty - target.y > Math.PI) ty -= 2 * Math.PI; while (target.y - ty > Math.PI) ty += 2 * Math.PI;
    target.y = ty; target.x = Math.atan2(d.y, Math.hypot(d.x, d.z));
  }

  function size() {
    const w = host.clientWidth, h = host.clientHeight || w;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(size).observe(host); size();

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);
  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05); idle += dt;
    if (!dragging && !reduce && idle > 4) target.y += dt * 0.12;
    cur.x += (target.x - cur.x) * Math.min(1, dt * 5); cur.y += (target.y - cur.y) * Math.min(1, dt * 5);
    globe.rotation.x = cur.x; globe.rotation.y = cur.y;
    const t = clock.elapsedTime;
    for (const m of markers) {
      const on = m.userData.trip.id === active;
      const k = reduce ? 1 : 1 + ((t * 0.9 + m.userData.trip.lat) % 1.6) * 0.9;
      m.userData.ring.scale.setScalar(on ? 1.6 : k);
      m.userData.ring.material.opacity = on ? 1 : Math.max(0, 1.15 - (k - 1));
      m.userData.dot.scale.setScalar(on ? 1.7 : 1);
    }
    renderer.render(scene, camera);
  })();
  return { focus };
}
