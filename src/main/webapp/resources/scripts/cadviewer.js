// <![CDATA[
// 1. IMPORTS
import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'https://unpkg.com/three@0.180.0/examples/jsm/environments/RoomEnvironment.js';
import { Line2 } from 'https://unpkg.com/three@0.180.0/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'https://unpkg.com/three@0.180.0/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'https://unpkg.com/three@0.180.0/examples/jsm/lines/LineMaterial.js';

// IMPORT BVH
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'https://unpkg.com/three-mesh-bvh@0.6.8/build/index.module.js';

// 2. APPLY BVH PATCHES
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// -------------------------------------------------------------
// Coin3D Controls (Direct Control - No Damping)
// -------------------------------------------------------------
class Coin3DControls {
    constructor(camera, domElement, objectGroup) {
        this.camera = camera;
        this.domElement = domElement;
        this.objectGroup = objectGroup;
        this.target = new THREE.Vector3(0, 0, 0);

        this.rotateSpeed = 2.5; 
        this.panSpeed = 1.0;
        this.zoomSpeed = 1.10; 

        this.state = -1; 
        this.isDragging = false;
        this.pivotingOnObject = false;

        this._lastMouse = new THREE.Vector2();
        this._raycaster = new THREE.Raycaster();
        this._raycaster.firstHitOnly = true; 

        this._plane = new THREE.Plane();
        this._planeNormal = new THREE.Vector3();
        this._intersectPoint = new THREE.Vector3();

        this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.domElement.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    snap(viewName) {
        const t = this.target;
        let dist;
        if (this.camera.isPerspectiveCamera) {
            dist = this.camera.position.distanceTo(t);
        } else {
            dist = (this.camera.far - this.camera.near) / 2;
            if (dist < 10) dist = 50; 
        }

        this.camera.up.set(0, 1, 0);

        switch(viewName) {
            case 'front': this.camera.position.set(t.x, t.y, t.z + dist); break;
            case 'back':  this.camera.position.set(t.x, t.y, t.z - dist); break;
            case 'right': this.camera.position.set(t.x + dist, t.y, t.z); break;
            case 'left':  this.camera.position.set(t.x - dist, t.y, t.z); break;
            case 'top':   this.camera.position.set(t.x, t.y + dist, t.z); this.camera.up.set(0, 0, -1); break;
            case 'bottom':this.camera.position.set(t.x, t.y - dist, t.z); this.camera.up.set(0, 0, 1); break;
            case 'iso':   
                const isoVec = new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(dist);
                this.camera.position.copy(t).add(isoVec);
                break;
        }
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
            this._raycaster.setFromCamera(this._lastMouse, this.camera);
            const intersects = this._raycaster.intersectObject(this.objectGroup, true);
            const hit = intersects.find(res => res.object.isMesh && res.object.visible);

            if (hit) {
                this.target.copy(hit.point);
                this.pivotingOnObject = true;
            } else {
                this.target.set(0, 0, 0);
                this.pivotingOnObject = false;
            }
        } else if (event.button === 1 || event.button === 2) {
            this.state = 1; // PAN
            this.pivotingOnObject = false;
        }
    }

    onMouseMove(event) {
        if (!this.isDragging) return;
        event.preventDefault();
        const currMouse = this.getNormalizedMouse(event.clientX, event.clientY);

        if (this.state === 0) { 
            const deltaX = currMouse.x - this._lastMouse.x;
            const deltaY = currMouse.y - this._lastMouse.y;
            const angle = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (angle > 0.0001) {
                const axisScreen = new THREE.Vector3(-deltaY, deltaX, 0).normalize();
                const axisWorld = axisScreen.applyQuaternion(this.camera.quaternion);
                this.rotateCamera(axisWorld, -angle * this.rotateSpeed);
            }
            this._lastMouse.copy(currMouse);
        } else if (this.state === 1) { 
            const deltaX = currMouse.x - this._lastMouse.x;
            const deltaY = currMouse.y - this._lastMouse.y;
            this.panCamera(deltaX, deltaY);
            this._lastMouse.copy(currMouse);
        }
    }

