import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ViewportGizmo } from "three-viewport-gizmo";

import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

var camera, scene, renderer, controls, gizmo, loader;
var meshes = [];
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var frustumSize = 3.5;
var compHeight = 250;
var points = [];
let line;
var clicks = 0;
var weldingpointing = false; // your logic toggles this

// New pivot state variables
let pendingPivot = null;
let rotateStarted = false;

init();
animate();

function init() {

    loader = new GLTFLoader();

    const aspect = window.innerWidth / (window.innerHeight - compHeight);

    camera = new THREE.OrthographicCamera(
        (-frustumSize * aspect) / 2,
        ( frustumSize * aspect) / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.1,
        1000
    );

    camera.position.set(1, 1, 1);
    camera.lookAt(0, 0, 0);

    scene = new THREE.Scene();

    // Test cube
    var geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    var material = new THREE.MeshNormalMaterial();
    var mesh = new THREE.Mesh(geometry, material);
    meshes.push(mesh);
    scene.add(mesh);

    // Lights
    const light1 = new THREE.DirectionalLight(0xffffff, 0.2);
    light1.position.set(5, 5, 5);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.2);
    light2.position.set(-5, -5, -5);
    scene.add(light2);

    const light3 = new THREE.DirectionalLight(0xffffff, 0.5);
    light3.position.set(-5, 5, -5);
    scene.add(light3);

    const light4 = new THREE.DirectionalLight(0xffffff, 0.2);
    light4.position.set(5, -5, 5);
    scene.add(light4);

    const ambient = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambient);

    var container = document.getElementById('viewport');

    // WebGL renderer with supersampling (SSAA)
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
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

    // TrackballControls
    controls = new TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 3.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.15;
    controls.target.set(0, 0, 0);
    controls.handleResize();

    // Gizmo
    gizmo = new ViewportGizmo(camera, renderer, {
        type: "sphere",
        size: 100,
        placement: "top-right",
        resolution: 64,
        lineWidth: 6.336,
        radius: 1,
        smoothness: 18,
        animated: true,
        speed: 1,
        background: { enabled: true, color: 16777215, opacity: 0 }
    });

    gizmo.attachControls(controls);

    // ============================================================
    // NON-TELEPORTING SURFACE-LOCKED PIVOT
    // ============================================================

    // 1. RECORD pivot but do NOT apply it on pointerdown
    renderer.domElement.addEventListener('pointerdown', function (event) {
        if (event.button !== 0 || weldingpointing) return;

        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        mouse.set(x, y);
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(scene.children, true);

        pendingPivot = (intersects.length > 0)
            ? intersects[0].point.clone()
            : null;

        rotateStarted = false;
    }, false);


    // 2. APPLY pivot only *after rotation actually begins*
    renderer.domElement.addEventListener('pointermove', function () {

        // TrackballControls internal state:
        // _state === 1 → ROTATE mode
        if (controls._state === 1) {

            if (!rotateStarted && pendingPivot) {
                controls.target.copy(pendingPivot);
                controls.update();

                rotateStarted = true;
                pendingPivot = null;
            }

        }
    }, false);

    // ============================================================

    // Resize and welding handlers
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousedown', onMouseDown, false);
}

function onMouseDown(event) {
    if (weldingpointing) {
        const canvasBounds = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - canvasBounds.left) / (canvasBounds.width)) * 2 - 1;
        mouse.y = -((event.clientY - canvasBounds.top) / (canvasBounds.height)) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        var intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            clicks++;

            if (clicks === 1) {
                points[0] = intersects[0].point.clone();
            }

            if (clicks === 2) {
                points[1] = intersects[0].point.clone();
                clicks = 0;

                const path = new THREE.LineCurve3(points[0], points[1]);
                const geometry = new THREE.TubeGeometry(path, 1, 0.05, 8, false);
                const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
                const tube = new THREE.Mesh(geometry, material);
                scene.add(tube);

                points = [];
                renderer.render(scene, camera);
            }

        } else {
            console.log("clicked outside mesh");
        }
    }
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

    controls.handleResize();
    gizmo.update();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    gizmo.render();
}

function loadGLB(url) {
    clearAllMeshes(scene);

    loader.load(
        url,
        (gltf) => {
            scene.add(gltf.scene);

            // Center & scale model
            var box = new THREE.Box3().setFromObject(gltf.scene);
            var center = box.getCenter(new THREE.Vector3());
            var size = box.getSize(new THREE.Vector3());
            var maxDim = Math.max(size.x, size.y, size.z);
            var scale = 2.0 / maxDim;

            gltf.scene.scale.set(scale, scale, scale);
            gltf.scene.position.sub(center.multiplyScalar(scale));

            // Initial pivot = model center
            box.setFromObject(gltf.scene);
            center = box.getCenter(new THREE.Vector3());
            controls.target.copy(center);
            controls.update();
        },
        (xhr) => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
        (err) => console.error('Error loading GLB:', err)
    );
}

function clearAllMeshes(scene) {
    const toRemove = [];
    scene.traverse((obj) => {
        if (obj.isCamera || obj.isLight) return;

        const isRenderable =
            obj.isMesh ||
            obj.isLine ||
            obj.isLineSegments ||
            obj.isPoints ||
            (obj instanceof Line2);

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
}

window.loadGLB = loadGLB;
window.clearAllMeshes = clearAllMeshes;
