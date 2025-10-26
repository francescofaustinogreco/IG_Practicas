import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

let scene, renderer;
let camera, currentCamera;
let controls;
let planets = [];
let gui;
let sun;

init();
animate();

function init() {
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Camera
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 100);
    currentCamera = camera;

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    scene.add(new THREE.AmbientLight(0x444444));
    const sunLight = new THREE.PointLight(0xffffff, 2);
    scene.add(sunLight);

    // Sun
    const sunTex = new THREE.TextureLoader().load('./img/sun.jpg');
    sun = new THREE.Mesh(
        new THREE.SphereGeometry(10, 32, 32),
        new THREE.MeshBasicMaterial({ map: sunTex })
    );
    scene.add(sun);

    // Pianeti
    createPlanetWithOrbit('Mercury', './img/mercury.jpg', 1, 15, 0.02);
    createPlanetWithOrbit('Venus', './img/venus_surface.jpg', 1.5, 20, 0.015);
    createPlanetWithOrbit('Earth', './img/earth_daymap.jpg', 2, 25, 0.01);
    createPlanetWithOrbit('Mars', './img/mars.jpg', 1.2, 30, 0.008);
    createPlanetWithOrbit('Jupiter', './img/jupiter.jpg', 4, 40, 0.005);
    createPlanetWithOrbit('Saturn', './img/saturn.jpg', 3.5, 50, 0.004);
    createPlanetWithOrbit('Uranus', './img/uranus.jpg', 2.5, 60, 0.003);
    createPlanetWithOrbit('Neptune', './img/neptune.jpg', 2.5, 70, 0.003);

    // Sfondo (immagine) invece delle stelle
    const bgTexture = new THREE.TextureLoader().load('./img/stars.jpg');
    const bgMesh = new THREE.Mesh(
        new THREE.SphereGeometry(500, 64, 64),
        new THREE.MeshBasicMaterial({ map: bgTexture, side: THREE.BackSide })
    );
    scene.add(bgMesh);

    // GUI 
    gui = new GUI();
    gui.add({ info: 'Sistema Planetario' }, 'info');

    window.addEventListener('resize', onResize);
}

function createPlanetWithOrbit(name, texturePath, size, radius, speed, extraTexture = null, extraOpacity = 0) {
    const tex = new THREE.TextureLoader().load(texturePath);
    const planet = new THREE.Mesh(
        new THREE.SphereGeometry(size, 32, 32),
        new THREE.MeshPhongMaterial({ map: tex })
    );

    const angle = Math.random() * Math.PI * 2;
    planet.position.set(radius * Math.cos(angle), 0, radius * Math.sin(angle));
    planet.userData = { radius, speed, angle };

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

}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
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
}

function animate() {
    requestAnimationFrame(animate);

    animatePlanets();
    sun.rotation.y += 0.005;

    controls.update();
    renderer.render(scene, currentCamera);
}