    onMouseUp() { 
        this.isDragging = false; 
        this.state = -1; 
        this.pivotingOnObject = false;
    }

    onWheel(event) {
        event.preventDefault();
        const scale = event.deltaY > 0 ? (1 / this.zoomSpeed) : this.zoomSpeed;
        this.zoomCamera(scale, event.clientX, event.clientY);
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
        let moveX, moveY;
        if (this.camera.isPerspectiveCamera) {
            const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
            const dist = offset.length();
            const targetHeight = 2.0 * Math.tan((this.camera.fov * Math.PI) / 360) * dist;
            moveX = -deltaX * (targetHeight * this.camera.aspect) * 0.5;
            moveY = -deltaY * targetHeight * 0.5;
        } else {
            const frustumHeight = (this.camera.top - this.camera.bottom) / this.camera.zoom;
            const frustumWidth = (this.camera.right - this.camera.left) / this.camera.zoom;
            moveX = -deltaX * frustumWidth * 0.5;
            moveY = -deltaY * frustumHeight * 0.5;
        }
        
        moveX *= this.panSpeed;
        moveY *= this.panSpeed;

        const vRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const vUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
        const panVec = new THREE.Vector3().addScaledVector(vRight, moveX).addScaledVector(vUp, moveY);
        
        this.camera.position.add(panVec);
        this.target.add(panVec);
    }

    zoomCamera(scale, clientX, clientY) {
        const mouse = this.getNormalizedMouse(clientX, clientY);

        this.camera.getWorldDirection(this._planeNormal);
        this._plane.setFromNormalAndCoplanarPoint(this._planeNormal, this.target);

        this._raycaster.setFromCamera(mouse, this.camera);
        if (!this._raycaster.ray.intersectPlane(this._plane, this._intersectPoint)) return;
        const startPoint = this._intersectPoint.clone();

        if (this.camera.isPerspectiveCamera) {
            const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
            const dist = offset.length();
            let newDist = dist / scale;
            if (newDist < this.camera.near * 1.5) newDist = this.camera.near * 1.5;
            if (newDist > this.camera.far * 0.9) newDist = this.camera.far * 0.9;
            offset.setLength(newDist);
            this.camera.position.addVectors(this.target, offset);
        } else {
            let newZoom = this.camera.zoom * scale;
            if (newZoom < 0.001) newZoom = 0.001;
            if (newZoom > 100000) newZoom = 100000;
            this.camera.zoom = newZoom;
        }
        
        this.camera.updateProjectionMatrix();
        this.camera.updateMatrixWorld();

        this._raycaster.setFromCamera(mouse, this.camera);
        this._raycaster.ray.intersectPlane(this._plane, this._intersectPoint);
        const endPoint = this._intersectPoint.clone();

        const shift = new THREE.Vector3().subVectors(startPoint, endPoint);
        this.camera.position.add(shift);
        this.target.add(shift);
    }
}

// -------------------------------------------------------------
// 3. CSS STYLES FOR UI
// -------------------------------------------------------------
const style = document.createElement('style');
style.innerHTML = `
    #ui-container {
        position: absolute;
        top: 60px;
        right: 10px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 100;
        font-family: sans-serif;
    }

    .ui-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
        background: rgba(0, 0, 0, 0.2);
        padding: 5px;
        border-radius: 8px;
        backdrop-filter: blur(2px);
    }

    .icon-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 8px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #bbbbbb;
        transition: all 0.2s ease;
        outline: none;
    }

    .icon-btn:hover {
        background-color: rgba(255, 255, 255, 0.15);
        color: #ffffff;
        transform: scale(1.05);
    }

    .icon-btn.active {
        color: #3da3e0;
        background-color: rgba(61, 163, 224, 0.1);
    }

    .icon-btn svg {
        width: 24px;
        height: 24px;
        fill: currentColor;
    }
`;
document.head.appendChild(style);

