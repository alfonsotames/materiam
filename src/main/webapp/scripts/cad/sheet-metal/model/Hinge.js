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

        // Bisector direction in hinge local space (points into the V)
        this._bisector = bendData.bisector || [0, -1, 0];

        this.hingeRoot = null;
        this.axisPivot = null;
        this.childWrapper = null;
        this.parentArc = null;
        this.childArc = null;
        this.axisHelper = null;

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
     * Get the bisector direction in hinge local space
     * @returns {THREE.Vector3}
     */
    getBisectorLocal() {
        return new THREE.Vector3(
            this._bisector[0],
            this._bisector[1],
            this._bisector[2]
        );
    }

    /**
     * Get the bisector direction in world space
     * @returns {THREE.Vector3}
     */
    getBisectorWorld() {
        if (!this.axisPivot) return this.getBisectorLocal();

        const bisectorLocal = this.getBisectorLocal();
        // Transform from hinge local to world space
        const worldMatrix = new THREE.Matrix4();
        this.axisPivot.updateWorldMatrix(true, false);
        worldMatrix.copy(this.axisPivot.matrixWorld);

        // Extract rotation only (no translation for direction vectors)
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.extractRotation(worldMatrix);

        return bisectorLocal.applyMatrix4(rotationMatrix).normalize();
    }

    /**
     * Create axis helper visualization for bend direction
     * Shows red arrows along the hinge axis (Z direction in hinge local space)
     * and a yellow arrow pointing towards the bend V (bisector direction)
     * @param {number} length - Length of the axis arrow (default: width + 20)
     */
    createAxisHelper(length = null) {
        if (this.axisHelper) return; // Already created

        const arrowLength = length || (this.width + 20);
        const axisColor = 0xff0000; // Red for hinge axis
        const bisectorColor = 0xffff00; // Yellow for bend direction

        // Create a group to hold all axis visualization elements
        this.axisHelper = new THREE.Group();
        this.axisHelper.name = 'AxisHelper_' + this.id;

        // Create arrow pointing in positive Z direction (hinge axis)
        const arrowPositive = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),  // Direction (positive Z)
            new THREE.Vector3(0, 0, 0),  // Origin at hinge center
            arrowLength / 2,
            axisColor,
            arrowLength * 0.12,  // Head length
            arrowLength * 0.06   // Head width
        );
        this.axisHelper.add(arrowPositive);

        // Create arrow pointing in negative Z direction (hinge axis)
        const arrowNegative = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, -1),  // Direction (negative Z)
            new THREE.Vector3(0, 0, 0),   // Origin at hinge center
            arrowLength / 2,
            axisColor,
            arrowLength * 0.12,  // Head length
            arrowLength * 0.06   // Head width
        );
        this.axisHelper.add(arrowNegative);

        // Add a small ring/torus at the center to mark the pivot point
        const ringGeometry = new THREE.TorusGeometry(this.radius * 0.3, this.radius * 0.05, 8, 24);
        const ringMaterial = new THREE.MeshBasicMaterial({ color: axisColor });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        // Rotate ring to lie in XY plane (perpendicular to Z axis)
        ring.rotation.x = Math.PI / 2;
        this.axisHelper.add(ring);

        // Create yellow arrow pointing towards the bend V (bisector direction)
        // The bisector is computed in C++ as normalize(n1 + n2) where n1, n2 are flange normals
        // It points INTO the V, where the punch goes during bending
        const bisectorDir = new THREE.Vector3(
            this._bisector[0],
            this._bisector[1],
            this._bisector[2]
        ).normalize();

        // Arrow length for bisector
        const bisectorLength = this.radius * 4 + 5;

        const bisectorArrow = new THREE.ArrowHelper(
            bisectorDir,
            new THREE.Vector3(0, 0, 0),  // Origin at hinge center
            bisectorLength,
            bisectorColor,
            bisectorLength * 0.2,  // Head length
            bisectorLength * 0.12  // Head width
        );
        this.axisHelper.add(bisectorArrow);

        this.axisPivot.add(this.axisHelper);
    }

    /**
     * Set axis helper visibility
     * @param {boolean} visible - Whether to show the axis helper
     */
    setAxisVisible(visible) {
        if (visible && !this.axisHelper) {
            this.createAxisHelper();
        }
        if (this.axisHelper) {
            this.axisHelper.visible = visible;
        }
    }

    /**
     * Dispose of resources
     */
    dispose() {
        if (this.parentArc) this.parentArc.dispose();
        if (this.childArc) this.childArc.dispose();
        if (this.axisHelper) {
            // Dispose all children (arrows and ring)
            this.axisHelper.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            if (this.axisHelper.parent) {
                this.axisHelper.parent.remove(this.axisHelper);
            }
        }
    }
}
