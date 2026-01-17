import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { BaseViewer } from '../core/BaseViewer.js';
import { SheetMetalPart } from './model/SheetMetalPart.js';
import { BendControlPanel } from './ui/BendControlPanel.js';
import { CAMSimulation } from './cam/CAMSimulation.js';
import { CAMPlaybackController } from './cam/CAMPlaybackController.js';

/**
 * Specialized viewer for sheet metal parts with bend controls and CAM simulation.
 * Extends BaseViewer with sheet metal specific functionality.
 */
export class SheetMetalViewer extends BaseViewer {
    constructor(options = {}) {
        super(options);

        this.assetPath = options.assetPath || './simulation_output/';
        this.version = options.version || 'v1.0';
        this.enableCAM = options.enableCAM !== false;

        this.part = null;
        this.partWrapper = null;
        this.bendControlPanel = null;
        this.camSimulation = null;
        this.camPlaybackController = null;

        // Presentation mode: largest flange stays fixed with normal to +Y
        this._presentationFlangeId = undefined;

        // Auto-load if assetPath is provided
        if (options.autoLoad !== false) {
            this.loadPart();
        }

        // Setup PBR Environment for realistic metal rendering
        this._setupEnvironment();
    }

    /**
     * Load a sheet metal part from the configured asset path
     * @param {string} blueprintFile - Name of the blueprint file (default: 'blueprint.json')
     */
    async loadPart(blueprintFile = 'blueprint.json') {
        try {
            // Dispose existing part if any
            if (this.part) {
                this.part.removeFromScene();
                this.part.dispose();
            }

            // Create wrapper for vertical adjustment
            if (!this.partWrapper) {
                this.partWrapper = new THREE.Group();
                this.partWrapper.name = 'PartWrapper';
                this.scene.add(this.partWrapper);
            }

            // Load new part
            this.part = new SheetMetalPart();
            await this.part.load(this.assetPath + blueprintFile);

            // Add to scene (wrapper)
            this.part.addToScene(this.partWrapper);

            // Hinge axes visibility is controlled by the blueprint's showHinges flag
            // (already handled in SheetMetalPart.load based on blueprint.showHinges)

            // Create bend controls
            //this._createBendControls(); // deactive controls 

            // Load CAM simulation if enabled
            if (this.enableCAM) {
                await this._loadCAMSimulation();
            }

            // Fit camera to part
            this.fitToScene(this.part.getRoot());
            this.controls.setSceneCenter(new THREE.Vector3(0, 0, 0));
            this.controls.snap('iso');
            this.camera.zoom *= 0.6;  // Zoom out 20%
            this.camera.updateProjectionMatrix();

            return this.part;
        } catch (error) {
            console.error('Failed to load sheet metal part:', error);
            throw error;
        }
    }

    _createBendControls() {
        // Dispose existing panel
        if (this.bendControlPanel) {
            this.bendControlPanel.dispose();
        }

        // Create new panel
        this.bendControlPanel = new BendControlPanel({
            version: this.version
        });
        this.bendControlPanel.init(this.part);

        // Hook into bend changes to update CAM
        this._hookBendControls();
    }

    _setupEnvironment() {
        if (this.renderer) {
            const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
            this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
            pmremGenerator.dispose();
        }
    }

    /**
     * Hook into bend control changes to synchronize CAM simulation
     */
    _hookBendControls() {
        // Override slider input to also update CAM
        const hingeIds = this.part.getHingeIds();
        hingeIds.forEach(id => {
            const slider = document.getElementById(`bend_${id}`);
            if (slider) {
                const originalHandler = slider.oninput;
                slider.addEventListener('input', () => {
                    this._onBendProgressChanged();
                });
            }
        });
    }

    _onBendProgressChanged() {
        // Update CAM tool positions when bend progress changes
        if (this.camSimulation && this.camSimulation.currentStep > 0) {
            const bendId = this.camSimulation.getBendIdForStep(this.camSimulation.currentStep);
            if (bendId !== null) {
                const hinge = this.part.hinge(bendId);
                if (hinge) {
                    const progress = hinge.getProgress();
                    this.camSimulation.setProgress(progress);
                }
            }
        }
    }

