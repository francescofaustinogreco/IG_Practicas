import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

let scene, renderer;
let camera, shipCamera, currentCamera;
let controls;
let planets = [];
let gui;
let sun;
let shipVelocity = new THREE.Vector3();
let keys = {};
let options = { viewMode: 'Orbital view' };

// 🌙 --- variabile per la Luna ---
let moon, earthPlanet;

init();
animate();

function init() {
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Camera orbitale
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 100);
    currentCamera = camera;

    // Camera nave
    shipCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    shipCamera.position.set(0, 5, 30);

    // Controls orbitali
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Luci
    scene.add(new THREE.AmbientLight(0x444444));
    const sunLight = new THREE.PointLight(0xffffff, 2);
    scene.add(sunLight);

    // Sole
    const sunTex = new THREE.TextureLoader().load('./img/sun.jpg');
    sun = new THREE.Mesh(
        new THREE.SphereGeometry(10, 32, 32),
        new THREE.MeshBasicMaterial({ map: sunTex })
    );
    scene.add(sun);

    // Pianeti
    createPlanetWithOrbit('Mercury', './img/mercury.jpg', 1, 15, 0.02);
    createPlanetWithOrbit('Venus', './img/venus_surface.jpg', 1.5, 20, 0.015);
    earthPlanet = createPlanetWithOrbit('Earth', './img/earth_daymap.jpg', 2, 25, 0.01); // 🌍 salviamo la Terra
    createPlanetWithOrbit('Mars', './img/mars.jpg', 1.2, 30, 0.008);
    createPlanetWithOrbit('Jupiter', './img/jupiter.jpg', 4, 40, 0.005);
    createPlanetWithOrbit('Saturn', './img/saturn.jpg', 3.5, 50, 0.004);
    createPlanetWithOrbit('Uranus', './img/uranus.jpg', 2.5, 60, 0.003);
    createPlanetWithOrbit('Neptune', './img/neptune.jpg', 2.5, 70, 0.003);

    // 🌙 --- Luna (attorno alla Terra) ---
    const moonTex = new THREE.TextureLoader().load('./img/moon.jpg');
    moon = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.MeshPhongMaterial({ map: moonTex })
    );
    moon.userData = { distance: 4, angle: 0, speed: 0.03 };
    scene.add(moon);

    // Sfondo
    const bgTexture = new THREE.TextureLoader().load('./img/stars.jpg');
    const bgMesh = new THREE.Mesh(
        new THREE.SphereGeometry(500, 64, 64),
        new THREE.MeshBasicMaterial({ map: bgTexture, side: THREE.BackSide })
    );
    scene.add(bgMesh);

    // GUI
    gui = new GUI();
    gui.add(options, 'viewMode', ['Orbital view', 'Ship view'])
       .name('Vista')
       .onChange(updateCameraView);

    // Eventi
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
}

function createPlanetWithOrbit(name, texturePath, size, radius, speed) {
    const tex = new THREE.TextureLoader().load(texturePath);
    const planet = new THREE.Mesh(
        new THREE.SphereGeometry(size, 32, 32),
        new THREE.MeshPhongMaterial({ map: tex })
    );
    const angle = Math.random() * Math.PI * 2;
    planet.position.set(radius * Math.cos(angle), 0, radius * Math.sin(angle));
    planet.userData = { name, radius, speed, angle };
    scene.add(planet);
    planets.push(planet);

    // Orbita
    const points = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta)));
    }
    const orbit = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    scene.add(orbit);

    return planet;
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    shipCamera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    shipCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animatePlanets() {
    planets.forEach(p => {
        p.userData.angle += p.userData.speed;
        p.position.set(
            p.userData.radius * Math.cos(p.userData.angle),
            0,
            p.userData.radius * Math.sin(p.userData.angle)
        );
        p.rotation.y += 0.01;
    });

    // 🌙 --- Animazione Luna ---
    if (moon && earthPlanet) {
        moon.userData.angle += moon.userData.speed;
        const d = moon.userData.distance;
        moon.position.set(
            earthPlanet.position.x + Math.cos(moon.userData.angle) * d,
            earthPlanet.position.y,
            earthPlanet.position.z + Math.sin(moon.userData.angle) * d
        );
    }
}

// Movimento nave
function updateShipControls() {
    const speed = 0.5;
    const rotationSpeed = 0.02;

    if (keys['arrowleft']) shipCamera.rotation.y += rotationSpeed;
    if (keys['arrowright']) shipCamera.rotation.y -= rotationSpeed;
    if (keys['arrowup']) shipCamera.rotation.x += rotationSpeed;
    if (keys['arrowdown']) shipCamera.rotation.x -= rotationSpeed;

    const direction = new THREE.Vector3();
    shipCamera.getWorldDirection(direction);

    if (keys['w']) shipCamera.position.addScaledVector(direction, speed);
    if (keys['s']) shipCamera.position.addScaledVector(direction, -speed);

    const right = new THREE.Vector3();
    right.crossVectors(shipCamera.up, direction).normalize();
    if (keys['a']) shipCamera.position.addScaledVector(right, speed);
    if (keys['d']) shipCamera.position.addScaledVector(right, -speed);

    if (keys['q']) shipCamera.position.y += speed;
    if (keys['e']) shipCamera.position.y -= speed;
}

function updateCameraView() {
    if (options.viewMode === 'Ship view') {
        currentCamera = shipCamera;
        controls.enabled = false;
    } else {
        currentCamera = camera;
        controls.enabled = true;
    }
}

function animate() {
    requestAnimationFrame(animate);

    animatePlanets();
    sun.rotation.y += 0.005;

    if (options.viewMode === 'Ship view') {
        updateShipControls();
    }

    controls.update();
    renderer.render(scene, currentCamera);
}
