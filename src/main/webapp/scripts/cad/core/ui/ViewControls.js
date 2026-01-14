import * as THREE from 'three';

/**
 * ViewControls - Integrated view control panel
 *
 * Combines projection toggle, view snap buttons, and 3D orientation cube
 * into a single cohesive UI component.
 */
export class ViewControls {
    constructor(options = {}) {
        this.options = {
            position: { top: '100px', right: '20px' },
            cubeSize: 100,
            activeColor: '#4a9eff',
            inactiveColor: '#888',
            ...options
        };

        this.container = null;
        this.btnOrtho = null;
        this.btnPersp = null;

        // ViewCube properties
        this.cubeContainer = null;
        this.cubeRenderer = null;
        this.cubeScene = null;
        this.cubeCamera = null;
        this.cube = null;

        this._raycaster = new THREE.Raycaster();
        this._mouse = new THREE.Vector2();

        // Callbacks
        this.onProjectionChange = null;
        this.onViewSnap = null;

        this._onCubeMouseMove = this._onCubeMouseMove.bind(this);
        this._onCubeClick = this._onCubeClick.bind(this);
    }

    create() {
        this.dispose();

        // Main container - unified panel
        this.container = document.createElement('div');
        this.container.id = 'view-controls';
        this.container.style.cssText = `
            position: fixed;
            top: ${this.options.position.top};
            right: ${this.options.position.right};
            display: flex;
            flex-direction: column;
            z-index: 100;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 8px;
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            overflow: hidden;
        `;
        document.body.appendChild(this.container);

        this._createProjectionToggle();
        this._createViewCube();
        this._createViewButtons();

        return this;
    }