    async _loadCAMSimulation() {
        // Dispose existing
        if (this.camSimulation) {
            this.camSimulation.dispose();
        }
        if (this.camPlaybackController) {
            this.camPlaybackController.dispose();
        }

        // Load CAM simulation
        this.camSimulation = new CAMSimulation();
        await this.camSimulation.load(this.assetPath);

        if (this.camSimulation.isLoaded) {
            // Add to scene
            this.camSimulation.addToScene(this.scene);

            // Create CAM playback controller
            this.camPlaybackController = new CAMPlaybackController();
            this.camPlaybackController.init(this.camSimulation, this.part);

            // Sync bend panel when step changes
            this.camPlaybackController.onStepChange = (stepIdx, stepNumber) => {
                this._onCAMStepChanged(stepIdx);
            };
            
            // Initial alignment - Start at Step 1 to show tools
            if (this.camPlaybackController.steps.length > 0) {
                this.camPlaybackController.goToStep(1);
            } else {
                this._onCAMStepChanged(0);
            }

            // Sync bend sliders when progress changes within a step
            this.camPlaybackController.onProgressChange = (progress) => {
                this._onCAMProgressChanged(progress);
            };

            // Handle tools visibility change - switch between machine and presentation alignment
            this.camPlaybackController.onToolsVisibilityChange = (visible) => {
                this._onToolsVisibilityChanged(visible);
            };

            // Handle state ready - apply presentation alignment after all state setup is complete
            this.camPlaybackController.onStateReady = () => {
                this._onStateReady();
            };

            // Handle presentation mode updates - fix flange position immediately after hinge rotation
            this.camPlaybackController.onPresentationUpdate = () => {
                this._fixLargestFlangeInPlace();
            };

            // Handle presentation mode hinge updates - hide/update/fix/show to prevent flashing
            this.camPlaybackController.onPresentationHingeUpdate = (bendId, progress) => {
                this._updateHingeInPresentationMode(bendId, progress);
            };

            // Handle presentation mode begin/end - remove/add part from scene during batch updates
            // These callbacks handle BATCH operations (like goToStep, _applyFullState).
            // Animation frame updates are handled atomically by _updateHingeInPresentationMode.
            this.camPlaybackController.onPresentationBegin = () => {
                if (this.part) {
                    const root = this.part.getRoot();
                    // Only remove if not already removed
                    if (root.parent) {
                        this._presentationPartParent = root.parent;
                        this._presentationPartParent.remove(root);
                    }
                    // If already removed, _presentationPartParent should still be valid from previous call
                }
            };
            this.camPlaybackController.onPresentationEnd = () => {
                if (this.part) {
                    const root = this.part.getRoot();
                    // Add back if not already added
                    if (!root.parent && this._presentationPartParent) {
                        this._presentationPartParent.add(root);
                    }
                    // Don't clear _presentationPartParent here - it may be needed for subsequent calls
                }
            };

            console.log('[SheetMetalViewer] MATERIAM CAM simulation loaded with playback controls');
        }
    }

    _onCAMProgressChanged(progress) {
        const motionProgress = Math.min(1, progress / 0.6);

        // Update bend slider to match playback progress
        if (this.camSimulation && this.camPlaybackController) {
            const stepNumber = this.camPlaybackController.getCurrentStep();
            if (stepNumber > 0) {
                const steps = this.camSimulation.getStepIndices();
                const stepIdx = steps[stepNumber - 1];
                const step = this.camSimulation.getStep(stepIdx);
                if (step && this.bendControlPanel) {
                    this.bendControlPanel.setSliderValue(step.bendId, motionProgress * 100);
                }
            }
        }

        // In presentation mode, skip machine-specific adjustments
        const inPresentationMode = this.camPlaybackController?.getPresentationMode();

        if (inPresentationMode) {
            // Flange position is fixed by onPresentationUpdate callback
            // Just ensure partWrapper is at y=0
            if (this.partWrapper) {
                this.partWrapper.position.y = 0;
                this.partWrapper.updateMatrix();
            }
        } else {
            // Machine mode: Vertical adjustment: Start (0) = 1*T, End (1) = 2*T
            if (this.partWrapper && this.camSimulation) {
                const thickness = this.camSimulation.getPartThickness();
                this.partWrapper.position.y = thickness * (1 + motionProgress);
                this.partWrapper.updateMatrix();
            }

            // Update Real-time Collisions (machine mode only)
            this._updateCollisions();
        }
    }

