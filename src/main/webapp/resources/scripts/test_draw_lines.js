import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js'; // Reverted to Trackball
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ViewportGizmo } from "three-viewport-gizmo";
import { Line2 } from 'three/addons/lines/Line2.js';

// Global variables
var camera, scene, renderer, controls, gizmo, loader;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var gridHelper;
var meshes = []; 

// Application settings
var frustumSize = 10;
var compHeight = 250;
var weldingpointing = true; 
var clicks = 0;
var points = [];

init();
animate();

function init() {
    // 1. Setup Scene & Visuals
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe8e8e8); 
    scene.fog = new THREE.Fog(0xe8e8e8, 20, 100);

    // 2. Setup Camera
    const aspect = window.innerWidth / (window.innerHeight - compHeight);
    camera = new THREE.OrthographicCamera(
        (-frustumSize * aspect) / 2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.1,
        10000
    );
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    // 3. Setup Renderer
    var container = document.getElementById('viewport');
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false
    });
    
    const maxSSAA = 2.0;
    const SSAA = Math.min(window.devicePixelRatio * 1.5, maxSSAA);
    renderer.setPixelRatio(SSAA);
    renderer.setSize(window.innerWidth, window.innerHeight - compHeight);
    
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    if ('outputColorSpace' in renderer) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else {
        renderer.outputEncoding = THREE.sRGBEncoding;
    }
    
    container.appendChild(renderer.domElement);

    // 4. Setup Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-10, -10, -10);
    scene.add(backLight);

    // 5. Setup Grid
    gridHelper = new THREE.GridHelper(50, 50, 0x888888, 0xbbbbbb);
    scene.add(gridHelper);

    // 6. Setup Controls (Reverted to Trackball)
    controls = new TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 3.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 1.0;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.15;
    controls.target.set(0, 0, 0);

    // 7. Setup Gizmo
    gizmo = new ViewportGizmo(camera, renderer, {
        "placement": "top-right",
        "size": 100,
        "animated": true,
        "speed": 1
    });
    gizmo.attachControls(controls);

    // 8. Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    renderer.domElement.addEventListener('pointerdown', onPointerDown, false);

    // Initial Test Object
    loader = new GLTFLoader();
    addTestCube();
}

function onPointerDown(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // 1. Raycast to find what is under the mouse
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    const validIntersects = intersects.filter(hit => {
        return hit.object.type === 'Mesh' && hit.object !== gridHelper && hit.object !== gizmo;
    });

    const hit = validIntersects.length > 0;
    const hitPoint = hit ? validIntersects[0].point : null;

    // =========================================================
    // WELDING / DRAWING LOGIC
    // =========================================================
    // If welding mode is ON and we hit a mesh, we draw a tube.
    // We do NOT change the pivot here because we are drawing.
    if (weldingpointing && hit && event.button === 0) {
        clicks++;

        // Visual feedback marker
        const markerGeo = new THREE.SphereGeometry(0.05, 16, 16);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.copy(hitPoint);
        scene.add(marker);

        if (clicks === 1) {
            points[0] = hitPoint.clone();
        } else if (clicks === 2) {
            points[1] = hitPoint.clone();
            clicks = 0;
            createTube(points[0], points[1]);
            points = [];
        }
        return; // Exit so we don't mess with controls while drawing
    }

    // =========================================================
    // PIVOT CORRECTION LOGIC
    // =========================================================
    // If we are NOT drawing (or weldingpointing is false), 
    // and we click (Left Click = Rotate in Trackball) on a mesh:
    // Update the target to the point we clicked.
    // This fixes the "rotating around scene center" issue when panned.
    if (event.button === 0 && hit) {
        controls.target.copy(hitPoint);
        // Note: TrackballControls doesn't need an explicit update() call here
        // as it updates every frame in animate(), but setting target is enough.
    }
}

function createTube(p1, p2) {
    const path = new THREE.LineCurve3(p1, p2);
    const geometry = new THREE.TubeGeometry(path, 1, 0.05, 8, false);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, metalness: 0.5, roughness: 0.1 });
    const tube = new THREE.Mesh(geometry, material);
    scene.add(tube);
}

function addTestCube() {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x55aaff, 
        metalness: 0.2, 
        roughness: 0.5 
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 1; 
    meshes.push(mesh);
    scene.add(mesh);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Essential for TrackballControls
    renderer.render(scene, camera);
    gizmo.render();
}

function onWindowResize() {
    const aspect = window.innerWidth / (window.innerHeight - compHeight);

    camera.left   = (-frustumSize * aspect) / 2;
    camera.right  = ( frustumSize * aspect) / 2;
    camera.top    = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.updateProjectionMatrix();

    const maxSSAA = 2.0;
    const SSAA = Math.min(window.devicePixelRatio * 1.5, maxSSAA);
    renderer.setPixelRatio(SSAA);
    renderer.setSize(window.innerWidth, window.innerHeight - compHeight);

    controls.handleResize(); // Essential for TrackballControls
    gizmo.update();
}

function loadGLB(url) {
    clearAllMeshes(scene);

    loader.load(url, (gltf) => {
        scene.add(gltf.scene);

        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 5; 
        const scale = targetSize / maxDim;

        gltf.scene.scale.set(scale, scale, scale);
        gltf.scene.position.sub(center.multiplyScalar(scale));
        
        const box2 = new THREE.Box3().setFromObject(gltf.scene);
        const yOffset = -box2.min.y;
        gltf.scene.position.y += yOffset;

        // Reset Pivot to model center (0,0,0) on load
        controls.target.set(0, 0, 0);
        
        camera.zoom = 1;
        camera.updateProjectionMatrix();

    }, undefined, (err) => console.error(err));
}

function clearAllMeshes(scene) {
    const toRemove = [];
    scene.traverse((obj) => {
        if (obj.isCamera || obj.isLight || obj === gridHelper || obj === gizmo) return;
        const isRenderable = obj.isMesh || obj.isLine || obj.isLineSegments || obj.isPoints || (obj instanceof Line2);
        if (isRenderable) {
            if (obj.geometry) obj.geometry.dispose?.();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach((m) => m.dispose?.());
                } else {
                    obj.material.dispose?.();
                }
            }
            toRemove.push(obj);
        }
    });
    toRemove.forEach((obj) => obj.parent?.remove(obj));
    meshes = [];
}

window.loadGLB = loadGLB;
window.clearAllMeshes = clearAllMeshes;