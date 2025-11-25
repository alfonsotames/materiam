// <![CDATA[
import * as THREE from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

// -------------------------------------------------------------
// Coin3D Controls (Orthographic + Snap Views)
// -------------------------------------------------------------
class Coin3DControls {
    constructor(camera, domElement, target) {
        this.camera = camera;
        this.domElement = domElement;
        this.target = target || new THREE.Vector3(0, 0, 0);

        // Settings
        this.rotateSpeed = 2.5; 
        this.panSpeed = 1.0;
        this.zoomSpeed = 1.05;
        this.enableDamping = false; 

        // Internal State
        this.state = -1; 
        this.isDragging = false;
        this._lastMouse = new THREE.Vector2();

        // Bind Events
        this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.domElement.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        this.domElement.addEventListener('contextmenu', function(e) { e.preventDefault(); });
    }

    // --- SNAP VIEW LOGIC ---
    snap(viewName) {
        const dist = 50; // Distance to place camera (to avoid clipping)
        const t = this.target;

        // 1. Reset Camera Up vector (Standard Y-up)
        this.camera.up.set(0, 1, 0);

        // 2. Position Camera based on View
        switch(viewName) {
            case 'front': 
                this.camera.position.set(t.x, t.y, t.z + dist); 
                break;
            case 'back':
                this.camera.position.set(t.x, t.y, t.z - dist);
                break;
            case 'right':
                this.camera.position.set(t.x + dist, t.y, t.z);
                break;
            case 'left':
                this.camera.position.set(t.x - dist, t.y, t.z);
                break;
            case 'top':
                // For Top view, looking down Y, the "Up" on screen is usually -Z
                this.camera.position.set(t.x, t.y + dist, t.z);
                this.camera.up.set(0, 0, -1); 
                break;
            case 'bottom':
                this.camera.position.set(t.x, t.y - dist, t.z);
                this.camera.up.set(0, 0, 1);
                break;
            case 'iso':
                this.camera.position.set(t.x + dist, t.y + dist, t.z + dist);
                break;
        }

        // 3. Look at target and update
        this.camera.lookAt(t);
        this.camera.updateProjectionMatrix();
    }

    getNormalizedMouse(clientX, clientY) {
        const rect = this.domElement.getBoundingClientRect();
        return new THREE.Vector2(
            ((clientX - rect.left) / rect.width) * 2 - 1,
            -((clientY - rect.top) / rect.height) * 2 + 1
        );
    }

    onMouseDown(event) {
        event.preventDefault();
        this.isDragging = true;
        this._lastMouse = this.getNormalizedMouse(event.clientX, event.clientY);

        if (event.button === 0) {
            this.state = 0; // ROTATE
        } else if (event.button === 1 || event.button === 2) {
            this.state = 1; // PAN
        }
    }

    onMouseMove(event) {
        if (!this.isDragging) return;
        event.preventDefault();

        const currMouse = this.getNormalizedMouse(event.clientX, event.clientY);

        if (this.state === 0) { // ROTATE
            const deltaX = currMouse.x - this._lastMouse.x;
            const deltaY = currMouse.y - this._lastMouse.y;
            const angle = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (angle > 0.0001) {
                const axisScreen = new THREE.Vector3(-deltaY, deltaX, 0).normalize();
                const axisWorld = axisScreen.applyQuaternion(this.camera.quaternion);
                this.rotateCamera(axisWorld, -angle * this.rotateSpeed);
            }
            this._lastMouse.copy(currMouse);

        } else if (this.state === 1) { // PAN
            const deltaX = currMouse.x - this._lastMouse.x;
            const deltaY = currMouse.y - this._lastMouse.y;
            this.panCamera(deltaX, deltaY);
            this._lastMouse.copy(currMouse);
        }
    }

    onMouseUp(event) {
        this.isDragging = false;
        this.state = -1;
    }

    onWheel(event) {
        event.preventDefault();
        if (event.deltaY > 0) {
            this.zoomCamera(1 / this.zoomSpeed); 
        } else {
            this.zoomCamera(this.zoomSpeed);
        }
    }

    rotateCamera(axis, angle) {
        const q = new THREE.Quaternion();
        q.setFromAxisAngle(axis, angle);
        const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
        offset.applyQuaternion(q);
        this.camera.quaternion.premultiply(q);
        this.camera.position.addVectors(this.target, offset);
    }

