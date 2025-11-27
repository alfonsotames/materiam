// <![CDATA[
// 1. IMPORTS
import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import { Line2 } from 'https://unpkg.com/three@0.180.0/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'https://unpkg.com/three@0.180.0/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'https://unpkg.com/three@0.180.0/examples/jsm/lines/LineMaterial.js';

// IMPORT BVH (The performance fix for Raycasting)
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'https://unpkg.com/three-mesh-bvh@0.6.8/build/index.module.js';

// 2. APPLY BVH PATCHES to Three.js
// This supercharges the standard raycaster
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// -------------------------------------------------------------
// Coin3D Controls (Smart Pivot + BVH Optimization)
// -------------------------------------------------------------
class Coin3DControls {
    constructor(camera, domElement, objectGroup) {
        this.camera = camera;
        this.domElement = domElement;
        this.objectGroup = objectGroup;
        this.target = new THREE.Vector3(0, 0, 0);

        this.rotateSpeed = 2.5; 
        this.panSpeed = 1.0;
        this.zoomSpeed = 1.01; 

        this.state = -1; 
        this.isDragging = false;
        this.pivotingOnObject = false;

        this._lastMouse = new THREE.Vector2();
        this._raycaster = new THREE.Raycaster();
        
        // BVH OPTIMIZATION: Stop looking after the first hit
        // This makes raycasting on complex models instant.
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
            
            // 1. Raycast (Instant thanks to BVH)
            this._raycaster.setFromCamera(this._lastMouse, this.camera);
            const intersects = this._raycaster.intersectObject(this.objectGroup, true);
            
            // We don't need to filter heavily because firstHitOnly=true handles efficiency
            // Just check if we hit something visible
            const hit = intersects.find(res => res.object.visible);

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
// Main Application
// -------------------------------------------------------------

let camera, scene, renderer, loader, controls, objectContainer, gridHelper, pivotSphere;
const frustumSize = 20;

init();
animate();

function init() {
    loader = new GLTFLoader();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);

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
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 1.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 1.5);
    backLight.position.set(-10, 5, -10);
    scene.add(backLight);
    const bottomLight = new THREE.DirectionalLight(0xffffff, 1.0);
    bottomLight.position.set(0, -10, 0);
    scene.add(bottomLight);

    // Object Container
    objectContainer = new THREE.Group();
    scene.add(objectContainer);

    // Test Object
    const geometry = new THREE.BoxGeometry(4, 4, 4);
    // Pre-compute bounds tree for the initial box
    geometry.computeBoundsTree(); 
    
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, roughness: 0.5, metalness: 0.1 });
    const mesh = new THREE.Mesh(geometry, material);
    objectContainer.add(mesh);
    objectContainer.add(new THREE.AxesHelper(5));
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: 0x000000 })));

    // VISUALIZER: Pivot Sphere
    const sphereGeo = new THREE.SphereGeometry(.2, 16, 16); 
    const sphereMat = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, 
        transparent: true, 
        opacity: 0.6,
        depthTest: false 
    });
    pivotSphere = new THREE.Mesh(sphereGeo, sphereMat);
    pivotSphere.visible = false; 
    pivotSphere.renderOrder = 999; 
    scene.add(pivotSphere);

    // Grid
    gridHelper = new THREE.GridHelper(40, 40);
    scene.add(gridHelper);

    window.addEventListener('resize', onWindowResize);
    controls = new Coin3DControls(camera, renderer.domElement, objectContainer);
    createUI();
}

function createUI() {
    const ui = document.createElement('div');
    Object.assign(ui.style, { position: 'absolute', top: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '5px' });
    document.body.appendChild(ui);

    const projDiv = document.createElement('div');
    projDiv.style.display = 'flex'; projDiv.style.gap = '5px'; projDiv.style.marginBottom = '10px';
    ui.appendChild(projDiv);

    const addBtn = (txt, cb, parent) => {
        const b = document.createElement('button');
        b.innerText = txt;
        Object.assign(b.style, { padding: '8px 12px', cursor: 'pointer', fontWeight: 'bold' });
        b.onclick = cb;
        parent.appendChild(b);
    };

    addBtn('Ortho', () => toggleProjection('ortho'), projDiv);
    addBtn('Persp', () => toggleProjection('persp'), projDiv);

    ['Top', 'Bottom', 'Front', 'Back', 'Left', 'Right', 'Iso'].forEach(v => 
        addBtn(v, () => controls.snap(v.toLowerCase()), ui)
    );
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

    loader.load(url, (gltf) => {
        objectContainer.add(gltf.scene);

        // BVH: Compute bounds tree for all new meshes
        // This pre-calculation makes raycasting instant later
        gltf.scene.traverse((obj) => {
            if (obj.isMesh && obj.geometry) {
                obj.geometry.computeBoundsTree();
            }
        });

        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        gltf.scene.position.sub(center);
        controls.target.set(0, 0, 0);

        const safeNear = maxDim / 1000;
        const safeFar = maxDim * 100;
        camera.near = safeNear;
        camera.far = safeFar;
        camera.updateProjectionMatrix();

        if (gridHelper) scene.remove(gridHelper);
        gridHelper = new THREE.GridHelper(maxDim * 3, 20);
        scene.add(gridHelper);

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
    }, undefined, (err) => console.error(err));
}

function clearAllMeshes(scene) {
    const toRemove = [];
    objectContainer.traverse((obj) => {
        if (obj.isCamera || obj.isLight || obj.type.includes('Helper')) return;
        if (obj.isMesh || obj.isLine || obj.isPoints) {
            // BVH: Cleanup memory
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