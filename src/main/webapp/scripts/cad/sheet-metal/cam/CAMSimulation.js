import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBB } from 'three/addons/math/OBB.js';

/**
 * CAM Simulation Manager
 * 
 * Manages the bending machine simulation including:
 * - Loading tools.glb (punches, dies, base, curtain)
 * - Loading simulation.json (sequence, transforms, collisions)
 * - Positioning machine elements relative to the bend
 * - Animating tool movement synchronized with bend progress
 * 
 * Machine Stack (bottom to top at origin):
 * - Base (machine table where V-bottoms mount)
 * - Die/V-bottom (positioned at Y=0 surface)
 * - Part (bend line at origin)
 * - Punch (above part)
 * - Curtain (above punch, moves with it)
 */
export class CAMSimulation {
    constructor() {
        this.simulation = null;      // Parsed simulation.json
        this.toolsScene = null;      // Loaded tools.glb scene
        
        // Machine elements (extracted from tools.glb)
        this.base = null;
        this.curtain = null;
        this.punches = new Map();    // stepIndex -> THREE.Object3D
        this.dies = new Map();       // stepIndex -> THREE.Object3D
        
        // Scene container
        this.container = new THREE.Group();
        this.container.name = 'CAMSimulation';
        this.container.rotation.y = 0;
        
        // Current state
        this.currentStep = 0;
        this.isLoaded = false;
        
        // Machine parameters
        this.homeOffset = 300;       // mm above working position
        this.baseOffset = -130;    // Base mount offset below die
        this.curtainBaseOffset = 0; // Curtain mount offset above punch
        
        // Animation state
        this._activePunch = null;
        this._activeDie = null;
    }

    /**
     * Load simulation data from JSON and GLB files
     * @param {string} basePath - Path to simulation_output directory
     * @returns {Promise<CAMSimulation>}
     */
    async load(basePath) {
        if (!basePath.endsWith('/')) basePath += '/';
        
        // Load simulation.json
        const simResponse = await fetch(basePath + 'simulation.json?t=' + Date.now());
        if (!simResponse.ok) {
            console.warn('[CAM] simulation.json not found, CAM features disabled');
            return this;
        }
        this.simulation = await simResponse.json();
        
        // Load tools.glb
        const loader = new GLTFLoader();
        try {
            const gltf = await new Promise((resolve, reject) => {
                loader.load(
                    basePath + 'tools.glb?t=' + Date.now(),
                    resolve,
                    undefined,
                    reject
                );
            });
            this.toolsScene = gltf.scene;
            this._extractToolElements();
            this.isLoaded = true;
            console.log('[CAM] Simulation loaded:', this.simulation.sequence?.length || 0, 'steps');
        } catch (e) {
            console.warn('[CAM] tools.glb not found, CAM features disabled');
            return this;
        }
        
        return this;
    }

    /**
     * Extract named elements from the tools GLB
     */
    _extractToolElements() {
        if (!this.toolsScene) return;
        
        const makeTransparent = (object) => {
            object.traverse((child) => {
                if (child.isMesh) {
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(m => {
                            const mClone = m.clone();
                            mClone.color.setHex(0xADD8E6);
                            mClone.userData.originalColor = mClone.color.clone();
                            mClone.userData.originalOpacity = 0.5;
                            mClone.transparent = true;
                            mClone.opacity = 0.5;
                            return mClone;
                        });
                    } else if (child.material) {
                        const mClone = child.material.clone();
                        mClone.color.setHex(0xADD8E6);
                        mClone.userData.originalColor = mClone.color.clone();
                        mClone.userData.originalOpacity = 0.5;
                        mClone.transparent = true;
                        mClone.opacity = 0.5;
                        child.material = mClone;
                    }
                }
            });
        };
        
        const makeGray = (object) => {
            object.traverse((child) => {
                if (child.isMesh) {
                    const gray = new THREE.MeshStandardMaterial({
                        color: 0x404040,
                        metalness: 0.5,
                        roughness: 0.5
                    });
                    gray.userData.originalColor = gray.color.clone();
                    gray.userData.originalOpacity = 1.0;
                    child.material = gray;
                }
            });
        };
        
