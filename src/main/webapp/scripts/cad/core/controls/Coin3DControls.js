import * as THREE from 'three';

/**
 * Coin3D-style camera controls with Blender-like interaction patterns.
 *
 * Mouse Controls:
 * - Middle Mouse: Rotate around target
 * - Shift + Middle Mouse: Pan
 * - Ctrl + Middle Mouse: Zoom (drag)
 * - Mouse Wheel: Zoom
 *
 * Trackpad Controls (Blender-style):
 * - Two-finger drag: Rotate around target
 * - Shift + Two-finger drag: Pan
 * - Pinch: Zoom
 *
 * Features:
 * - Click-to-focus: Clicking on an object sets it as the rotation pivot
 * - Snap views: Quick access to standard orthographic views
 * - Works with both Perspective and Orthographic cameras
 */
export class Coin3DControls {
    constructor(camera, domElement, scene) {
        this.camera = camera;
        this.domElement = domElement;
        this.scene = scene;
        
        // Target point for rotation/zoom
        this.target = new THREE.Vector3(0, 0, 0);
        
        // Center of the scene/part for snap views
        this.sceneCenter = new THREE.Vector3(0, 0, 0);

        // Interaction speeds
        this.rotateSpeed = 2.5;
        this.panSpeed = 1.0;
        this.zoomSpeed = 1.10;
        this.dragZoomSpeed = 1.5;

        // Trackpad settings
        this.trackpadRotateSpeed = 0.004;
        this.trackpadPanSpeed = 0.002;
        this.trackpadZoomSpeed = 0.01;

        // Trackpad gesture state (for pivot detection)
        this._lastWheelTime = 0;
        this._wheelGestureTimeout = null;
        this._isTrackpadGestureActive = false;
        this._trackpadGestureThreshold = 150; // ms - time to consider a new gesture

        // State tracking
        this.state = -1; // -1: none, 0: rotate, 1: pan, 2: zoom
        this.isDragging = false;
        this.pivotingOnObject = false;

        // Internal helpers
        this._lastMouse = new THREE.Vector2();
        this._raycaster = new THREE.Raycaster();
        this._raycaster.firstHitOnly = true;

        this._plane = new THREE.Plane();
        this._planeNormal = new THREE.Vector3();
        this._intersectPoint = new THREE.Vector3();

        // Bind event handlers
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onWheel = this._onWheel.bind(this);
        this._onContextMenu = (e) => e.preventDefault();

        // Attach events
        this.domElement.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);
        this.domElement.addEventListener('wheel', this._onWheel, { passive: false });
        this.domElement.addEventListener('contextmenu', this._onContextMenu);
    }

    /**
     * Set the center point for snap views
     */
    setSceneCenter(center) {
        this.sceneCenter.copy(center);
        if (this.target.lengthSq() === 0) {
            this.target.copy(center);
        }
    }

    /**
     * Get the current target/pivot point
     */
    getTarget() {
        return this.target.clone();
    }

    /**
     * Set the target/pivot point
     */
    setTarget(target) {
        this.target.copy(target);
    }

    /**
     * Raycast to find intersected objects
     */
    getIntersects(normalizedMouse) {
        this._raycaster.setFromCamera(normalizedMouse, this.camera);
        const intersects = this._raycaster.intersectObjects(this.scene.children, true);
        return intersects.find(res => 
            res.object.isMesh && 
            res.object.visible && 
            !res.object.isHelper
        );
    }

    /**
     * Snap camera to a standard view
     */
    snap(viewName) {
        const t = this.sceneCenter;
        this.target.copy(t);

        let dist;
        if (this.camera.isPerspectiveCamera) {
            dist = this.camera.position.distanceTo(t);
            if (dist < 10) dist = 200;
        } else {
            dist = 500;
        }

        this.camera.up.set(0, 1, 0);

        switch (viewName) {
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
                this.camera.position.set(t.x, t.y + dist, t.z);
                this.camera.up.set(0, 0, -1);
                break;
            case 'bottom':
                this.camera.position.set(t.x, t.y - dist, t.z);
                this.camera.up.set(0, 0, 1);
                break;
            case 'iso':
                const isoVec = new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(dist);
                this.camera.position.copy(t).add(isoVec);
                break;
        }
        
        this.camera.lookAt(t);
        this.camera.updateProjectionMatrix();
    }

    /**
     * Convert client coordinates to normalized device coordinates
     */
    getNormalizedMouse(clientX, clientY) {
        const rect = this.domElement.getBoundingClientRect();
        return new THREE.Vector2(
            ((clientX - rect.left) / rect.width) * 2 - 1,
            -((clientY - rect.top) / rect.height) * 2 + 1
        );
    }

    _onMouseDown(event) {
        event.preventDefault();
        this.isDragging = true;
        this._lastMouse = this.getNormalizedMouse(event.clientX, event.clientY);

        if (event.button === 1) { // Middle mouse
            if (event.ctrlKey) {
                this.state = 2; // Zoom
                this.pivotingOnObject = false;
            } else if (event.shiftKey) {
                this.state = 1; // Pan
                this.pivotingOnObject = false;
            } else {
                this.state = 0; // Rotate
                const hit = this.getIntersects(this._lastMouse);
                if (hit) {
                    this.target.copy(hit.point);
                    this.pivotingOnObject = true;
                } else {
                    this.target.copy(this.sceneCenter);
                    this.pivotingOnObject = false;
                }
            }
        } else {
            this.state = -1;
        }
    }

    _onMouseMove(event) {
        if (!this.isDragging || this.state === -1) return;
        event.preventDefault();
        
        const currMouse = this.getNormalizedMouse(event.clientX, event.clientY);

        if (this.state === 0) { // Rotate
            const deltaX = currMouse.x - this._lastMouse.x;
            const deltaY = currMouse.y - this._lastMouse.y;
            const angle = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (angle > 0.0001) {
                const axisScreen = new THREE.Vector3(-deltaY, deltaX, 0).normalize();
                const axisWorld = axisScreen.applyQuaternion(this.camera.quaternion);
                this._rotateCamera(axisWorld, -angle * this.rotateSpeed);
            }
            this._lastMouse.copy(currMouse);

        } else if (this.state === 1) { // Pan
            const deltaX = currMouse.x - this._lastMouse.x;
            const deltaY = currMouse.y - this._lastMouse.y;
            this._panCamera(deltaX, deltaY);
            this._lastMouse.copy(currMouse);

        } else if (this.state === 2) { // Zoom
            const deltaY = currMouse.y - this._lastMouse.y;
            const scale = Math.exp(deltaY * this.dragZoomSpeed);
            this._zoomCamera(scale, event.clientX, event.clientY);
            this._lastMouse.copy(currMouse);
        }
    }

    _onMouseUp() {
        this.isDragging = false;
        this.state = -1;
        this.pivotingOnObject = false;
    }

    _onWheel(event) {
        event.preventDefault();

        // Detect if this is a pinch-to-zoom gesture (ctrlKey is set by browser for pinch)
        const isPinchZoom = event.ctrlKey;

        // Detect if this is likely a trackpad (has both deltaX and deltaY, or small deltas)
        const isTrackpad = Math.abs(event.deltaX) > 0 ||
                           (Math.abs(event.deltaY) < 50 && event.deltaMode === 0);

        if (isPinchZoom) {
            // Pinch-to-zoom: ctrlKey is set by browser for trackpad pinch gestures
            const scale = Math.exp(-event.deltaY * this.trackpadZoomSpeed);
            this._zoomCamera(scale, event.clientX, event.clientY);

        } else if (isTrackpad) {
            // Detect start of new trackpad gesture for pivot raycasting
            const now = performance.now();
            const isNewGesture = (now - this._lastWheelTime) > this._trackpadGestureThreshold;

            if (isNewGesture && !event.shiftKey) {
                // New rotation gesture - raycast to find pivot point
                const mouse = this.getNormalizedMouse(event.clientX, event.clientY);
                const hit = this.getIntersects(mouse);
                if (hit) {
                    this.target.copy(hit.point);
                    this.pivotingOnObject = true;
                } else {
                    this.target.copy(this.sceneCenter);
                    this.pivotingOnObject = false;
                }
                this._isTrackpadGestureActive = true;
            }

            this._lastWheelTime = now;

            // Clear any existing timeout and set a new one to detect gesture end
            if (this._wheelGestureTimeout) {
                clearTimeout(this._wheelGestureTimeout);
            }
            this._wheelGestureTimeout = setTimeout(() => {
                this._isTrackpadGestureActive = false;
                this.pivotingOnObject = false;
            }, this._trackpadGestureThreshold);

            // Trackpad two-finger gesture
            if (event.shiftKey) {
                // Shift + two-finger drag: Pan
                this._panCameraPixels(event.deltaX, event.deltaY);
            } else {
                // Two-finger drag: Rotate
                this._rotateCameraTrackpad(event.deltaX, event.deltaY);
            }

        } else {
            // Regular mouse wheel: Zoom
            const scale = event.deltaY > 0 ? (1 / this.zoomSpeed) : this.zoomSpeed;
            this._zoomCamera(scale, event.clientX, event.clientY);
        }
    }

    /**
     * Rotate camera using trackpad deltas (in pixels)
     */
    _rotateCameraTrackpad(deltaX, deltaY) {
        const angleX = deltaX * this.trackpadRotateSpeed;
        const angleY = deltaY * this.trackpadRotateSpeed;

        // Horizontal rotation (around world Y axis)
        if (Math.abs(angleX) > 0.0001) {
            const axisY = new THREE.Vector3(0, 1, 0);
            this._rotateCamera(axisY, angleX);
        }

        // Vertical rotation (around camera's right axis)
        if (Math.abs(angleY) > 0.0001) {
            const axisX = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
            this._rotateCamera(axisX, angleY);
        }
    }

    /**
     * Pan camera using pixel deltas (for trackpad)
     */
    _panCameraPixels(deltaX, deltaY) {
        let moveX, moveY;

        if (this.camera.isPerspectiveCamera) {
            const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
            const dist = offset.length();
            const targetHeight = 2.0 * Math.tan((this.camera.fov * Math.PI) / 360) * dist;
            const pixelRatio = targetHeight / this.domElement.clientHeight;
            moveX = deltaX * pixelRatio;
            moveY = -deltaY * pixelRatio;
        } else {
            const frustumHeight = (this.camera.top - this.camera.bottom) / this.camera.zoom;
            const pixelRatio = frustumHeight / this.domElement.clientHeight;
            moveX = deltaX * pixelRatio;
            moveY = -deltaY * pixelRatio;
        }

        const vRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const vUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
        const panVec = new THREE.Vector3()
            .addScaledVector(vRight, moveX)
            .addScaledVector(vUp, moveY);

        this.camera.position.add(panVec);
        this.target.add(panVec);
    }

    _rotateCamera(axis, angle) {
        const q = new THREE.Quaternion();
        q.setFromAxisAngle(axis, angle);
        const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
        offset.applyQuaternion(q);
        this.camera.quaternion.premultiply(q);
        this.camera.position.addVectors(this.target, offset);
    }

    _panCamera(deltaX, deltaY) {
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
        const panVec = new THREE.Vector3()
            .addScaledVector(vRight, moveX)
            .addScaledVector(vUp, moveY);

        this.camera.position.add(panVec);
        this.target.add(panVec);
    }

    _zoomCamera(scale, clientX, clientY) {
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
            newDist = Math.max(this.camera.near * 1.5, Math.min(this.camera.far * 0.9, newDist));
            offset.setLength(newDist);
            this.camera.position.addVectors(this.target, offset);
        } else {
            let newZoom = this.camera.zoom * scale;
            newZoom = Math.max(0.001, Math.min(100000, newZoom));
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

    /**
     * Clean up event listeners
     */
    dispose() {
        this.domElement.removeEventListener('mousedown', this._onMouseDown);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);
        this.domElement.removeEventListener('wheel', this._onWheel);
        this.domElement.removeEventListener('contextmenu', this._onContextMenu);

        // Clear trackpad gesture timeout
        if (this._wheelGestureTimeout) {
            clearTimeout(this._wheelGestureTimeout);
            this._wheelGestureTimeout = null;
        }
    }
}
