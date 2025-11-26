import * as THREE from 'three';

export class Coin3DControls {
    constructor(camera, domElement, target) {
        this.camera = camera;
        this.domElement = domElement;
        this.target = target || new THREE.Vector3(0, 0, 0);

        // Settings
        this.rotateSpeed = 2.5; 
        this.panSpeed = 1.0;
        this.zoomSpeed = 1.05;

        // Internal State
        this.state = -1; // -1: None, 0: Rotate, 1: Pan
        this.isDragging = false;
        this._lastMouse = new THREE.Vector2();

        // Bind Events
        this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.domElement.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    snap(viewName) {
        const dist = this.camera.isPerspectiveCamera ? 80 : 50; 
        const t = this.target;

        this.camera.up.set(0, 1, 0);

        switch(viewName) {
            case 'front': this.camera.position.set(t.x, t.y, t.z + dist); break;
            case 'back':  this.camera.position.set(t.x, t.y, t.z - dist); break;
            case 'right': this.camera.position.set(t.x + dist, t.y, t.z); break;
            case 'left':  this.camera.position.set(t.x - dist, t.y, t.z); break;
            case 'top':
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

        const vRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const vUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
        
        const panVector = new THREE.Vector3();
        panVector.addScaledVector(vRight, moveX);
        panVector.addScaledVector(vUp, moveY);
        this.camera.position.add(panVector);
    }

    zoomCamera(scale) {
        if (this.camera.isPerspectiveCamera) {
            const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
            const dist = offset.length();
            let newDist = dist / scale;
            if (newDist < 0.1) newDist = 0.1;
            if (newDist > 1000) newDist = 1000;
            offset.setLength(newDist);
            this.camera.position.addVectors(this.target, offset);
        } else {
            let newZoom = this.camera.zoom * scale;
            if (newZoom < 0.1) newZoom = 0.1;
            if (newZoom > 20) newZoom = 20;

            const effectiveScale = newZoom / this.camera.zoom;
            if (Math.abs(effectiveScale - 1) < 0.0001) return; 

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
}