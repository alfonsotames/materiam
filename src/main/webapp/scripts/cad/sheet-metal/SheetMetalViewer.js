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

        // Vertical adjustment: Start (0) = 1*T, End (1) = 2*T
        if (this.partWrapper && this.camSimulation) {
            const thickness = this.camSimulation.getPartThickness();
            this.partWrapper.position.y = thickness * (1 + motionProgress);
            this.partWrapper.updateMatrix();
        }

        // Update Real-time Collisions
        this._updateCollisions();
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

        // Update Part Position to match the machine tools
        if (this.part && this.camSimulation) {
            const partTransform = this.camSimulation.getPartTransform(stepIndex);

            this.part.getRoot().matrix.copy(partTransform);
            // Decompose matrix to update position/quaternion/scale properties
            this.part.getRoot().matrix.decompose(
                this.part.getRoot().position,
                this.part.getRoot().quaternion,
                this.part.getRoot().scale
            );
            this.part.getRoot().matrixAutoUpdate = false;
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