    _updateCollisions() {
        if (!this.camSimulation || !this.part) return;

        const stepIndex = this.camSimulation.currentStep;
        const reportedCollisions = this.camSimulation.getCollisions(stepIndex);
        
        // Convert array to Set for processing
        const reportedSet = new Set();
        reportedCollisions.forEach(c => reportedSet.add(c));

        // Filter based on actual visual intersection (OBB)
        const actualSet = this.camSimulation.getActualCollisions(reportedSet, this.part.getRoot());

        this.part.highlightCollisions(actualSet);
        this.camSimulation.highlightCollisions(actualSet);
    }

    _onCAMStepChanged(stepIndex) {
        const step = this.camSimulation.getStep(stepIndex);

        // Check if in presentation mode
        const inPresentationMode = this.camPlaybackController?.getPresentationMode();

        if (inPresentationMode) {
            // In presentation mode, skip machine transforms
            // Presentation alignment will be applied in _onStateReady after all hinges are set up
            return;
        }

        // MACHINE MODE: Update Part Position to match the machine tools
        if (this.part && this.camSimulation) {
            const partTransform = this.camSimulation.getPartTransform(stepIndex);

            // Get the bend ID for this step to check bisector direction
            const bendId = step?.bendId;
            const hinge = bendId !== undefined ? this.part.hinge(bendId) : null;

            // Apply the base transform first
            this.part.getRoot().matrix.copy(partTransform);
            this.part.getRoot().matrix.decompose(
                this.part.getRoot().position,
                this.part.getRoot().quaternion,
                this.part.getRoot().scale
            );
            this.part.getRoot().matrixAutoUpdate = false;

            // Check if bisector needs correction to point DOWN
            if (hinge) {
                // Update world matrices to get accurate bisector world position
                this.part.getRoot().updateWorldMatrix(true, true);

                const bisectorWorld = hinge.getBisectorWorld();

                // If bisector Y is positive (pointing up), flip the part 180° around Z
                // This ensures the bend V always opens downward (toward the die)
                if (bisectorWorld.y > 0.01) {
                    // Create a 180° rotation around Z axis (in world space)
                    const flipZ = new THREE.Matrix4().makeRotationZ(Math.PI);

                    // Pre-multiply to apply flip in world space
                    this.part.getRoot().matrix.premultiply(flipZ);
                    this.part.getRoot().matrix.decompose(
                        this.part.getRoot().position,
                        this.part.getRoot().quaternion,
                        this.part.getRoot().scale
                    );
                }
            }
        }

        // Initial vertical adjustment (Progress 0)
        if (this.partWrapper && this.camSimulation) {
            const thickness = this.camSimulation.getPartThickness();
            this.partWrapper.position.y = thickness;
            this.partWrapper.updateMatrix();
        }

        if (!step) return;

        // Find the bend ID for this step and focus on it
        const bendId = step.bendId;

        // Get current progress for this bend
        const hinge = this.part.hinge(bendId);
        if (hinge) {
            const progress = hinge.getProgress();
            this.camSimulation.setProgress(progress);
        }

        // Handle Collisions (Initial check for step)
        this._updateCollisions();
    }

    /**
     * Clear the current part and CAM simulation from the scene.
     * Used when switching to a different part type (e.g., from simulation to regular GLB).
     */
    clearPart() {
        // Dispose CAM playback controller
        if (this.camPlaybackController) {
            this.camPlaybackController.dispose();
            this.camPlaybackController = null;
        }

        // Dispose CAM simulation
        if (this.camSimulation) {
            this.camSimulation.removeFromScene();
            this.camSimulation.dispose();
            this.camSimulation = null;
        }

        // Dispose bend control panel
        if (this.bendControlPanel) {
            this.bendControlPanel.dispose();
            this.bendControlPanel = null;
        }

        // Dispose part
        if (this.part) {
            this.part.removeFromScene();
            this.part.dispose();
            this.part = null;
        }

        // Remove and clear part wrapper
        if (this.partWrapper) {
            this.scene.remove(this.partWrapper);
            this.partWrapper = null;
        }
    }

    /**
     * Get the loaded sheet metal part
     */
    getPart() {
        return this.part;
    }

    /**
     * Get the bend control panel
     */
    getBendControlPanel() {
        return this.bendControlPanel;
    }

    /**
     * Get the CAM simulation
     */
    getCAMSimulation() {
        return this.camSimulation;
    }

    /**
     * Get the CAM playback controller
     */
    getCAMPlaybackController() {
        return this.camPlaybackController;
    }

