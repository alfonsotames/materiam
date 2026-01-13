import * as THREE from 'three';
import { ProceduralBendHalf } from './ProceduralBendHalf.js';

/**
 * Represents a bend/hinge joint between two flanges.
 * Handles the rotation and visual representation of the bend.
 */
export class Hinge {
    constructor(bendData) {
        this.id = bendData.id;
        this.parentId = bendData.parentId;
        this.childId = bendData.childId;
        this.radius = bendData.radius;
        this.width = bendData.width;

        this.restAngle = (bendData.restAngle !== undefined) ? bendData.restAngle : Math.PI / 2;
        this.totalArcLength = this.radius * Math.abs(this.restAngle);

        this._matrixParentToHingeArray = bendData.matrixParentToHinge;
        this._matrixHingeToChildArray = bendData.matrixHingeToChild;

        this.hingeRoot = null;
        this.axisPivot = null;
        this.childWrapper = null;
        this.parentArc = null;
        this.childArc = null;

        this._progress = 0;
        this.bendDirection = Math.sign(this.restAngle) || 1;
    }

    /**
     * Build the hinge hierarchy and geometry
     * @param {THREE.Object3D} parentFlangeContainer - Parent flange container
     * @param {THREE.Object3D} childFlangeContainer - Child flange container
     * @param {number} thickness - Sheet metal thickness
     * @param {number} bendColor - Color for the bend arc
     * @returns {THREE.Object3D} The hinge root object
     */
    build(parentFlangeContainer, childFlangeContainer, thickness, materialOrColor = 0xffff00) {
        const hingeMatrix = new THREE.Matrix4().fromArray(this._matrixParentToHingeArray);
        const hingeToChildMatrix = new THREE.Matrix4().fromArray(this._matrixHingeToChildArray);

        // 1. Root & Pivot
        this.hingeRoot = new THREE.Object3D();
        this.hingeRoot.name = `Hinge_${this.id}_Root`;
        this.hingeRoot.applyMatrix4(hingeMatrix);
        parentFlangeContainer.add(this.hingeRoot);

        this.axisPivot = new THREE.Object3D();
        this.axisPivot.name = `Hinge_${this.id}_Axis`;
        this.hingeRoot.add(this.axisPivot);

        // 2. Child Wrapper
        this.childWrapper = new THREE.Object3D();
        this.childWrapper.name = `Hinge_${this.id}_ChildWrapper`;
        this.axisPivot.add(this.childWrapper);

        const childHolder = new THREE.Object3D();
        childHolder.applyMatrix4(hingeToChildMatrix);
        childHolder.add(childFlangeContainer);
        this.childWrapper.add(childHolder);

        // 3. Bend Geometry
        const halfArcLength = this.totalArcLength / 2;

        // Parent Side Arc
        this.parentArc = new ProceduralBendHalf(
            this.radius, this.width, thickness, materialOrColor, halfArcLength
        );
        this.parentArc.name = 'Bend_Parent_' + this.id;
        this.axisPivot.add(this.parentArc);

        // Child Side Arc
        this.childArc = new ProceduralBendHalf(
            this.radius, this.width, thickness, materialOrColor, halfArcLength
        );
        this.childArc.name = 'Bend_Child_' + this.id;
        this.childWrapper.add(this.childArc);

        this.set(0);
        return this.hingeRoot;
    }

    /**
     * Set the unfold progress
     * @param {number} progress - 0 = folded (bent), 1 = unfolded (flat)
     */
    set(progress) {
        if (progress > 1) progress = progress / 100;
        this._progress = Math.max(0, Math.min(1, progress));

        const dir = Math.sign(this.restAngle) || 1;
        const absRestAngle = Math.abs(this.restAngle);

        // ROTATION: 0% = folded (bent), 100% = unfolded (flat)
        const currentTotalAngle = this.restAngle * this._progress;

        // ARC: full when folded (0%), gone when unfolded (100%)
        const arcAngle = absRestAngle * (1 - this._progress);
        const halfArcAngle = arcAngle / 2;

        // 1. Rotate Child Wrapper
        if (this.childWrapper) {
            this.childWrapper.rotation.z = currentTotalAngle;
        }

        // 2. Update Arc Geometry and Orientation
        const halfRestAngle = absRestAngle / 2;

        // Compensation for different bend directions
        let comp = (halfRestAngle * 2) - (-Math.PI / 2 - halfRestAngle * dir + 3 * Math.PI / 4);

        if (this.parentArc) {
            this.parentArc.updateGeometry(halfArcAngle);
            const extraRotation = dir > 0 ? -Math.PI / 2 : comp;
            this.parentArc.rotation.z = -Math.PI / 2 + halfRestAngle * dir + 3 * Math.PI / 4 + extraRotation;
            this.parentArc.scale.set(1, -dir, 1);
        }

        if (this.childArc) {
            this.childArc.updateGeometry(halfArcAngle);
            const extraRotation = dir > 0 ? -Math.PI / 2 : comp;
            this.childArc.rotation.z = -Math.PI / 2 - halfRestAngle * dir + 3 * Math.PI / 4 + extraRotation;
            this.childArc.scale.set(1, dir, 1);
        }
    }

    /**
     * Fully fold the hinge (0% unfold)
     */
    fold() {
        this.set(0);
    }

    /**
     * Fully unfold the hinge (100% unfold)
     */
    unfold() {
        this.set(1);
    }

    /**
     * Get the pivot object for this hinge
     */
    getPivot() {
        return this.axisPivot;
    }

    /**
     * Get the current rotation angle
     */
    getCurrentAngle() {
        return this.childWrapper ? this.childWrapper.rotation.z : 0;
    }

    /**
     * Get the current progress value
     */
    getProgress() {
        return this._progress;
    }

    /**
     * Get hinge information
     */
    getInfo() {
        return {
            id: this.id,
            parentId: this.parentId,
            childId: this.childId,
            restAngle: this.restAngle,
            progress: this._progress
        };
    }

    /**
     * Dispose of resources
     */
    dispose() {
        if (this.parentArc) this.parentArc.dispose();
        if (this.childArc) this.childArc.dispose();
    }
}
