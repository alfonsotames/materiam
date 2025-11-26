import * as THREE from 'three';
import { Coin3DControls } from './Coin3DControls.js';
import { loadGLB, clearAllMeshes } from './utils.js';

// Global variables (needed for animation loop)
let camera, scene, renderer, controls;
const frustumSize = 20;

// List of objects we never want to delete when loading a new model
let persistentObjects = []; 

init();
animate();

function init() {
    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);

    // 2. Camera (Start with Orthographic)
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera( 
        frustumSize * aspect / -2, frustumSize * aspect / 2, 
        frustumSize / 2, frustumSize / -2, 
        0.1, 1000 
    );
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const container = document.getElementById('viewport');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 3.0);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // 5. Object Container
    const objectContainer = new THREE.Group();
    scene.add(objectContainer);

    // 6. Initial Test Object
    const geometry = new THREE.BoxGeometry(4, 4, 4);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00, roughness: 0.5, metalness: 0.1 
    });
    const mesh = new THREE.Mesh(geometry, material);
    objectContainer.add(mesh);
    
    // 7. Helpers
    const axesHelper = new THREE.AxesHelper(5);
    objectContainer.add(axesHelper);
    
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
    mesh.add(line);

    const gridHelper = new THREE.GridHelper(40, 40);
    scene.add(gridHelper);

    // Track objects we shouldn't delete
    persistentObjects = [axesHelper, gridHelper, ambientLight, dirLight, objectContainer];

    // 8. Controls
    controls = new Coin3DControls(camera, renderer.domElement, new THREE.Vector3(0, 0, 0));

    // 9. Event Listeners
    window.addEventListener('resize', onWindowResize);
    createUI();

    // Expose load function to global scope so you can call it from console or other scripts
    // Note: We wrap it to pass our local dependencies
    window.loadModel = (url) => loadGLB(url, scene, controls, persistentObjects);
}

function createUI() {
    const ui = document.createElement('div');
    ui.style.position = 'absolute';
    ui.style.top = '10px';
    ui.style.right = '10px';
    ui.style.display = 'flex';
    ui.style.flexDirection = 'column';
    ui.style.gap = '5px';
    document.body.appendChild(ui);

    // Projection Toggles
    const projDiv = document.createElement('div');
    projDiv.style.display = 'flex';
    projDiv.style.gap = '5px';
    projDiv.style.marginBottom = '10px';
    ui.appendChild(projDiv);

    const btnOrtho = document.createElement('button');
    btnOrtho.innerText = "Ortho";
    btnOrtho.onclick = () => toggleProjection('ortho');
    projDiv.appendChild(btnOrtho);

    const btnPersp = document.createElement('button');
    btnPersp.innerText = "Persp";
    btnPersp.onclick = () => toggleProjection('persp');
    projDiv.appendChild(btnPersp);

    // Snap Views
    const views = ['Top', 'Bottom', 'Front', 'Back', 'Left', 'Right', 'Iso'];
    views.forEach(view => {
        const btn = document.createElement('button');
        btn.innerText = view;
        btn.onclick = () => controls.snap(view.toLowerCase());
        ui.appendChild(btn);
    });
}

function toggleProjection(mode) {
    const isOrtho = camera.isOrthographicCamera;
    if (mode === 'ortho' && isOrtho) return;
    if (mode === 'persp' && !isOrtho) return;

    let newCam;

    if (mode === 'persp') {
        newCam = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        newCam.position.copy(camera.position);
        newCam.quaternion.copy(camera.quaternion);
        newCam.up.copy(camera.up);

        // Match Distance
        const orthoHeight = (camera.top - camera.bottom) / camera.zoom;
        const halfFovRad = (newCam.fov / 2) * (Math.PI / 180);
        const newDist = (orthoHeight / 2) / Math.tan(halfFovRad);

        const offset = new THREE.Vector3().subVectors(newCam.position, controls.target);
        offset.setLength(newDist);
        newCam.position.addVectors(controls.target, offset);
    } else {
        const aspect = window.innerWidth / window.innerHeight;
        newCam = new THREE.OrthographicCamera( 
            frustumSize * aspect / -2, frustumSize * aspect / 2, 
            frustumSize / 2, frustumSize / -2, 
            0.1, 1000 
        );
        newCam.position.copy(camera.position);
        newCam.quaternion.copy(camera.quaternion);
        newCam.up.copy(camera.up);

        // Match Zoom
        const dist = new THREE.Vector3().subVectors(camera.position, controls.target).length();
        const halfFovRad = (camera.fov / 2) * (Math.PI / 180);
        const perspHeight = 2 * dist * Math.tan(halfFovRad);
        newCam.zoom = frustumSize / perspHeight;
    }

    camera = newCam;
    controls.camera = newCam;
    camera.updateProjectionMatrix();
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    if (camera.isOrthographicCamera) {
        camera.left = -frustumSize * aspect / 2;
        camera.right = frustumSize * aspect / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
    } else {
        camera.aspect = aspect;
    }
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}