    /**
     * Set unfold progress for a specific hinge
     * @param {number} hingeId - The hinge ID
     * @param {number} progress - Progress from 0 (folded) to 1 (unfolded)
     */
    setHingeProgress(hingeId, progress) {
        if (this.part) {
            this.part.setUnfoldProgress(hingeId, progress);

            // Sync slider if panel exists
            if (this.bendControlPanel) {
                this.bendControlPanel.setSliderValue(hingeId, progress * 100);
            }

            // Update CAM if this hinge is the active step's bend
            if (this.camSimulation && this.camSimulation.currentStep > 0) {
                const activeBendId = this.camSimulation.getBendIdForStep(this.camSimulation.currentStep);
                if (activeBendId === hingeId) {
                    this.camSimulation.setProgress(progress);
                }
            }
        }
    }

    /**
     * Fold all hinges
     */
    foldAll() {
        if (this.part) {
            this.part.foldAll();

            // Sync sliders
            if (this.bendControlPanel) {
                this.part.getHingeIds().forEach(id => {
                    this.bendControlPanel.setSliderValue(id, 0);
                });
            }

            // Update CAM - folded = engaged
            if (this.camSimulation) {
                this.camSimulation.setProgress(0);
            }
        }
    }

    /**
     * Unfold all hinges
     */
    unfoldAll() {
        if (this.part) {
            this.part.unfoldAll();

            // Sync sliders
            if (this.bendControlPanel) {
                this.part.getHingeIds().forEach(id => {
                    this.bendControlPanel.setSliderValue(id, 100);
                });
            }

            // Update CAM - unfolded = retracted
            if (this.camSimulation) {
                this.camSimulation.setProgress(1);
            }
        }
    }

    /**
     * Get all hinge IDs
     */
    getHingeIds() {
        return this.part ? this.part.getHingeIds() : [];
    }

    /**
     * Get info for a specific hinge
     */
    getHingeInfo(hingeId) {
        return this.part ? this.part.getHingeInfo(hingeId) : null;
    }

    /**
     * Toggle visibility of hinge axis arrows
     * @param {boolean} visible - Whether to show hinge axes
     */
    setHingeAxesVisible(visible) {
        if (this.part) {
            this.part.setHingeAxesVisible(visible);
        }
    }

    /**
     * Select a CAM simulation step
     */
    selectCAMStep(stepIndex) {
        if (this.camPlaybackController) {
            this.camPlaybackController.goToStep(stepIndex);
        }
    }

    /**
     * Play CAM simulation
     */
    playCAM() {
        if (this.camPlaybackController) {
            this.camPlaybackController.play();
        }
    }

    /**
     * Pause CAM simulation
     */
    pauseCAM() {
        if (this.camPlaybackController) {
            this.camPlaybackController.pause();
        }
    }

    /**
     * Handle tools visibility toggle - switch between machine and presentation alignment
     * @param {boolean} visible - Whether tools are now visible
     */
    _onToolsVisibilityChanged(visible) {
        if (!this.part || !this.camPlaybackController) return;

        const root = this.part.getRoot();

        if (visible) {
            // Tools shown: disable presentation mode, restore machine-based alignment
            this.camPlaybackController.setPresentationMode(false);
            this._presentationFlangeId = undefined;

            // Re-enable matrix auto update on the root
            root.matrixAutoUpdate = true;

            // Re-apply current state with normal compensation
            const currentStep = this.camPlaybackController.getCurrentStep();
            this.camPlaybackController.goToStep(currentStep);
        } else {
            // Tools hidden: enable presentation mode (no compensation, largest flange fixed)
            this.camPlaybackController.setPresentationMode(true);

            // Find and store the largest flange for tracking
            const largestInfo = this._findLargestFlange();
            if (largestInfo) {
                this._presentationFlangeId = largestInfo.id;
            }

            // Store the parent for presentation mode callbacks to use
            // This is critical - callbacks need to know where to re-add the part
            this._presentationPartParent = root.parent;

            // Remove part from scene BEFORE any state changes to prevent flash
            if (this._presentationPartParent) {
                this._presentationPartParent.remove(root);
            }

            // Reset partWrapper position (no machine offset in presentation mode)
            if (this.partWrapper) {
                this.partWrapper.position.y = 0;
                this.partWrapper.updateMatrix();
            }

            // Reset root to identity before setting up state
            root.position.set(0, 0, 0);
            root.quaternion.identity();
            root.scale.set(1, 1, 1);
            root.updateMatrix();
            root.updateMatrixWorld(true);

            // Re-apply the current step state
            // goToStep will use onPresentationBegin/onPresentationEnd callbacks
            // which now have access to _presentationPartParent
            const currentStep = this.camPlaybackController.getCurrentStep();
            this.camPlaybackController.goToStep(currentStep);

            // Fix the flange position (goToStep calls onStateReady which does this,
            // but we do it again to be safe after all setup is complete)
            this._fixLargestFlangeInPlace();

            // Ensure part is visible after all setup
            if (this._presentationPartParent && !root.parent) {
                this._presentationPartParent.add(root);
            }
        }
    }