        this.toolsScene.traverse((child) => {
            if (!child.name) return;
            
            if (child.name === 'Machine_Base') {
                this.base = child.clone();
                makeGray(this.base);
                this.base.visible = false;
            } else if (child.name === 'Machine_Curtain') {
                this.curtain = child.clone();
                makeGray(this.curtain);
                this.curtain.visible = false;
            } else if (child.name.startsWith('Punch_')) {
                const idx = parseInt(child.name.split('_')[1]);
                if (!isNaN(idx)) {
                    const punch = child.clone();
                    makeTransparent(punch);
                    punch.visible = false;
                    this.punches.set(idx, punch);
                }
            } else if (child.name.startsWith('Die_')) {
                const idx = parseInt(child.name.split('_')[1]);
                if (!isNaN(idx)) {
                    const die = child.clone();
                    makeTransparent(die);
                    die.visible = false;
                    this.dies.set(idx, die);
                }
            }
        });
        
        console.log('[CAM] Extracted:', 
            this.punches.size, 'punches,',
            this.dies.size, 'dies,',
            this.base ? 'base' : 'no base,',
            this.curtain ? 'curtain' : 'no curtain'
        );
    }

    /**
     * Add simulation elements to a scene
     */
    addToScene(scene) {
        scene.add(this.container);
    }

    /**
     * Remove from scene
     */
    removeFromScene() {
        if (this.container.parent) {
            this.container.parent.remove(this.container);
        }
    }

    /**
     * Get the sequence step data
     */
    getStep(stepIndex) {
        if (!this.simulation?.sequence) return null;
        return this.simulation.sequence.find(s => s.stepIndex === stepIndex);
    }

    /**
     * Get all step indices
     */
    getStepIndices() {
        if (!this.simulation?.sequence) return [];
        return this.simulation.sequence.map(s => s.stepIndex);
    }

    /**
     * Get bend IDs for a step
     */
    getBendIdsForStep(stepIndex) {
        const step = this.getStep(stepIndex);
        return step ? (step.bendIds || [step.bendId]) : [];
    }

    /**
     * Set the active step and configure tool visibility/position
     * @param {number} stepIndex - The step to activate (1-based)
     */
    setActiveStep(stepIndex) {
        this.currentStep = stepIndex;
        
        // If step 0 (reset), use step 1 for visualization
        const effectiveStepIndex = (stepIndex === 0) ? 1 : stepIndex;
        const step = this.getStep(effectiveStepIndex);
        
        // Remove all tools from container
        this.container.clear();
        
        this._activePunch = null;
        this._activeDie = null;
        
        if (!step) return;
        
        // Show and position active tools
        let punch = null;
        if (step.punchId) {
            const id = parseInt(step.punchId.split('_')[1]);
            punch = this.punches.get(id);
        }
        
        let die = null;
        if (step.dieId) {
            const id = parseInt(step.dieId.split('_')[1]);
            die = this.dies.get(id);
        }
        
        if (punch) {
            punch.visible = true;
            this.container.add(punch);
            this._activePunch = punch;
        }
        if (die) {
            die.visible = true;
            this.container.add(die);
            this._activeDie = die;
        }
        if (this.base) {
            this.base.visible = true;
            this.container.add(this.base);
        }
        if (this.curtain) {
            this.curtain.visible = true;
            this.container.add(this.curtain);
        }
        
        // Position at home (retracted)
        this.setProgress(0);
    }

    /**
     * Update tool positions based on animation progress
     *
     * Layout concept:
     * - Die surface sits at Y=0 (the bending line)
     * - Base sits below die
     * - Punch tip touches part at Y=0 when engaged
     * - Curtain sits above punch
     *
     * Unfold mode (foldMode=false): progress 0->1
     * - At 0%: Tools are engaged at working position
     * - 0-60%: Punch follows part upward as it unfolds
     * - 60-100%: Punch retracts rapidly to home position
     *
     * Fold mode (foldMode=true): progress 0->1
     * - At 0%: Punch at home position (rapid approach pending)
     * - 0-20%: Rapid approach down to near-part position
     * - 20-80%: Punch follows part downward as it folds
     * - 80-100%: Rapid retract back to home position
     *
     * @param {number} progress - 0-1 animation progress
     * @param {boolean} foldMode - true for fold mode, false for unfold mode
     */
    setProgress(progress, foldMode = false) {
        progress = Math.max(0, Math.min(1, progress));

        // If step 0 (reset), use step 1 for visualization
        const effectiveStepIndex = (this.currentStep === 0) ? 1 : this.currentStep;
        const step = this.getStep(effectiveStepIndex);
        if (!step) return;

        // Parse tool placement transform
        const toolMatrix = new THREE.Matrix4();
        if (step.toolPlacementTransform) {
            toolMatrix.fromArray(step.toolPlacementTransform);
        }

        const thickness = this.getPartThickness();
        let retractY = 0;

        if (foldMode) {
            // Fold mode: rapid approach → follow part → rapid retract
            // Part motion happens during 0-60% (same as unfold mode)
            // So punch should: rapid approach during 0-10%, follow part 10-60%, retract 60-100%
            const rapidApproachEnd = 0.1;    // End of rapid approach (quick 10%)
            const partMotionEnd = 0.6;        // End of part-following motion (matches part folding)

            if (progress < rapidApproachEnd) {
                // Rapid approach: home → near-part position (thickness * 2)
                const t = progress / rapidApproachEnd;
                retractY = this.homeOffset + t * (thickness * 2 - this.homeOffset);
            } else if (progress < partMotionEnd) {
                // Follow part: thickness * 2 → thickness * 1 (punch moves down with folding part)
                const t = (progress - rapidApproachEnd) / (partMotionEnd - rapidApproachEnd);
                retractY = thickness * 2 + t * (thickness * 1 - thickness * 2);
            } else {
                // Rapid retract: thickness * 1 → home
                const t = (progress - partMotionEnd) / (1 - partMotionEnd);
                retractY = thickness * 1 + t * (this.homeOffset - thickness * 1);
            }
        } else {
            // Unfold mode: engaged → follow part → rapid retract
            const retractStart = 0.6; // Start retracting at 60% progress

            if (progress < retractStart) {
                const motionProgress = progress / retractStart;
                retractY = thickness * (1 + motionProgress);
            } else {
                const yAtStart = thickness * 2;
                const t = (progress - retractStart) / (1 - retractStart);
                retractY = yAtStart + t * (this.homeOffset - yAtStart);
            }
        }
        
        // Position Die (Fixed at tool placement)
        if (this._activeDie) {
            this._activeDie.matrix.copy(toolMatrix);
            this._activeDie.matrixAutoUpdate = false;
        }
        
        // Position Punch (above part, retracts upward)
        if (this._activePunch) {
            const punchMatrix = toolMatrix.clone();
            const retractMatrix = new THREE.Matrix4().makeTranslation(0, retractY, 0);
            punchMatrix.multiply(retractMatrix);
            this._activePunch.matrix.copy(punchMatrix);
            this._activePunch.matrixAutoUpdate = false;
        }
        
        // Position Base (below die)
        if (this.base) {
            const baseMatrix = toolMatrix.clone();
            const baseOffsetMatrix = new THREE.Matrix4().makeTranslation(0, this.baseOffset, 0);
            baseMatrix.multiply(baseOffsetMatrix);
            this.base.matrix.copy(baseMatrix);
            this.base.matrixAutoUpdate = false;
        }
        
        // Position Curtain (above punch, retracts with it)
        if (this.curtain && step.curtainOffset !== undefined) {
            const curtainY = step.curtainOffset + this.curtainBaseOffset + retractY;
            const curtainMatrix = toolMatrix.clone();
            const curtainOffsetMatrix = new THREE.Matrix4().makeTranslation(0, curtainY, 0);
            curtainMatrix.multiply(curtainOffsetMatrix);
            this.curtain.matrix.copy(curtainMatrix);
            this.curtain.matrixAutoUpdate = false;
        }
    }

    /**
     * Get the transform matrix for the part to align with the tools
     * @param {number} stepIndex
     * @returns {THREE.Matrix4}
     */
    getPartTransform(stepIndex) {
        const effectiveStepIndex = (stepIndex === 0) ? 1 : stepIndex;
        const step = this.getStep(effectiveStepIndex);
        const matrix = new THREE.Matrix4();
        
        if (step && step.partWorldTransform) {
            matrix.fromArray(step.partWorldTransform);
        }
        
        return matrix;
    }

    /**
     * Check which of the reported colliding objects are actually intersecting visually
     * Uses Oriented Bounding Boxes (OBB) for tight mesh-to-mesh checking.
     * 
     * @param {Set<string>} reportedIds - IDs from simulation.json (candidates)
     * @param {THREE.Object3D} partRoot - Root of the sheet metal part
     * @returns {Set<string>} - Subset of IDs that are actually intersecting
     */
    getActualCollisions(reportedIds, partRoot) {
        const actualCollisions = new Set();
        if (!reportedIds || reportedIds.size === 0 || !partRoot) return actualCollisions;

        // 1. Collect Meshes for Candidates
        const toolMap = new Map(); // ID -> Mesh[]
        const partMap = new Map(); // ID -> Mesh[]

        const collectMeshes = (root, id, map) => {
            if (!root) return;
            const meshes = [];
            root.traverse(c => {
                if (c.isMesh) meshes.push(c);
            });
            if (meshes.length > 0) map.set(id, meshes);
        };

        reportedIds.forEach(id => {
            if (id.startsWith('Punch_') && this._activePunch && this._activePunch.name === id) {
                collectMeshes(this._activePunch, id, toolMap);
            } else if (id.startsWith('Die_') && this._activeDie && this._activeDie.name === id) {
                collectMeshes(this._activeDie, id, toolMap);
            } else if (id === 'Machine_Base' && this.base) {
                collectMeshes(this.base, id, toolMap);
            } else if (id === 'Machine_Curtain' && this.curtain) {
                collectMeshes(this.curtain, id, toolMap);
            } else if (id.startsWith('Flange_')) {
                const flange = partRoot.getObjectByName(id);
                if (flange) collectMeshes(flange, id, partMap);
            }
        });

        // Helper: Check intersection between two lists of meshes
        const checkIntersection = (meshesA, meshesB) => {
            for (const mA of meshesA) {
                if (!mA.geometry.boundingBox) mA.geometry.computeBoundingBox();
                const obbA = new OBB().fromBox3(mA.geometry.boundingBox);
                obbA.applyMatrix4(mA.matrixWorld);

                for (const mB of meshesB) {
                    if (!mB.geometry.boundingBox) mB.geometry.computeBoundingBox();
                    const obbB = new OBB().fromBox3(mB.geometry.boundingBox);
                    obbB.applyMatrix4(mB.matrixWorld);

                    if (obbA.intersectsOBB(obbB)) return true;
                }
            }
            return false;
        };

        // 2. Check Tool vs Part
        toolMap.forEach((toolMeshes, toolId) => {
            let toolHit = false;
            partMap.forEach((partMeshes, partId) => {
                if (checkIntersection(toolMeshes, partMeshes)) {
                    actualCollisions.add(toolId);
                    actualCollisions.add(partId);
                    toolHit = true;
                }
            });
        });

        // 3. Check Part vs Part (Self Collision)
        // Only if both are in the reported list
        const partIds = Array.from(partMap.keys());
        for (let i = 0; i < partIds.length; i++) {
            for (let j = i + 1; j < partIds.length; j++) {
                const idA = partIds[i];
                const idB = partIds[j];
                if (checkIntersection(partMap.get(idA), partMap.get(idB))) {
                    actualCollisions.add(idA);
                    actualCollisions.add(idB);
                }
            }
        }

        return actualCollisions;
    }

    /**
     * Highlight colliding tools
     * @param {Set<string>} collidingIds - Set of colliding object IDs
     */
    highlightCollisions(collidingIds) {
        const updateObject = (object, name) => {
            if (!object) return;
            const isColliding = collidingIds.has(name);
            
            object.traverse((child) => {
                if (child.isMesh) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(m => {
                        if (isColliding) {
                            m.color.setHex(0xff0000);
                            m.opacity = 0.8;
                        } else {
                            if (m.userData.originalColor) m.color.copy(m.userData.originalColor);
                            else m.color.setHex(0xffffff);
                            
                            if (m.userData.originalOpacity !== undefined) {
                                m.opacity = m.userData.originalOpacity;
                            } else {
                                m.opacity = 0.5;
                            }
                        }
                    });
                }
            });
        };

        updateObject(this._activePunch, this._activePunch?.name);
        updateObject(this._activeDie, this._activeDie?.name);
        updateObject(this.base, 'Machine_Base');
        updateObject(this.curtain, 'Machine_Curtain');
    }

    /**
     * Get collision information for a step
     */
    getCollisions(stepIndex) {
        const step = this.getStep(stepIndex);
        return step?.collisions || [];
    }

    /**
     * Check if a step has collisions
     */
    hasCollisions(stepIndex) {
        return this.getCollisions(stepIndex).length > 0;
    }

    /**
     * Set visibility of all tools and machine parts
     * @param {boolean} visible - Whether tools should be visible
     */
    setToolsVisible(visible) {
        this.container.visible = visible;
    }

    /**
     * Get current tools visibility
     * @returns {boolean}
     */
    getToolsVisible() {
        return this.container.visible;
    }

    /**
     * Get the hierarchy data
     */
    getHierarchy() {
        return this.simulation?.hierarchy || [];
    }

    /**
     * Get part thickness
     */
    getPartThickness() {
        return this.simulation?.partThickness || 1.0;
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        this.punches.forEach(p => {
            p.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        this.dies.forEach(d => {
            d.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        
        this.removeFromScene();
        this.punches.clear();
        this.dies.clear();
        this.base = null;
        this.curtain = null;
        this.simulation = null;
        this.isLoaded = false;
    }
}