    _createProjectionToggle() {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            display: flex;
            padding: 6px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        `;

        const createToggleBtn = (text, isDefault) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.style.cssText = `
                flex: 1;
                background: ${isDefault ? 'rgba(74, 158, 255, 0.25)' : 'transparent'};
                border: none;
                color: ${isDefault ? this.options.activeColor : this.options.inactiveColor};
                padding: 5px 12px;
                font-size: 11px;
                font-weight: 600;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                cursor: pointer;
                border-radius: 4px;
                transition: all 0.15s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            `;
            btn.onmouseover = () => {
                if (!btn.classList.contains('active')) {
                    btn.style.background = 'rgba(255, 255, 255, 0.1)';
                }
            };
            btn.onmouseout = () => {
                if (!btn.classList.contains('active')) {
                    btn.style.background = 'transparent';
                }
            };
            if (isDefault) btn.classList.add('active');
            return btn;
        };

        this.btnOrtho = createToggleBtn('Ortho', false);
        this.btnPersp = createToggleBtn('Persp', true);

        this.btnOrtho.onclick = () => this._handleProjection('ortho');
        this.btnPersp.onclick = () => this._handleProjection('persp');

        wrapper.appendChild(this.btnOrtho);
        wrapper.appendChild(this.btnPersp);
        this.container.appendChild(wrapper);
    }

    _createViewCube() {
        // Cube container
        this.cubeContainer = document.createElement('div');
        this.cubeContainer.style.cssText = `
            width: ${this.options.cubeSize}px;
            height: ${this.options.cubeSize}px;
            cursor: pointer;
            margin: 0 auto;
        `;
        this.container.appendChild(this.cubeContainer);

        // Three.js scene for cube
        this.cubeScene = new THREE.Scene();

        const aspect = 1;
        const frustum = 2.5;
        this.cubeCamera = new THREE.OrthographicCamera(
            -frustum * aspect, frustum * aspect,
            frustum, -frustum,
            0.1, 100
        );
        this.cubeCamera.position.set(3, 3, 3);
        this.cubeCamera.lookAt(0, 0, 0);

        this.cubeRenderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.cubeRenderer.setSize(this.options.cubeSize, this.options.cubeSize);
        this.cubeRenderer.setPixelRatio(window.devicePixelRatio);
        this.cubeRenderer.setClearColor(0x000000, 0);
        this.cubeContainer.appendChild(this.cubeRenderer.domElement);

        this._buildCube();

        // Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        this.cubeScene.add(ambient);
        const directional = new THREE.DirectionalLight(0xffffff, 0.6);
        directional.position.set(5, 5, 5);
        this.cubeScene.add(directional);

        // Events
        this.cubeContainer.addEventListener('mousemove', this._onCubeMouseMove);
        this.cubeContainer.addEventListener('click', this._onCubeClick);
    }

    _buildCube() {
        const size = 1.3;
        this.cube = new THREE.Group();

        const faces = [
            { name: 'FRONT', view: 'front', color: 0x5588cc, position: [0, 0, size/2], rotation: [0, 0, 0] },
            { name: 'BACK', view: 'back', color: 0x5588cc, position: [0, 0, -size/2], rotation: [0, Math.PI, 0] },
            { name: 'RIGHT', view: 'right', color: 0x55aa77, position: [size/2, 0, 0], rotation: [0, Math.PI/2, 0] },
            { name: 'LEFT', view: 'left', color: 0x55aa77, position: [-size/2, 0, 0], rotation: [0, -Math.PI/2, 0] },
            { name: 'TOP', view: 'top', color: 0xcc6655, position: [0, size/2, 0], rotation: [-Math.PI/2, 0, 0] },
            { name: 'BOTTOM', view: 'bottom', color: 0xcc6655, position: [0, -size/2, 0], rotation: [Math.PI/2, 0, 0] }
        ];

        faces.forEach(face => {
            const geometry = new THREE.PlaneGeometry(size * 0.96, size * 0.96);
            const material = new THREE.MeshLambertMaterial({
                color: face.color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(...face.position);
            mesh.rotation.set(...face.rotation);
            mesh.userData = { view: face.view, name: face.name, originalColor: face.color };
            this.cube.add(mesh);

            // Label
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(face.name, 64, 64);

            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;

            const labelMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                depthTest: false
            });
            const label = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.85, size * 0.85), labelMaterial);
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

        // Edge lines
        const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size));
        const edgeLines = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true })
        );
        this.cube.add(edgeLines);

        // Axes
        this._buildAxes(size);

        this.cubeScene.add(this.cube);
    }

    _buildAxes(cubeSize) {
        const axisLength = cubeSize * 0.7;
        const axisOffset = cubeSize / 2 + 0.12;
        const arrowSize = 0.1;

        const axes = [
            { dir: new THREE.Vector3(1, 0, 0), color: 0xff5555, label: 'X' },
            { dir: new THREE.Vector3(0, 1, 0), color: 0x55ff55, label: 'Y' },
            { dir: new THREE.Vector3(0, 0, 1), color: 0x5555ff, label: 'Z' }
        ];

        axes.forEach(axis => {
            const start = axis.dir.clone().multiplyScalar(axisOffset);
            const end = axis.dir.clone().multiplyScalar(axisOffset + axisLength);

            // Line
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
            const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: axis.color }));
            line.userData.isAxis = true;
            this.cube.add(line);

            // Arrow
            const cone = new THREE.Mesh(
                new THREE.ConeGeometry(arrowSize, arrowSize * 2.5, 8),
                new THREE.MeshBasicMaterial({ color: axis.color })
            );
            cone.position.copy(end);
            if (axis.dir.x === 1) cone.rotation.z = -Math.PI / 2;
            else if (axis.dir.z === 1) cone.rotation.x = Math.PI / 2;
            cone.userData.isAxis = true;
            this.cube.add(cone);

            // Label sprite
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#' + axis.color.toString(16).padStart(6, '0');
            ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(axis.label, 16, 16);

            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: new THREE.CanvasTexture(canvas),
                transparent: true,
                depthTest: false
            }));
            sprite.position.copy(end).addScaledVector(axis.dir, 0.2);
            sprite.scale.set(0.35, 0.35, 1);
            sprite.userData.isAxis = true;
            this.cube.add(sprite);
        });
    }

    _createViewButtons() {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 2px;
            padding: 6px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
        `;

        const views = [
            { id: 'front', label: 'F', tooltip: 'Front' },
            { id: 'top', label: 'T', tooltip: 'Top' },
            { id: 'right', label: 'R', tooltip: 'Right' },
            { id: 'iso', label: 'ISO', tooltip: 'Isometric' }
        ];

        views.forEach(view => {
            const btn = document.createElement('button');
            btn.textContent = view.label;
            btn.title = view.tooltip;
            btn.style.cssText = `
                background: transparent;
                border: none;
                color: ${this.options.inactiveColor};
                min-width: 24px;
                height: 22px;
                padding: 0 6px;
                font-size: 10px;
                font-weight: 600;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                cursor: pointer;
                border-radius: 3px;
                transition: all 0.15s ease;
            `;

            btn.onmouseover = () => {
                btn.style.background = 'rgba(255, 255, 255, 0.15)';
                btn.style.color = '#fff';
            };
            btn.onmouseout = () => {
                btn.style.background = 'transparent';
                btn.style.color = this.options.inactiveColor;
            };
            btn.onclick = () => this._handleViewSnap(view.id);

            wrapper.appendChild(btn);
        });

        this.container.appendChild(wrapper);
    }