    /**
     * Called after all state setup is complete (hinges positioned, fold mode unfold done).
     * Used to reset partWrapper position in presentation mode and force root transform.
     */
    _onStateReady() {
        const inPresentationMode = this.camPlaybackController?.getPresentationMode();

        if (inPresentationMode && this._presentationFlangeId !== undefined) {
            // In presentation mode, dynamically fix the largest flange in place
            // This adjusts the root transform so the largest flange stays at origin with normal to +Y
            this._fixLargestFlangeInPlace();

            // Reset vertical wrapper position (no machine offset in presentation mode)
            if (this.partWrapper) {
                this.partWrapper.position.y = 0;
                this.partWrapper.updateMatrix();
            }
        }
    }

    /**
     * Find the flange with the largest area
     * @returns {object|null} { id, flange, area }
     */
    _findLargestFlange() {
        if (!this.part || !this.part.blueprint) return null;

        let largestFlange = null;
        let largestArea = 0;
        let largestId = null;

        // Calculate area for each flange from blueprint data
        for (const sheetData of this.part.blueprint.sheets) {
            const outer = sheetData.outer;
            if (!outer || outer.length < 3) continue;

            // Calculate area using shoelace formula
            let area = 0;
            for (let i = 0; i < outer.length; i++) {
                const j = (i + 1) % outer.length;
                area += outer[i][0] * outer[j][1];
                area -= outer[j][0] * outer[i][1];
            }
            area = Math.abs(area) / 2;

            // Subtract hole areas
            if (sheetData.holes) {
                for (const hole of sheetData.holes) {
                    if (hole.length < 3) continue;
                    let holeArea = 0;
                    for (let i = 0; i < hole.length; i++) {
                        const j = (i + 1) % hole.length;
                        holeArea += hole[i][0] * hole[j][1];
                        holeArea -= hole[j][0] * hole[i][1];
                    }
                    area -= Math.abs(holeArea) / 2;
                }
            }

            if (area > largestArea) {
                largestArea = area;
                largestId = sheetData.id;
                largestFlange = this.part.flanges.get(sheetData.id);
            }
        }

        return largestFlange ? { id: largestId, flange: largestFlange, area: largestArea } : null;
    }

    /**
     * Fix the largest flange in place after hinge rotations.
     * Called during animation in presentation mode.
     *
     * After hinges have rotated, the largest flange has moved from its target position.
     * We need to adjust the ROOT transform to bring the largest flange back to:
     * - Position: origin (0, 0, 0)
     * - Orientation: normal pointing to +Y
     *
     * CRITICAL: This function is called when the part may already be in the scene.
     * We must remove it before modifying transforms to prevent flashing.
     */
    _fixLargestFlangeInPlace() {
        if (!this.part || this._presentationFlangeId === undefined) return;

        const flange = this.part.flanges.get(this._presentationFlangeId);
        if (!flange) return;

        const flangeContainer = flange.getContainer();
        if (!flangeContainer) return;

        const root = this.part.getRoot();

        // Remove from scene before modifying transforms to prevent flash
        const partParent = root.parent;
        if (partParent) {
            partParent.remove(root);
        }

        // 1. Update world matrices so we have accurate current positions
        root.updateMatrixWorld(true);

        // 2. Get the flange's CURRENT world position and orientation
        const currentFlangeWorldQuat = new THREE.Quaternion();
        flangeContainer.getWorldQuaternion(currentFlangeWorldQuat);

        // 3. Compute what the flange's normal is currently pointing at
        // Flange local normal is (0, 0, 1)
        const currentNormalWorld = new THREE.Vector3(0, 0, 1);
        currentNormalWorld.applyQuaternion(currentFlangeWorldQuat).normalize();

        // 4. Compute the rotation needed to align current normal to +Y
        const targetDir = new THREE.Vector3(0, 1, 0);
        const correctionQuat = new THREE.Quaternion();
        correctionQuat.setFromUnitVectors(currentNormalWorld, targetDir);

        // 5. Compute new root quaternion: correction * current root quat
        const newRootQuat = new THREE.Quaternion();
        newRootQuat.multiplyQuaternions(correctionQuat, root.quaternion);

        // 6. Apply rotation first, then compute position offset
        root.quaternion.copy(newRootQuat);
        root.updateMatrix();
        root.updateMatrixWorld(true);

        // Now get flange's new world position after rotation
        const flangeWorldPosAfterRotation = new THREE.Vector3();
        flangeContainer.getWorldPosition(flangeWorldPosAfterRotation);

        // Offset root to center flange at origin
        root.position.sub(flangeWorldPosAfterRotation);

        // Final update
        root.updateMatrix();
        root.updateMatrixWorld(true);

        // Re-add to scene after all transforms are complete
        if (partParent) {
            partParent.add(root);
        }
    }

