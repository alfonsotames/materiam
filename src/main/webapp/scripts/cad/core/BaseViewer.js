import * as THREE from 'three';
import { Coin3DControls } from './controls/Coin3DControls.js';
import { StudioLighting } from './lighting/StudioLighting.js';
import { PivotIndicator } from './helpers/PivotIndicator.js';
import { ViewToolbar } from './ui/ViewToolbar.js';
import { ControlsHelp } from './ui/ControlsHelp.js';

/**
 * Universal 3D Part Viewer
 * 
 * A reusable base class for viewing 3D models with professional
 * camera controls, lighting, and UI.
 * 
 * Features:
 * - Orthographic/Perspective camera switching
 * - Coin3D-style navigation (rotate, pan, zoom)
 * - Studio lighting setup
 * - View snap buttons
 * - Automatic fit-to-scene
 * 
 * Usage:
 *   const viewer = new BaseViewer({ containerId: 'canvas-container' });
 *   viewer.addObject(myMesh);
 *   viewer.fitToScene();
 */
export class BaseViewer {
    constructor(options = {}) {
        this.options = {
            containerId: 'canvas-container',
            backgroundColor: 0x3a3a42,
            frustumSize: 300,
            showToolbar: true,
            showPivotIndicator: true,
            showControlsHelp: true,
            ...options
        };

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.lighting = null;
        this.pivotIndicator = null;
        this.toolbar = null;
        this.controlsHelp = null;

        this.frustumSize = this.options.frustumSize;
        this._animationId = null;

        this._init();
    }

    _init() {
        this._initScene();
        this._initCamera();
        this._initRenderer();
        this._initLighting();
        this._initControls();
        this._initHelpers();
        this._initUI();
        this._initEvents();
        this._startAnimation();
    }

    _initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.options.backgroundColor);
    }

    _initCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.OrthographicCamera(
            this.frustumSize * aspect / -2,
            this.frustumSize * aspect / 2,
            this.frustumSize / 2,
            this.frustumSize / -2,
            -100000,
            100000
        );
        this.camera.position.set(200, 200, 200);
        this.camera.lookAt(0, 0, 0);
    }

    _initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            logarithmicDepthBuffer: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.NeutralToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.shadowMap.enabled = false;

        const container = document.getElementById(this.options.containerId) || document.body;
        if (!container.querySelector('canvas')) {
            container.appendChild(this.renderer.domElement);
        }
    }

    _initLighting() {
        this.lighting = new StudioLighting();
        this.lighting.apply(this.scene, this.renderer);
    }

    _initControls() {
        this.controls = new Coin3DControls(
            this.camera,
            this.renderer.domElement,
            this.scene
        );
    }

    _initHelpers() {
        if (this.options.showPivotIndicator) {
            this.pivotIndicator = new PivotIndicator();
            this.pivotIndicator.addToScene(this.scene);
        }
    }

    _initUI() {
        if (this.options.showToolbar) {
            this.toolbar = new ViewToolbar();
            this.toolbar.create();

            this.toolbar.onProjectionChange = (mode) => {
                this.setProjection(mode);
            };

            this.toolbar.onViewSnap = (viewName) => {
                this.controls.snap(viewName);
            };

            // Default to perspective view to match toolbar
            this.setProjection('persp');
        }

        if (this.options.showControlsHelp) {
            this.controlsHelp = new ControlsHelp();
            this.controlsHelp.create();
        }
    }

    _initEvents() {
        this._onResize = this._onResize.bind(this);
        window.addEventListener('resize', this._onResize);
    }

    _startAnimation() {
        const animate = () => {
            this._animationId = requestAnimationFrame(animate);
            this._update();
            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }

    _update() {
        if (this.pivotIndicator) {
            this.pivotIndicator.update(this.controls);
        }
    }

    _onResize() {
        const aspect = window.innerWidth / window.innerHeight;

        if (this.camera.isOrthographicCamera) {
            this.camera.left = -this.frustumSize * aspect / 2;
            this.camera.right = this.frustumSize * aspect / 2;
            this.camera.top = this.frustumSize / 2;
            this.camera.bottom = -this.frustumSize / 2;
        } else {
            this.camera.aspect = aspect;
        }

        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Switch between orthographic and perspective projection
     */
    setProjection(mode) {
        const isOrtho = this.camera.isOrthographicCamera;
        if ((mode === 'ortho' && isOrtho) || (mode === 'persp' && !isOrtho)) {
            return;
        }

        const dist = this.camera.position.distanceTo(this.controls.getTarget());
        const aspect = window.innerWidth / window.innerHeight;
        let newCam;

        if (mode === 'persp') {
            newCam = new THREE.PerspectiveCamera(45, aspect, 0.1, 100000);
            const orthoH = (this.camera.top - this.camera.bottom) / this.camera.zoom;
            const newDist = (orthoH / 2) / Math.tan(THREE.MathUtils.degToRad(newCam.fov / 2));
            newCam.position.copy(this.controls.getTarget()).add(
                new THREE.Vector3()
                    .subVectors(this.camera.position, this.controls.getTarget())
                    .setLength(newDist)
            );
        } else {
            newCam = new THREE.OrthographicCamera(
                this.frustumSize * aspect / -2,
                this.frustumSize * aspect / 2,
                this.frustumSize / 2,
                this.frustumSize / -2,
                -100000,
                100000
            );
            const perspH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
            newCam.zoom = this.frustumSize / perspH;
            newCam.position.copy(this.camera.position);
        }

        newCam.quaternion.copy(this.camera.quaternion);
        newCam.up.copy(this.camera.up);

        this.camera = newCam;
        this.controls.camera = newCam;
        this.camera.updateProjectionMatrix();

        if (this.toolbar) {
            this.toolbar.setProjectionMode(mode);
        }
    }

    /**
     * Add an object to the scene
     */
    addObject(object) {
        this.scene.add(object);
        return this;
    }

    /**
     * Remove an object from the scene
     */
    removeObject(object) {
        this.scene.remove(object);
        return this;
    }

    /**
     * Get the bounding box of all objects in the scene
     */
    getBoundingBox() {
        return new THREE.Box3().setFromObject(this.scene);
    }

    /**
     * Fit the camera to show all objects in the scene
     */
    fitToScene(object = null) {
        const target = object || this.scene;
        const box = new THREE.Box3().setFromObject(target);
        
        if (box.isEmpty()) return;

        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        this.controls.setSceneCenter(center);
        this.controls.snap('iso');

        if (this.camera.isOrthographicCamera) {
            this.camera.zoom = this.frustumSize / (maxDim * 2);
            this.camera.updateProjectionMatrix();
        }
    }

    /**
     * Get the Three.js scene
     */
    getScene() {
        return this.scene;
    }

    /**
     * Get the active camera
     */
    getCamera() {
        return this.camera;
    }

    /**
     * Get the controls instance
     */
    getControls() {
        return this.controls;
    }

    /**
     * Clean up all resources
     */
    dispose() {
        // Stop animation
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
        }

        // Remove event listeners
        window.removeEventListener('resize', this._onResize);

        // Dispose controls
        if (this.controls) {
            this.controls.dispose();
        }

        // Dispose UI
        if (this.toolbar) {
            this.toolbar.dispose();
        }

        if (this.controlsHelp) {
            this.controlsHelp.dispose();
        }

        // Dispose helpers
        if (this.pivotIndicator) {
            this.pivotIndicator.dispose();
        }

        // Dispose lighting
        if (this.lighting) {
            this.lighting.dispose(this.scene);
        }

        // Dispose renderer
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
        }
    }
}