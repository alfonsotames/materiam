import { UIPanel } from '../../core/ui/UIPanel.js';

/**
 * Control panel for CAM simulation.
 * Provides step selection and displays collision information.
 */
export class CAMControlPanel extends UIPanel {
    constructor(options = {}) {
        super({
            id: 'cam-control-panel',
            title: 'CAM Simulation',
            position: { top: '20px', left: '320px' },
            width: '260px',
            ...options
        });

        this.camSimulation = null;
        this.sheetMetalPart = null;
        this.onStepChange = null;  // Callback when step changes
    }

    /**
     * Initialize with CAM simulation and part reference
     */
    init(camSimulation, sheetMetalPart) {
        this.camSimulation = camSimulation;
        this.sheetMetalPart = sheetMetalPart;
        
        if (!camSimulation.isLoaded) {
            console.log('[CAM UI] No simulation data, panel hidden');
            return this;
        }
        
        this.create();
        this._buildUI();
        this._attachEventListeners();
        return this;
    }

    _buildUI() {
        const steps = this.camSimulation.getStepIndices();
        
        if (steps.length === 0) {
            this.setContent('<p style="color: #888;">No simulation data</p>');
            return;
        }

        let html = `
            <h3 style="margin:0 0 15px 0; color:#fff;">
                CAM Simulation
                <span style="font-size: 11px; color: #888; font-weight: normal;">
                    (${steps.length} steps)
                </span>
            </h3>
        `;

        // Step selector
        html += `
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; color: #aaa;">Active Step</label>
                <select id="cam-step-select" style="
                    width: 100%;
                    padding: 8px;
                    background: #3a3a40;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 4px;
                    color: white;
                    font-size: 13px;
                    cursor: pointer;
                ">
                    <option value="0">-- Select Step --</option>
        `;
        
        steps.forEach(idx => {
            const step = this.camSimulation.getStep(idx);
            const hasCollision = this.camSimulation.hasCollisions(idx);
            const collisionIcon = hasCollision ? ' ⚠️' : '';
            html += `<option value="${idx}">Step ${idx}: Bend ${step.bendId}${collisionIcon}</option>`;
        });
        
        html += `
                </select>
            </div>
        `;

        // Step info display
        html += `
            <div id="cam-step-info" style="
                background: rgba(0,0,0,0.3);
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 15px;
                min-height: 80px;
            ">
                <p style="color: #666; margin: 0;">Select a step to view details</p>
            </div>
        `;

        // Collision warning area
        html += `
            <div id="cam-collision-warning" style="display: none;">
            </div>
        `;

        // Show/Hide tools toggle
        html += `
            <div style="margin-top: 10px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: #aaa;">
                    <input type="checkbox" id="cam-show-tools" checked style="
                        width: 16px;
                        height: 16px;
                        cursor: pointer;
                    ">
                    Show Tools & Machine
                </label>
            </div>
        `;

        this.setContent(html);
    }

    _attachEventListeners() {
        const stepSelect = document.getElementById('cam-step-select');
        const showToolsCheckbox = document.getElementById('cam-show-tools');

        if (stepSelect) {
            stepSelect.addEventListener('change', (e) => {
                const stepIndex = parseInt(e.target.value);
                this._onStepSelected(stepIndex);
            });
        }

        if (showToolsCheckbox) {
            showToolsCheckbox.addEventListener('change', (e) => {
                this._setToolsVisible(e.target.checked);
            });
        }
    }

    _onStepSelected(stepIndex) {
        if (stepIndex === 0) {
            this._clearStepInfo();
            this.camSimulation.setActiveStep(0);
            return;
        }

        this.camSimulation.setActiveStep(stepIndex);
        this._updateStepInfo(stepIndex);

        // Notify callback
        if (this.onStepChange) {
            this.onStepChange(stepIndex);
        }
    }

    _updateStepInfo(stepIndex) {
        const step = this.camSimulation.getStep(stepIndex);
        if (!step) return;

        const infoDiv = document.getElementById('cam-step-info');
        const warningDiv = document.getElementById('cam-collision-warning');
        
        if (infoDiv) {
            const angleDeg = (step.angle * 180 / Math.PI).toFixed(1);
            infoDiv.innerHTML = `
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; color: #ccc;">
                    <span style="color: #888;">Bend ID:</span>
                    <span>${step.bendId}</span>
                    <span style="color: #888;">Angle:</span>
                    <span>${angleDeg}°</span>
                    <span style="color: #888;">Punch:</span>
                    <span>${step.punchId}</span>
                    <span style="color: #888;">Die:</span>
                    <span>${step.dieId}</span>
                </div>
            `;
        }

        if (warningDiv) {
            const collisions = this.camSimulation.getCollisions(stepIndex);
            if (collisions.length > 0) {
                warningDiv.style.display = 'block';
                warningDiv.innerHTML = `
                    <div style="
                        background: rgba(255, 60, 60, 0.15);
                        border: 1px solid rgba(255, 60, 60, 0.3);
                        border-radius: 6px;
                        padding: 10px;
                        margin-top: 10px;
                    ">
                        <div style="color: #ff6b6b; font-weight: 600; margin-bottom: 6px;">
                            ⚠️ Collision Detected
                        </div>
                        <div style="color: #ffaaaa; font-size: 12px;">
                            ${collisions.join(' ↔ ')}
                        </div>
                    </div>
                `;
            } else {
                warningDiv.style.display = 'none';
            }
        }
    }

    _clearStepInfo() {
        const infoDiv = document.getElementById('cam-step-info');
        const warningDiv = document.getElementById('cam-collision-warning');
        
        if (infoDiv) {
            infoDiv.innerHTML = '<p style="color: #666; margin: 0;">Select a step to view details</p>';
        }
        if (warningDiv) {
            warningDiv.style.display = 'none';
        }
    }

    _setToolsVisible(visible) {
        if (this.camSimulation?.container) {
            this.camSimulation.container.visible = visible;
        }
    }

    /**
     * Update the panel to reflect current progress
     */
    updateProgress(progress) {
        if (this.camSimulation) {
            this.camSimulation.setProgress(progress);
        }
    }

    /**
     * Programmatically select a step
     */
    selectStep(stepIndex) {
        const stepSelect = document.getElementById('cam-step-select');
        if (stepSelect) {
            stepSelect.value = stepIndex;
            this._onStepSelected(stepIndex);
        }
    }

    /**
     * Clean up
     */
    dispose() {
        super.dispose();
    }
}