    panCamera(deltaX, deltaY) {
        const frustumHeight = (this.camera.top - this.camera.bottom) / this.camera.zoom;
        const frustumWidth = (this.camera.right - this.camera.left) / this.camera.zoom;
        const moveX = -deltaX * frustumWidth * 0.5;
        const moveY = -deltaY * frustumHeight * 0.5;
        const vRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const vUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
        const panVector = new THREE.Vector3();
        panVector.addScaledVector(vRight, moveX);
        panVector.addScaledVector(vUp, moveY);
        this.camera.position.add(panVector);
    }

    zoomCamera(scale) {
        let newZoom = this.camera.zoom * scale;
        if (newZoom < 0.1) newZoom = 0.1;
        if (newZoom > 20) newZoom = 20;

        const effectiveScale = newZoom / this.camera.zoom;
        if (Math.abs(effectiveScale - 1) < 0.0001) return; 

        // Center-Pivot Zoom Logic
        const P = this.camera.position.clone();
        const T = this.target.clone();
        const TC = new THREE.Vector3().subVectors(P, T); 
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        
        const depthDist = TC.dot(dir);
        const depthVec = dir.clone().multiplyScalar(depthDist);
        const planeVec = TC.clone().sub(depthVec);
        
        planeVec.divideScalar(effectiveScale);
        
        this.camera.position.copy(T).add(depthVec).add(planeVec);
        this.camera.zoom = newZoom;
        this.camera.updateProjectionMatrix();
    }
}

// -------------------------------------------------------------
// Main Application
// -------------------------------------------------------------

let camera, scene, renderer, loader;
let objectContainer;
let controls; 
let pivotHelper;

const frustumSize = 20;

init();
animate();

function init() {
    
    loader = new GLTFLoader();
    
    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);

    // 2. Orthographic Camera
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera( 
        frustumSize * aspect / -2, 
        frustumSize * aspect / 2, 
        frustumSize / 2, 
        frustumSize / -2, 
        0.1, 
        1000 
    );
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const container = document.getElementById('viewport');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // 5. Object Container
    objectContainer = new THREE.Group();
    scene.add(objectContainer);

    // 6. Test Object
    const geometry = new THREE.BoxGeometry(4, 4, 4);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00, 
        roughness: 0.5, 
        metalness: 0.1 
    });
    const mesh = new THREE.Mesh(geometry, material);
    objectContainer.add(mesh);
    
    // Add Axis helper to see orientation clearly
    const axesHelper = new THREE.AxesHelper( 5 );
    objectContainer.add( axesHelper );

    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
    mesh.add(line);

    // 7. Pivot Helper
    const phGeo = new THREE.SphereGeometry(0.2);
    const phMat = new THREE.MeshBasicMaterial({ color: 0xff0000, depthTest: false });
    pivotHelper = new THREE.Mesh(phGeo, phMat);
    pivotHelper.renderOrder = 999;
    scene.add(pivotHelper);

    // 8. Grid
    const gridHelper = new THREE.GridHelper(40, 40);
    scene.add(gridHelper);

    // 9. Resize
    window.addEventListener('resize', onWindowResize);

    // 10. Init Controls
    controls = new Coin3DControls(camera, renderer.domElement, new THREE.Vector3(0, 0, 0));

    // 11. Create Snap View Buttons UI
    createUI();
}

function createUI() {
    // Container
    const ui = document.createElement('div');
    ui.style.position = 'absolute';
    ui.style.top = '10px';
    ui.style.right = '10px';
    ui.style.display = 'flex';
    ui.style.flexDirection = 'column';
    ui.style.gap = '5px';
    document.body.appendChild(ui);

    const views = ['Top', 'Bottom', 'Front', 'Back', 'Left', 'Right', 'Iso'];

    views.forEach(view => {
        const btn = document.createElement('button');
        btn.innerText = view;
        btn.style.padding = '8px 12px';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = 'bold';
        btn.onclick = () => controls.snap(view.toLowerCase());
        ui.appendChild(btn);
    });
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (pivotHelper && controls) {
        pivotHelper.position.copy(controls.target);
    }
    renderer.render(scene, camera);
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



// ]]>