// -------------------------------------------------------------
// Main Application
// -------------------------------------------------------------

let camera, scene, renderer, loader, controls, objectContainer, pivotSphere, dirLight;
let loadingBarContainer, loadingBar;
// --- ANIMATION UPDATE: Globals ---
let mixer, clock;

const frustumSize = 20;

init();
animate();

function init() {
    loader = new GLTFLoader();
    // --- ANIMATION UPDATE: Init Clock ---
    clock = new THREE.Clock();
    
    createUI(); // New SVG UI
    createLoadingUI();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, frustumSize * aspect / 2,
        frustumSize / 2, frustumSize / -2,
        0.1, 1000
    );
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    const container = document.getElementById('viewport');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; 
    renderer.toneMappingExposure = 0.5;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // --- LIGHTING (DARKER SHADOWS) ---
    // Reduced ambient light to make shadows deeper
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888888, 0.05);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 4096; 
    dirLight.shadow.mapSize.height = 4096;
    dirLight.shadow.bias = -0.0001; 
    dirLight.shadow.normalBias = 0.02; 
    scene.add(dirLight);
    scene.add(dirLight.target);

    // Reduced backfill light
    const backLight = new THREE.DirectionalLight(0xffffff, 0.15);
    backLight.position.set(-10, 5, -10);
    scene.add(backLight);

    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.1);
    bottomLight.position.set(0, -10, 0);
    scene.add(bottomLight);

    objectContainer = new THREE.Group();
    scene.add(objectContainer);

    // --- FLOOR SHADOW PLANE REMOVED ---

    const geometry = new THREE.BoxGeometry(4, 4, 4);
    geometry.computeBoundsTree();
    const material = new THREE.MeshPhysicalMaterial({
        color: 0x3da3e0, metalness: 0.7, roughness: 0.2, clearcoat: 1.0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    objectContainer.add(mesh);
    objectContainer.add(new THREE.AxesHelper(5));
    const edges = new THREE.EdgesGeometry(geometry);
    mesh.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 })));

    // Pivot Sphere
    const sphereGeo = new THREE.SphereGeometry(.2, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ 
        color: 0xff5555, transparent: true, opacity: 0.6, depthTest: false 
    });
    pivotSphere = new THREE.Mesh(sphereGeo, sphereMat);
    pivotSphere.visible = false;
    pivotSphere.renderOrder = 999;
    scene.add(pivotSphere);

    window.addEventListener('resize', onWindowResize);
    controls = new Coin3DControls(camera, renderer.domElement, objectContainer);
}

