import * as THREE from 'three';

/**
 * Visual indicator showing the current rotation pivot point.
 * Displays as a semi-transparent sphere when actively pivoting on an object.
 */
export class PivotIndicator {
    constructor(options = {}) {
        const {
            radius = 2,
            color = 0xff5555,
            opacity = 0.6,
            segments = 16
        } = options;

        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius, segments, segments),
            new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: opacity,
                depthTest: false
            })
        );
        
        this.mesh.visible = false;
        this.mesh.renderOrder = 999;
        this.mesh.isHelper = true; // Mark as helper to exclude from raycasting
    }

    /**
     * Add the indicator to a scene
     */
    addToScene(scene) {
        scene.add(this.mesh);
        return this;
    }

    /**
     * Update visibility and position based on controls state
     */
    update(controls) {
        this.mesh.visible = controls.pivotingOnObject;
        if (this.mesh.visible) {
            this.mesh.position.copy(controls.getTarget());
        }
    }

    /**
     * Show the indicator at a specific position
     */
    show(position) {
        this.mesh.visible = true;
        this.mesh.position.copy(position);
    }

    /**
     * Hide the indicator
     */
    hide() {
        this.mesh.visible = false;
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}