    _onCubeMouseMove(event) {
        const rect = this.cubeContainer.getBoundingClientRect();
        this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this._mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Reset colors
        this.cube.children.forEach(child => {
            if (child.isMesh && child.userData.originalColor !== undefined) {
                child.material.color.setHex(child.userData.originalColor);
                child.material.opacity = 0.9;
            }
        });

        // Highlight
        this._raycaster.setFromCamera(this._mouse, this.cubeCamera);
        const intersects = this._raycaster.intersectObjects(this.cube.children);

        for (const hit of intersects) {
            if (hit.object.userData.view && !hit.object.userData.isLabel) {
                hit.object.material.color.setHex(0xffffff);
                hit.object.material.opacity = 1;
                break;
            }
        }

        this.renderCube();
    }

    _onCubeClick(event) {
        const rect = this.cubeContainer.getBoundingClientRect();
        this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this._mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this._raycaster.setFromCamera(this._mouse, this.cubeCamera);
        const intersects = this._raycaster.intersectObjects(this.cube.children);

        for (const hit of intersects) {
            if (hit.object.userData.view) {
                this._handleViewSnap(hit.object.userData.view);
                break;
            }
        }
    }

    _handleProjection(mode) {
        this._setActiveProjection(mode);
        if (this.onProjectionChange) {
            this.onProjectionChange(mode);
        }
    }

    _handleViewSnap(viewName) {
        if (this.onViewSnap) {
            this.onViewSnap(viewName);
        }
    }

    _setActiveProjection(mode) {
        if (this.btnOrtho) {
            const isOrtho = mode === 'ortho';
            this.btnOrtho.style.background = isOrtho ? 'rgba(74, 158, 255, 0.25)' : 'transparent';
            this.btnOrtho.style.color = isOrtho ? this.options.activeColor : this.options.inactiveColor;
            this.btnOrtho.classList.toggle('active', isOrtho);
        }
        if (this.btnPersp) {
            const isPersp = mode === 'persp';
            this.btnPersp.style.background = isPersp ? 'rgba(74, 158, 255, 0.25)' : 'transparent';
            this.btnPersp.style.color = isPersp ? this.options.activeColor : this.options.inactiveColor;
            this.btnPersp.classList.toggle('active', isPersp);
        }
    }

    setProjectionMode(mode) {
        this._setActiveProjection(mode);
    }

    syncWithCamera(mainCamera) {
        if (!this.cube || !mainCamera) return;

        const cameraDirection = new THREE.Vector3();
        mainCamera.getWorldDirection(cameraDirection);

        const distance = 5;
        this.cubeCamera.position.copy(cameraDirection).multiplyScalar(-distance);
        this.cubeCamera.up.copy(mainCamera.up);
        this.cubeCamera.lookAt(0, 0, 0);

        this.renderCube();
    }

    update(controls) {
        if (controls && controls.camera) {
            this.syncWithCamera(controls.camera);
        }
    }

    renderCube() {
        if (this.cubeRenderer && this.cubeScene && this.cubeCamera) {
            this.cubeRenderer.render(this.cubeScene, this.cubeCamera);
        }
    }

    dispose() {
        if (this.cubeContainer) {
            this.cubeContainer.removeEventListener('mousemove', this._onCubeMouseMove);
            this.cubeContainer.removeEventListener('click', this._onCubeClick);
        }

        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        if (this.cubeRenderer) {
            this.cubeRenderer.dispose();
            this.cubeRenderer = null;
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

        this.cubeScene = null;
        this.cubeCamera = null;
        this.cube = null;
        this.btnOrtho = null;
        this.btnPersp = null;
    }
}
