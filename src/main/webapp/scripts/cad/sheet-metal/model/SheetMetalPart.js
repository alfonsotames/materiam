import * as THREE from 'three';
import { Flange } from './Flange.js';
import { Hinge } from './Hinge.js';

/**
 * Represents a complete sheet metal part with flanges and hinges.
 * Handles loading from JSON blueprint and building the hierarchy.
 */
export class SheetMetalPart {
    constructor() {
        this.blueprint = null;
        this.flanges = new Map();
        this.hinges = new Map();

        // Root container for the entire part
        this.root = new THREE.Group();
        this.root.name = 'SheetMetalPart';

        // Store initial root transform for reset
        this._initialRootPosition = null;
        this._initialRootQuaternion = null;
        this._initialRootScale = null;

        this.flangeMaterials = [];
        this.steelMaterial = null;
        this.isLoaded = false;
        this.rootFlangeId = null;

        this.collisionMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            metalness: 0.4,
            roughness: 0.6,
            side: THREE.DoubleSide
        });
    }

    _initMaterials() {
        const colors = [0xffaa00, 0x00aaff, 0xaa00ff, 0x00ffaa, 0xff00aa, 0xaaff00];
        this.flangeMaterials = colors.map(color =>
            new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.4,
                roughness: 0.6,
                side: THREE.DoubleSide
            })
        );

        this.steelMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff, // White base allows environment reflections to tint the surface
            metalness: 0.9,  // High metalness for steel
            roughness: 0.4,  // Medium roughness for a "machined" look
            side: THREE.DoubleSide
        });
    }

    /**
     * Load part from a JSON blueprint URL
     * @param {string} url - URL to the blueprint JSON file
     * @returns {Promise<SheetMetalPart>} This part instance
     */
    async load(url) {
        try {
            const response = await fetch(url + '?t=' + Date.now());
            if (!response.ok) throw new Error('HTTP ' + response.status);

            this.blueprint = await response.json();

            this._initMaterials();
            this._createFlanges();
            this._assembleHierarchy();

            // Store initial root transform for reset capability
            this._initialRootPosition = this.root.position.clone();
            this._initialRootQuaternion = this.root.quaternion.clone();
            this._initialRootScale = this.root.scale.clone();

            this.isLoaded = true;
            return this;
        } catch (error) {
            console.error('Failed to load blueprint:', error);
            throw error;
        }
    }

    _createFlanges() {
        this.blueprint.sheets.forEach((sheetData, index) => {
            const flange = new Flange(sheetData);
            const material = this.steelMaterial;
            flange.build(material);
            this.flanges.set(sheetData.id, flange);
        });
    }

    _assembleHierarchy() {
        // Find root flange (one that is not a child of any bend)
        const childIds = new Set(this.blueprint.bends.map(b => b.childId));

        let rootId = this.blueprint.sheets.find(s => !childIds.has(s.id))?.id;
        if (rootId === undefined) rootId = 0;
        this.rootFlangeId = rootId;

        const rootFlange = this.flanges.get(rootId);
        if (rootFlange) {
            const container = rootFlange.getContainer();
            container.applyMatrix4(rootFlange.getWorldMatrix());
            this.root.add(container);
        }

        // Build bends by parent
        const bendsByParent = new Map();
        this.blueprint.bends.forEach(b => {
            if (!bendsByParent.has(b.parentId)) {
                bendsByParent.set(b.parentId, []);
            }
            bendsByParent.get(b.parentId).push(b);
        });

        // BFS to build hierarchy
        const queue = [rootId];
        const done = new Set();
        const thickness = this.blueprint.sheets[0]?.thickness || 1.0;

        while (queue.length > 0) {
            const pid = queue.shift();
            if (done.has(pid)) continue;
            done.add(pid);

            const parentFlange = this.flanges.get(pid);
            if (!parentFlange) continue;

            const bends = bendsByParent.get(pid) || [];
            for (const bendData of bends) {
                const childFlange = this.flanges.get(bendData.childId);
                if (!childFlange) continue;

                const hinge = new Hinge(bendData);
                hinge.build(
                    parentFlange.getContainer(),
                    childFlange.getContainer(),
                    thickness,
                    this.steelMaterial
                );
                this.hinges.set(bendData.id, hinge);

                queue.push(bendData.childId);
            }
        }
    }

    /**
     * Add the part to a scene
     */
    addToScene(scene) {
        scene.add(this.root);
    }

    /**
     * Remove the part from its parent scene
     */
    removeFromScene() {
        if (this.root.parent) {
            this.root.parent.remove(this.root);
        }
    }

    /**
     * Get all hinge IDs
     */
    getHingeIds() {
        return Array.from(this.hinges.keys());
    }

    /**
     * Get info for a specific hinge
     */
    getHingeInfo(hingeId) {
        const h = this.hinges.get(hingeId);
        return h ? h.getInfo() : null;
    }

    /**
     * Get a hinge by ID
     */
    hinge(hingeId) {
        return this.hinges.get(hingeId);
    }

    /**
     * Set the unfold progress for a specific hinge
     * @param {number} hingeId - The hinge ID
     * @param {number} progress - Progress from 0 (folded) to 1 (unfolded)
     * @param {boolean} compensate - Whether to apply symmetry compensation (default true)
     */
    setUnfoldProgress(hingeId, progress, compensate = true) {
        const h = this.hinges.get(hingeId);
        if (!h) return;

        const oldAngle = h.getCurrentAngle();
        h.set(progress);
        const newAngle = h.getCurrentAngle();

        // SYMMETRY COMPENSATION:
        // When a hinge rotates locally, we rotate the GLOBAL ROOT
        // in the opposite direction by half the delta.
        if (compensate) {
            const delta = newAngle - oldAngle;
            if (Math.abs(delta) > 0.000001) {
                this._compensateSymmetry(h, delta);
            }
        }
    }

    _compensateSymmetry(hinge, deltaAngle) {
        const pivotObj = hinge.getPivot();

        // Get Pivot World Position
        const pivotWorld = new THREE.Vector3();
        pivotObj.getWorldPosition(pivotWorld);

        // Get Pivot World Axis
        const axisWorld = new THREE.Vector3(0, 0, 1);
        axisWorld.transformDirection(pivotObj.matrixWorld).normalize();

        // Rotate the Root around this Point+Axis
        this._rotateAroundWorldAxis(this.root, pivotWorld, axisWorld, -deltaAngle / 2);
    }

    _rotateAroundWorldAxis(object, point, axis, angle) {
        // 1. Get Object World Position
        const objectWorldPos = new THREE.Vector3();
        object.getWorldPosition(objectWorldPos);
        
        // 2. Rotate Object World Position around Pivot (point)
        objectWorldPos.sub(point); // Vector from pivot to object
        objectWorldPos.applyAxisAngle(axis, angle);
        objectWorldPos.add(point); // New World Position
        
        // 3. Convert back to Local Position
        if (object.parent) {
            object.parent.worldToLocal(objectWorldPos);
        }
        object.position.copy(objectWorldPos);
        
        // 4. Rotate Orientation
        object.rotateOnWorldAxis(axis, angle);

        object.updateMatrix();
        object.updateMatrixWorld(true);
    }

    /**
     * Highlight colliding flanges
     * @param {Set<string>} collidingIds - Set of colliding object IDs (e.g. "Flange_0")
     */
    highlightCollisions(collidingIds) {
        this.flanges.forEach((flange, id) => {
            const name = `Flange_${id}`;
            if (collidingIds.has(name)) {
                flange.setMaterial(this.collisionMaterial);
            } else {
                flange.resetMaterial();
            }
        });
    }

    /**
     * Toggle between steel and colored flanges
     * @param {boolean} enabled - True for colored, False for steel
     */
    setFlangeColors(enabled) {
        this.flanges.forEach((flange, id) => {
            // Find original index for color assignment
            const index = this.blueprint.sheets.findIndex(s => s.id === id);
            const colorMat = this.flangeMaterials[index % this.flangeMaterials.length];
            
            const targetMat = enabled ? colorMat : this.steelMaterial;
            flange.updateOriginalMaterial(targetMat);
        });
    }

    /**
     * Reset the root transform to its initial state.
     * This clears any accumulated symmetry compensation.
     */
    resetRootTransform() {
        if (this._initialRootPosition) {
            this.root.position.copy(this._initialRootPosition);
            this.root.quaternion.copy(this._initialRootQuaternion);
            this.root.scale.copy(this._initialRootScale);
            this.root.updateMatrix();
            this.root.updateMatrixWorld(true);
        }
    }

    /**
     * Fold all hinges and reset root transform
     */
    foldAll() {
        // Reset root transform to clear accumulated compensation
        this.resetRootTransform();

        for (const h of this.hinges.values()) {
            h.fold();
        }
    }

    /**
     * Unfold all hinges
     */
    unfoldAll() {
        for (const h of this.hinges.values()) {
            h.unfold();
        }
    }

    /**
     * Get the bounding box of the part
     */
    getBoundingBox() {
        return new THREE.Box3().setFromObject(this.root);
    }

    /**
     * Get the root Object3D
     */
    getRoot() {
        return this.root;
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        for (const flange of this.flanges.values()) {
            flange.dispose();
        }
        for (const hinge of this.hinges.values()) {
            hinge.dispose();
        }
        for (const material of this.flangeMaterials) {
            material.dispose();
        }
        if (this.steelMaterial) this.steelMaterial.dispose();
        this.collisionMaterial.dispose();
    }
}