// --- SVG ICONS ---
function getIconSvg(name) {
    const paths = {
        'ortho': '<path d="M2 2h20v20H2V2zm18 18V4H4v16h16zM6 12h4v4H6v-4zm6 0h4v4h-4v-4zm-6-6h4v4H6V6zm6 0h4v4h-4V6z"/>',
        'persp': '<path d="M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm2 0h14v14H5V5zm7 2h-2v2h2V7zm0 4h-2v2h2v-2zm0 4h-2v2h2v-2z"/>',
        'top': '<path d="M4 15h16v2H4v-2zm8-11l8 8h-5v6h-6v-6H4l8-8z"/>', 
        'bottom': '<path d="M20 9H4V7h16v2zM8 20l8-8h-5V6h-6v6H4l8 8z"/>', 
        'front': '<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>', 
        'back': '<path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>', 
        'left': '<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>', 
        'right': '<path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>', 
        'iso': '<path d="M21 16.5l-9-5.19V5H9v6.31l-9 5.19V9h21v7.5zm-9-6.31L3.89 15 12 19.69 20.11 15 12 10.19zM12 3L2 9v12l10-6 10 6V9L12 3z"/>'
    };
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${paths[name]}</svg>`;
}

function createUI() {
    const uiContainer = document.createElement('div');
    uiContainer.id = 'ui-container';
    document.body.appendChild(uiContainer);

    const addIconBtn = (iconName, tooltip, cb, parent) => {
        const b = document.createElement('button');
        b.className = 'icon-btn';
        b.innerHTML = getIconSvg(iconName);
        b.title = tooltip;
        b.onclick = cb;
        parent.appendChild(b);
        return b;
    };

    const projGroup = document.createElement('div');
    projGroup.className = 'ui-group';
    projGroup.style.flexDirection = 'row';
    uiContainer.appendChild(projGroup);

    const btnOrtho = addIconBtn('ortho', 'Orthographic View', () => toggleProjection('ortho'), projGroup);
    const btnPersp = addIconBtn('persp', 'Perspective View', () => toggleProjection('persp'), projGroup);

    const viewGroup = document.createElement('div');
    viewGroup.className = 'ui-group';
    uiContainer.appendChild(viewGroup);

    const views = [
        { name: 'top', tip: 'Top View' },
        { name: 'bottom', tip: 'Bottom View' },
        { name: 'front', tip: 'Front View' },
        { name: 'back', tip: 'Back View' },
        { name: 'left', tip: 'Left View' },
        { name: 'right', tip: 'Right View' },
        { name: 'iso', tip: 'Isometric View' }
    ];

    views.forEach(v => {
        addIconBtn(v.name, v.tip, () => controls.snap(v.name), viewGroup);
    });

    window.updateProjectionUI = (mode) => {
        if (mode === 'ortho') {
            btnOrtho.classList.add('active');
            btnPersp.classList.remove('active');
        } else {
            btnOrtho.classList.remove('active');
            btnPersp.classList.add('active');
        }
    };
    updateProjectionUI('ortho');
}

function createLoadingUI() {
    loadingBarContainer = document.createElement('div');
    Object.assign(loadingBarContainer.style, {
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '300px', height: '20px', backgroundColor: '#444', border: '2px solid white',
        borderRadius: '10px', display: 'none', zIndex: '1000'
    });
    loadingBar = document.createElement('div');
    Object.assign(loadingBar.style, {
        width: '0%', height: '100%', backgroundColor: '#3da3e0', borderRadius: '8px', transition: 'width 0.1s'
    });
    loadingBarContainer.appendChild(loadingBar);
    document.body.appendChild(loadingBarContainer);
}

function toggleProjection(mode) {
    const isOrtho = camera.isOrthographicCamera;
    if ((mode === 'ortho' && isOrtho) || (mode === 'persp' && !isOrtho)) return;

    let newCam;
    const dist = camera.position.distanceTo(controls.target);

    if (mode === 'persp') {
        newCam = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, camera.near, camera.far);
        newCam.position.copy(camera.position);
        newCam.quaternion.copy(camera.quaternion);
        newCam.up.copy(camera.up);
        
        const orthoH = (camera.top - camera.bottom) / camera.zoom;
        const newDist = (orthoH / 2) / Math.tan(THREE.MathUtils.degToRad(newCam.fov / 2));
        const offset = new THREE.Vector3().subVectors(newCam.position, controls.target).setLength(newDist);
        newCam.position.addVectors(controls.target, offset);
    } else {
        const aspect = window.innerWidth / window.innerHeight;
        newCam = new THREE.OrthographicCamera(
            frustumSize * aspect / -2, frustumSize * aspect / 2,
            frustumSize / 2, frustumSize / -2,
            camera.near, camera.far
        );
        newCam.position.copy(camera.position);
        newCam.quaternion.copy(camera.quaternion);
        newCam.up.copy(camera.up);

        const perspH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        newCam.zoom = frustumSize / perspH;
    }

    camera = newCam;
    controls.camera = newCam;
    camera.updateProjectionMatrix();
    onWindowResize();
    if (window.updateProjectionUI) window.updateProjectionUI(mode);
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

    // --- ANIMATION UPDATE: Update Mixer ---
    if (clock) {
        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);
    }
    
    if (pivotSphere && controls) {
        pivotSphere.visible = controls.pivotingOnObject;
        if (pivotSphere.visible) {
            pivotSphere.position.copy(controls.target);
            let scaleFactor;
            if (camera.isPerspectiveCamera) {
                const dist = camera.position.distanceTo(pivotSphere.position);
                scaleFactor = dist * 0.02; 
            } else {
                scaleFactor = 20 / camera.zoom * 0.02; 
            }
            pivotSphere.scale.setScalar(scaleFactor);
        }
    }
    
    renderer.render(scene, camera);
}

// --- UTILITIES ---

function loadGLB(url) {
    clearAllMeshes(scene);
    loadingBarContainer.style.display = 'block';
    loadingBar.style.width = '0%';

    // --- ANIMATION UPDATE: Clean up old mixer ---
    if (mixer) {
        mixer.stopAllAction();
        mixer = null;
    }

    loader.load(
        url,
        (gltf) => {
            loadingBarContainer.style.display = 'none';
            objectContainer.add(gltf.scene);

            // --- ANIMATION UPDATE: Setup Mixer & Play ---
            if (gltf.animations && gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(gltf.scene);
                gltf.animations.forEach((clip) => {
                    mixer.clipAction(clip).play();
                });
            }

            gltf.scene.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.geometry) child.geometry.computeBoundsTree();
                    
                    if (child.material) {
                        const color = child.material.color;
                        child.material = new THREE.MeshPhysicalMaterial({
                            color: color, 
                            metalness: 0.1, 
                            roughness: 0.7, 
                            side: THREE.DoubleSide
                        });
                    }
                }
            });

            const box = new THREE.Box3().setFromObject(gltf.scene);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            gltf.scene.position.sub(center);
            controls.target.set(0, 0, 0);

            dirLight.position.set(maxDim, maxDim * 2, maxDim);
            dirLight.target.position.set(0, 0, 0);
            dirLight.target.updateMatrixWorld();

            const shadowCam = dirLight.shadow.camera;
            const shadowPad = maxDim * 1.5; 
            shadowCam.left = -shadowPad; shadowCam.right = shadowPad;
            shadowCam.top = shadowPad; shadowCam.bottom = -shadowPad;
            shadowCam.near = 0.1; shadowCam.far = maxDim * 10;
            shadowCam.updateProjectionMatrix();

            // Bias fixed to 0.02 (Stable)
            dirLight.shadow.bias = -0.0005;
            dirLight.shadow.normalBias = 0.02;

            // --- FLOOR SHADOW UPDATE REMOVED ---

            const safeNear = maxDim / 1000;
            const safeFar = maxDim * 100;
            camera.near = safeNear;
            camera.far = safeFar;
            camera.updateProjectionMatrix();

            const padding = 1.5;
            if (camera.isPerspectiveCamera) {
                const fov = THREE.MathUtils.degToRad(camera.fov / 2);
                let dist = (maxDim / 2) / Math.tan(fov);
                dist *= padding;
                camera.position.set(0, 0, dist);
            } else {
                camera.zoom = frustumSize / (maxDim * padding);
                camera.updateProjectionMatrix();
                camera.position.set(0, 0, maxDim * 2);
            }

            controls.snap('iso');
        },
        (xhr) => {
            if (xhr.lengthComputable) {
                const percent = (xhr.loaded / xhr.total) * 100;
                loadingBar.style.width = percent + '%';
            }
        },
        (err) => { console.error(err); loadingBarContainer.style.display = 'none'; }
    );
}

function clearAllMeshes(scene) {
    const toRemove = [];
    objectContainer.traverse((obj) => {
        if (obj.isCamera || obj.isLight || obj.type.includes('Helper')) return;
        if (obj.isMesh || obj.isLine || obj.isPoints) {
            if (obj.geometry && obj.geometry.disposeBoundsTree) {
                obj.geometry.disposeBoundsTree();
            }
            obj.geometry?.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material?.dispose();
            toRemove.push(obj);
        }
    });
    toRemove.forEach(obj => obj.parent.remove(obj));
}

window.loadGLB = loadGLB;
window.clearAllMeshes = clearAllMeshes;

// ]]>