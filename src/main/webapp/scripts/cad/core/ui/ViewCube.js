import * as THREE from 'three';

/**
 * ViewCube - Interactive 3D orientation indicator
 *
 * Displays a small cube showing current camera orientation.
 * Click on faces/edges/corners to snap to standard views.
 */
export class ViewCube {
    constructor(options = {}) {
        this.options = {
            size: 90,
            position: { top: '180px', right: '20px' },
            ...options
        };

        this.container = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.cube = null;
        this.edgeLines = null;

        this.mainCamera = null;
        this.onViewSnap = null;

        this._raycaster = new THREE.Raycaster();
        this._mouse = new THREE.Vector2();

        this._onMouseMove = this._onMouseMove.bind(this);
        this._onClick = this._onClick.bind(this);
    }

    create() {
        this.dispose();

        // Create container
        this.container = document.createElement('div');
        this.container.id = 'view-cube';
        this.container.style.cssText = `
            position: fixed;
            top: ${this.options.position.top};
            right: ${this.options.position.right};
            width: ${this.options.size}px;
            height: ${this.options.size}px;
            z-index: 100;
            cursor: pointer;
            border-radius: 6px;
            overflow: hidden;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        `;
        document.body.appendChild(this.container);

        // Create Three.js scene
        this.scene = new THREE.Scene();

        // Create orthographic camera for cube
        const aspect = 1;
        const frustum = 2.2;
        this.camera = new THREE.OrthographicCamera(
            -frustum * aspect, frustum * aspect,
            frustum, -frustum,
            0.1, 100
        );
        this.camera.position.set(3, 3, 3);
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.options.size, this.options.size);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);

        // Create the cube with face labels
        this._createCube();

        // Add lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);
        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(5, 5, 5);
        this.scene.add(directional);

        // Event listeners
        this.container.addEventListener('mousemove', this._onMouseMove);
        this.container.addEventListener('click', this._onClick);

        return this;
    }

    _createCube() {
        const size = 1.4;

        // Face definitions with their views
        const faces = [
            { name: 'FRONT', view: 'front', color: 0x4a9eff, position: [0, 0, size/2], rotation: [0, 0, 0] },
            { name: 'BACK', view: 'back', color: 0x4a9eff, position: [0, 0, -size/2], rotation: [0, Math.PI, 0] },
            { name: 'RIGHT', view: 'right', color: 0x50c878, position: [size/2, 0, 0], rotation: [0, Math.PI/2, 0] },
            { name: 'LEFT', view: 'left', color: 0x50c878, position: [-size/2, 0, 0], rotation: [0, -Math.PI/2, 0] },
            { name: 'TOP', view: 'top', color: 0xff6b6b, position: [0, size/2, 0], rotation: [-Math.PI/2, 0, 0] },
            { name: 'BOTTOM', view: 'bottom', color: 0xff6b6b, position: [0, -size/2, 0], rotation: [Math.PI/2, 0, 0] }
        ];

        // Create a group for the cube
        this.cube = new THREE.Group();

        faces.forEach(face => {
            // Create face plane
            const geometry = new THREE.PlaneGeometry(size * 0.98, size * 0.98);
            const material = new THREE.MeshLambertMaterial({
                color: face.color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.85
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(...face.position);
            mesh.rotation.set(...face.rotation);
            mesh.userData.view = face.view;
            mesh.userData.name = face.name;
            mesh.userData.originalColor = face.color;
            this.cube.add(mesh);

            // Create text label using canvas texture
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(face.name, 64, 64);

            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;

            const labelGeometry = new THREE.PlaneGeometry(size * 0.9, size * 0.9);
            const labelMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                depthTest: false
            });
            const label = new THREE.Mesh(labelGeometry, labelMaterial);

            // Position label slightly in front of face
            const offset = 0.01;
            label.position.set(
                face.position[0] + (face.position[0] !== 0 ? Math.sign(face.position[0]) * offset : 0),
                face.position[1] + (face.position[1] !== 0 ? Math.sign(face.position[1]) * offset : 0),
                face.position[2] + (face.position[2] !== 0 ? Math.sign(face.position[2]) * offset : 0)
            );
            label.rotation.set(...face.rotation);
            label.userData.isLabel = true;
            this.cube.add(label);
        });

        // Add edge lines for definition
        const edgeGeometry = new THREE.BoxGeometry(size, size, size);
        const edges = new THREE.EdgesGeometry(edgeGeometry);
        this.edgeLines = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true })
        );
        this.cube.add(this.edgeLines);

        // Add coordinate axes
        this._createAxes(size);

        this.scene.add(this.cube);
    }

    _createAxes(cubeSize) {
        const axisLength = cubeSize * 0.9;
        const axisOffset = cubeSize / 2 + 0.15;
        const arrowSize = 0.12;

        const axes = [
            { dir: new THREE.Vector3(1, 0, 0), color: 0xff4444, label: 'X' },
            { dir: new THREE.Vector3(0, 1, 0), color: 0x44ff44, label: 'Y' },
            { dir: new THREE.Vector3(0, 0, 1), color: 0x4444ff, label: 'Z' }
        ];

        axes.forEach(axis => {
            // Create axis line
            const start = axis.dir.clone().multiplyScalar(axisOffset);
            const end = axis.dir.clone().multiplyScalar(axisOffset + axisLength);

            const lineGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
            const lineMaterial = new THREE.LineBasicMaterial({
                color: axis.color,
                linewidth: 2
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            line.userData.isAxis = true;
            this.cube.add(line);

            // Create arrow cone at the end
            const coneGeometry = new THREE.ConeGeometry(arrowSize, arrowSize * 2.5, 8);
            const coneMaterial = new THREE.MeshBasicMaterial({ color: axis.color });
            const cone = new THREE.Mesh(coneGeometry, coneMaterial);
            cone.position.copy(end);

            // Orient cone to point along axis direction
            if (axis.dir.x === 1) {
                cone.rotation.z = -Math.PI / 2;
            } else if (axis.dir.y === 1) {
                // Default orientation is along Y
            } else if (axis.dir.z === 1) {
                cone.rotation.x = Math.PI / 2;
            }
            cone.userData.isAxis = true;
            this.cube.add(cone);

            // Create axis label
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#' + axis.color.toString(16).padStart(6, '0');
            ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(axis.label, 16, 16);

            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;

            const labelGeometry = new THREE.PlaneGeometry(0.25, 0.25);
            const labelMaterial = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: false
            });
            const sprite = new THREE.Sprite(labelMaterial);
            sprite.position.copy(end).addScaledVector(axis.dir, 0.25);
            sprite.scale.set(0.4, 0.4, 1);
            sprite.userData.isAxis = true;
            this.cube.add(sprite);
        });
    }

    _onMouseMove(event) {
        const rect = this.container.getBoundingClientRect();
        this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this._mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Reset all face colors
        this.cube.children.forEach(child => {
            if (child.isMesh && child.userData.originalColor !== undefined) {
                child.material.color.setHex(child.userData.originalColor);
                child.material.opacity = 0.85;
            }
        });

        // Highlight hovered face
        this._raycaster.setFromCamera(this._mouse, this.camera);
        const intersects = this._raycaster.intersectObjects(this.cube.children);

        for (const hit of intersects) {
            if (hit.object.userData.view && !hit.object.userData.isLabel) {
                hit.object.material.color.setHex(0xffffff);
                hit.object.material.opacity = 1;
                break;
            }
        }

        this.render();
    }

    _onClick(event) {
        const rect = this.container.getBoundingClientRect();
        this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this._mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this._raycaster.setFromCamera(this._mouse, this.camera);
        const intersects = this._raycaster.intersectObjects(this.cube.children);

        for (const hit of intersects) {
            if (hit.object.userData.view) {
                if (this.onViewSnap) {
                    this.onViewSnap(hit.object.userData.view);
                }
                break;
            }
        }
    }

    /**
     * Sync the cube orientation with the main camera
     */
    syncWithCamera(mainCamera) {
        if (!this.cube || !mainCamera) return;

        // Get the main camera's direction to target (inverse of view direction)
        const cameraDirection = new THREE.Vector3();
        mainCamera.getWorldDirection(cameraDirection);

        // Position the viewcube camera opposite to main camera direction
        const distance = 5;
        this.camera.position.copy(cameraDirection).multiplyScalar(-distance);
        this.camera.up.copy(mainCamera.up);
        this.camera.lookAt(0, 0, 0);

        this.render();
    }

    /**
     * Set the main camera reference for syncing
     */
    setMainCamera(camera) {
        this.mainCamera = camera;
    }

    /**
     * Render the viewcube scene
     */
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    /**
     * Update called from animation loop
     */
    update(controls) {
        if (controls && controls.camera) {
            this.syncWithCamera(controls.camera);
        }
    }

    dispose() {
        if (this.container) {
            this.container.removeEventListener('mousemove', this._onMouseMove);
            this.container.removeEventListener('click', this._onClick);
            this.container.remove();
            this.container = null;
        }

        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }

        if (this.cube) {
            this.cube.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (child.material.map) child.material.map.dispose();
                    child.material.dispose();
                }
            });
        }

        this.scene = null;
        this.camera = null;
        this.cube = null;
    }
}
