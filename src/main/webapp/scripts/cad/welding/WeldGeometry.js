/**
 * WeldGeometry.js - Creates and manages weld visualization geometry
 *
 * Generates cylinder meshes representing welds at the selected edge locations.
 */

import * as THREE from 'three';

export class WeldGeometry {
    constructor(scene) {
        this.scene = scene;

        // Weld appearance settings
        this.weldRadius = 2.0; // mm
        this.weldColor = 0xc0c0c0; // Silver/metallic color
        this.weldMetalness = 0.8;
        this.weldRoughness = 0.4;

        // Container for weld meshes
        this.weldGroup = new THREE.Group();
        this.weldGroup.name = 'welds';
        this.scene.add(this.weldGroup);

        // Weld material
        this.weldMaterial = new THREE.MeshPhysicalMaterial({
            color: this.weldColor,
            metalness: this.weldMetalness,
            roughness: this.weldRoughness,
            side: THREE.DoubleSide
        });

        // Counter for weld IDs
        this.weldIdCounter = 0;
    }

    /**
     * Create a weld mesh from an edge pair
     * @param {Object} edgePair - The edge pair from EdgeProximity
     * @returns {Object} Weld object with mesh and metadata
     */
    createWeld(edgePair) {
        const segment = edgePair.weldSegment;
        if (!segment) {
            console.warn('Cannot create weld: no weld segment data');
            return null;
        }

        const weldId = `weld-${++this.weldIdCounter}`;

        // Create weld geometry along the segment
        const mesh = this._createWeldMesh(segment);
        mesh.name = weldId;
        mesh.userData.weldId = weldId;
        mesh.userData.edgePair = edgePair;

        this.weldGroup.add(mesh);

        return {
            id: weldId,
            mesh: mesh,
            partA: edgePair.partA,
            partB: edgePair.partB,
            segment: segment,
            length: segment.length,
            position: segment.midpoint.clone()
        };
    }

    /**
     * Create the actual weld mesh geometry
     */
    _createWeldMesh(segment) {
        const length = Math.max(segment.length, 5); // Minimum 5mm weld

        // Create a cylinder along the weld direction
        const geometry = new THREE.CylinderGeometry(
            this.weldRadius,
            this.weldRadius,
            length,
            16, // Radial segments
            1,  // Height segments
            false
        );

        // Rotate cylinder to align with weld direction
        // Cylinder default orientation is along Y axis
        const quaternion = new THREE.Quaternion();
        const up = new THREE.Vector3(0, 1, 0);
        const direction = segment.direction.clone().normalize();

        // Handle edge case where direction is parallel to up
        if (Math.abs(direction.dot(up)) > 0.999) {
            quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
        } else {
            quaternion.setFromUnitVectors(up, direction);
        }

        geometry.applyQuaternion(quaternion);

        // Position at midpoint
        geometry.translate(
            segment.midpoint.x,
            segment.midpoint.y,
            segment.midpoint.z
        );

        const mesh = new THREE.Mesh(geometry, this.weldMaterial.clone());
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }

    /**
     * Create a curved weld bead (more realistic appearance)
     */
    _createCurvedWeldMesh(segment) {
        // Use a tube geometry for more realistic weld bead
        const points = [];
        const numPoints = Math.max(2, Math.floor(segment.length / 5));

        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const point = segment.midpoint.clone().add(
                segment.direction.clone().multiplyScalar(
                    (t - 0.5) * segment.length
                )
            );
            points.push(point);
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(
            curve,
            numPoints * 2,
            this.weldRadius,
            8,
            false
        );

        const mesh = new THREE.Mesh(geometry, this.weldMaterial.clone());
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }

    /**
     * Remove a weld from the scene
     */
    removeWeld(weld) {
        if (weld && weld.mesh) {
            this.weldGroup.remove(weld.mesh);
            if (weld.mesh.geometry) {
                weld.mesh.geometry.dispose();
            }
            if (weld.mesh.material) {
                weld.mesh.material.dispose();
            }
        }
    }

    /**
     * Update weld appearance settings
     */
    setWeldRadius(radius) {
        this.weldRadius = radius;
    }

    /**
     * Set weld color
     */
    setWeldColor(color) {
        this.weldColor = color;
        this.weldMaterial.color.set(color);
    }

    /**
     * Get all weld meshes
     */
    getWeldMeshes() {
        return this.weldGroup.children;
    }

    /**
     * Highlight a specific weld
     */
    highlightWeld(weld, highlight = true) {
        if (!weld || !weld.mesh) return;

        if (highlight) {
            weld.mesh.material.emissive = new THREE.Color(0x444444);
            weld.mesh.material.emissiveIntensity = 0.5;
        } else {
            weld.mesh.material.emissive = new THREE.Color(0x000000);
            weld.mesh.material.emissiveIntensity = 0;
        }
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        // Remove all weld meshes
        while (this.weldGroup.children.length > 0) {
            const mesh = this.weldGroup.children[0];
            this.weldGroup.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        }

        // Remove weld group from scene
        if (this.weldGroup.parent) {
            this.weldGroup.parent.remove(this.weldGroup);
        }

        // Dispose material
        this.weldMaterial.dispose();
    }
}