    /**
     * Update hinge progress in presentation mode with flange fixing.
     *
     * CRITICAL: To prevent flashing, we must:
     * 1. Remove the part from the scene graph BEFORE any transform changes
     * 2. Apply ALL transforms (hinge rotation + root correction)
     * 3. Re-add to scene graph AFTER all transforms are complete
     *
     * This ensures no intermediate state is ever rendered.
     *
     * @param {number} bendId - The bend/hinge ID
     * @param {number} progress - The progress value (0-1)
     */
    _updateHingeInPresentationMode(bendId, progress) {
        if (!this.part || !this.partWrapper) return;
        if (this._presentationFlangeId === undefined) return;

        const flange = this.part.flanges.get(this._presentationFlangeId);
        if (!flange) return;

        const flangeContainer = flange.getContainer();
        if (!flangeContainer) return;

        const root = this.part.getRoot();

        // STEP 1: Remove part from scene graph to prevent rendering intermediate states
        const partParent = root.parent;
        if (partParent) {
            partParent.remove(root);
        }

        // STEP 2: Update hinge without compensation (this will move the flange)
        this.part.setUnfoldProgress(bendId, progress, false);

        // STEP 3: Fix the flange back to its target position (origin with normal to +Y)
        root.updateMatrixWorld(true);

        // Get flange position/orientation after hinge rotation
        const currentFlangeWorldQuat = new THREE.Quaternion();
        flangeContainer.getWorldQuaternion(currentFlangeWorldQuat);

        // Compute flange normal (local Z)
        const currentNormalWorld = new THREE.Vector3(0, 0, 1);
        currentNormalWorld.applyQuaternion(currentFlangeWorldQuat).normalize();

        // We want flange normal to point to +Y
        const targetDir = new THREE.Vector3(0, 1, 0);
        const correctionQuat = new THREE.Quaternion();
        correctionQuat.setFromUnitVectors(currentNormalWorld, targetDir);

        // Apply rotation correction to root
        const newRootQuat = new THREE.Quaternion();
        newRootQuat.multiplyQuaternions(correctionQuat, root.quaternion);
        root.quaternion.copy(newRootQuat);
        root.updateMatrix();
        root.updateMatrixWorld(true);

        // Get flange position after rotation correction
        const flangeWorldPosAfterRotation = new THREE.Vector3();
        flangeContainer.getWorldPosition(flangeWorldPosAfterRotation);

        // Apply position correction to center flange at origin
        root.position.sub(flangeWorldPosAfterRotation);
        root.updateMatrix();
        root.updateMatrixWorld(true);

        // STEP 4: Re-add part to scene graph AFTER all transforms are complete
        if (partParent) {
            partParent.add(root);
        }
    }

    /**
     * Clean up all resources
     */
    dispose() {
        if (this.bendControlPanel) {
            this.bendControlPanel.dispose();
        }

        if (this.camPlaybackController) {
            this.camPlaybackController.dispose();
        }

        if (this.camSimulation) {
            this.camSimulation.dispose();
        }

        if (this.part) {
            this.part.removeFromScene();
            this.part.dispose();
        }

        if (this.partWrapper) {
            this.scene.remove(this.partWrapper);
            this.partWrapper = null;
        }

        if (this.scene.environment) {
            this.scene.environment.dispose();
        }

        super.dispose();
    }
}
