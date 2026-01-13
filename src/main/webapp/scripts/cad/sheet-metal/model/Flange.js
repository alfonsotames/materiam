import * as THREE from 'three';

/**
 * Represents a flat sheet metal flange (face).
 * Handles geometry creation from 2D contours with holes.
 */
export class Flange {
    constructor(sheetData) {
        this.id = sheetData.id;
        this.thickness = sheetData.thickness;
        this.outerContour = sheetData.outer;
        this.holes = sheetData.holes || [];
        this._matrixArray = sheetData.matrix;

        this.container = null;
        this.mesh = null;
        this.originalMaterial = null;
    }

    /**
     * Build the 3D geometry for this flange
     * @param {THREE.Material} material - Material to use for the mesh
     * @returns {THREE.Object3D} Container with the flange mesh
     */
    build(material) {
        this.container = new THREE.Object3D();
        this.container.name = `Flange_${this.id}`;

        if (!this.outerContour || this.outerContour.length < 3) {
            return this.container;
        }

        // Create shape from outer contour
        const shape = new THREE.Shape();
        shape.moveTo(this.outerContour[0][0], this.outerContour[0][1]);
        this.outerContour.slice(1).forEach(p => shape.lineTo(p[0], p[1]));
        shape.closePath();

        // Add holes
        (this.holes || []).forEach(hole => {
            if (hole.length >= 3) {
                const path = new THREE.Path();
                path.moveTo(hole[0][0], hole[0][1]);
                hole.slice(1).forEach(p => path.lineTo(p[0], p[1]));
                path.closePath();
                shape.holes.push(path);
            }
        });

        // Extrude to create 3D geometry
        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: this.thickness,
            bevelEnabled: false
        });
        geometry.translate(0, 0, -this.thickness / 2);

        // Create mesh with edge lines
        this.originalMaterial = material;
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.add(new THREE.LineSegments(
            new THREE.EdgesGeometry(geometry, 30),
            new THREE.LineBasicMaterial({ color: 0x000000 })
        ));

        this.container.add(this.mesh);
        return this.container;
    }

    /**
     * Set a temporary material (e.g. for collision highlighting)
     */
    setMaterial(material) {
        if (this.mesh) this.mesh.material = material;
    }

    /**
     * Restore the original material
     */
    resetMaterial() {
        if (this.mesh && this.originalMaterial) this.mesh.material = this.originalMaterial;
    }

    /**
     * Update the base material (non-collision state)
     */
    updateOriginalMaterial(newMaterial) {
        if (this.mesh && this.mesh.material === this.originalMaterial) {
            this.mesh.material = newMaterial;
        }
        this.originalMaterial = newMaterial;
    }

    /**
     * Get the world transformation matrix for this flange
     */
    getWorldMatrix() {
        return new THREE.Matrix4().fromArray(this._matrixArray);
    }

    /**
     * Get the container Object3D
     */
    getContainer() {
        return this.container;
    }

    /**
     * Dispose of geometry and materials
     */
    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            // Don't dispose material as it may be shared
        }
    }
}
