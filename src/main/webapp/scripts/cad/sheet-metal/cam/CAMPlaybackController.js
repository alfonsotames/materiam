/**
 * Playback controller for CAM bend simulation.
 * Provides play/pause, step forward/back, and timeline scrubbing.
 */
export class CAMPlaybackController {
    constructor(options = {}) {
        this.container = null;
        this.options = {
            position: { bottom: '20px', left: '50%' },
            ...options
        };

        // References
        this.camSimulation = null;
        this.sheetMetalPart = null;

        // Playback state
        this.currentStepIndex = 0;  // 0 = no step selected
        this.steps = [];
        this.isPlaying = false;
        this.playbackSpeed = 4.0;   // seconds per step (0.25x default)
        this._playInterval = null;
        this._animationFrame = null;
        
        // Animation within a step (0-1 progress)
        this._stepProgress = 0;
        this._animating = false;
        this._colorsEnabled = false;
        this._toolsVisible = true;  // Tools are visible by default
        this._unfoldMode = false;  // true = start folded, unfold; false = start flat, fold
        this._presentationMode = false;  // When true, no symmetry compensation (base flange stays fixed)

        // Callbacks
        this.onStepChange = null;
        this.onProgressChange = null;
        this.onToolsVisibilityChange = null;
        this.onStateReady = null;  // Called after all state setup is complete (including fold mode hinge unfold)
        this.onPresentationUpdate = null;  // Called immediately after hinge update in presentation mode
        this.onPresentationHingeUpdate = null;  // Called to update hinge in presentation mode (bendId, progress) => void
        this.onPresentationBegin = null;  // Called before batch hinge updates in presentation mode (hide part)
        this.onPresentationEnd = null;  // Called after batch hinge updates in presentation mode (show part)
    }

    /**
     * Check if tools are currently visible
     * @returns {boolean}
     */
    getToolsVisible() {
        return this._toolsVisible;
    }

    /**
     * Set presentation mode (no symmetry compensation, base flange stays fixed)
     * @param {boolean} enabled - Whether presentation mode is enabled
     */
    setPresentationMode(enabled) {
        this._presentationMode = enabled;
    }

    /**
     * Check if presentation mode is enabled
     * @returns {boolean}
     */
    getPresentationMode() {
        return this._presentationMode;
    }

    /**
     * Initialize the controller
     */
    init(camSimulation, sheetMetalPart) {
        this.camSimulation = camSimulation;
        this.sheetMetalPart = sheetMetalPart;

        if (!camSimulation?.isLoaded) {
            console.log('[CAM Playback] No simulation data');
            return this;
        }

        this.steps = camSimulation.getStepIndices();
        if (this.steps.length === 0) {
            return this;
        }

        this._createUI();
        this._attachEventListeners();
        this._updateDisplay();

        return this;
    }

    _createUI() {
        // Remove existing
        this.dispose();

        this.container = document.createElement('div');
        this.container.id = 'cam-playback-controller';
        this.container.style.cssText = `
            position: fixed;
            bottom: ${this.options.position.bottom};
            left: ${this.options.position.left};
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(4px);
            padding: 10px 16px;
            border-radius: 5px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #b0b0b0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 11px;
            z-index: 100;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
            min-width: 320px;
        `;

        this.container.innerHTML = `
            <!-- Step indicator -->
            <div style="text-align: center; margin-bottom: 8px;">
                <span id="cam-step-label" style="font-size: 11px; font-weight: 500; color: #ddd;">
                    Step 0 / ${this.steps.length}
                </span>
                <span id="cam-bend-label" style="margin-left: 8px; color: #666; font-size: 10px;">
                    No bend selected
                </span>
            </div>

            <!-- Timeline -->
            <div style="margin-bottom: 10px;">
                <div id="cam-timeline" style="
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    padding: 4px 0;
                ">
                    ${this._createTimelineSteps()}
                </div>

                <!-- Progress within step -->
                <div style="margin-top: 6px;">
                    <input type="range" id="cam-progress-slider"
                        min="0" max="100" value="0"
                        style="width: 100%; cursor: pointer; height: 4px;"
                    >
                </div>
            </div>

            <!-- Control buttons -->
            <div style="display: flex; justify-content: center; align-items: center; gap: 4px;">
                <!-- Step back -->
                <button id="cam-btn-first" class="cam-ctrl-btn" title="First Step">⏮︎</button>
                <button id="cam-btn-prev" class="cam-ctrl-btn" title="Previous Step">⏪︎</button>

                <!-- Play/Pause -->
                <button id="cam-btn-play" class="cam-ctrl-btn cam-ctrl-btn-primary" title="Play">
                    <span id="cam-icon-play">▶</span>
                    <span id="cam-icon-pause" style="display: none;">⏸</span>
                </button>

                <!-- Step forward -->
                <button id="cam-btn-next" class="cam-ctrl-btn" title="Next Step">⏩︎</button>
                <button id="cam-btn-last" class="cam-ctrl-btn" title="Last Step">⏭︎</button>

                <!-- Color Toggle -->
                <button id="cam-btn-colors" class="cam-ctrl-btn" title="Toggle Flange Colors">🎨</button>

                <!-- Tools Toggle -->
                <button id="cam-btn-tools" class="cam-ctrl-btn" title="Toggle Tools/Machine Parts" style="color: #4a9eff;">🔧</button>

                <!-- Divider -->
                <div style="width: 1px; height: 18px; background: rgba(255,255,255,0.1); margin: 0 4px;"></div>

                <!-- Speed control -->
                <select id="cam-speed-select" style="
                    background: #1a1a1e;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 3px;
                    color: #999;
                    padding: 2px 4px;
                    font-size: 10px;
                    cursor: pointer;
                ">
                    <option value="0.25" selected>0.25x</option>
                    <option value="0.5">0.5x</option>
                    <option value="1">1x</option>
                    <option value="2">2x</option>
                </select>

                <!-- Divider -->
                <div style="width: 1px; height: 18px; background: rgba(255,255,255,0.1); margin: 0 4px;"></div>

                <!-- Fold/Unfold Toggle -->
                <div id="cam-mode-toggle" style="
                    display: flex;
                    background: #1a1a1e;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 4px;
                    overflow: hidden;
                ">
                    <button id="cam-btn-unfold" class="cam-mode-btn" title="Unfold mode: Start folded, unfold to flat">
                        Unfold
                    </button>
                    <button id="cam-btn-fold" class="cam-mode-btn active" title="Fold mode: Start flat, fold to shape">
                        Fold
                    </button>
                </div>
            </div>

            <!-- Collision indicator -->
            <div id="cam-collision-indicator" style="
                display: none;
                margin-top: 8px;
                padding: 4px 8px;
                background: rgba(255, 60, 60, 0.1);
                border: 1px solid rgba(255, 60, 60, 0.2);
                border-radius: 4px;
                text-align: center;
                font-size: 10px;
            ">
                <span style="color: #ff6b6b;">Collision at this step</span>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .cam-ctrl-btn {
                background: #1a1a1e;
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 3px;
                color: #aaa;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.15s ease;
                font-size: 14px;
            }
            .cam-ctrl-btn:hover {
                background: #2a2a30;
                color: #ddd;
            }
            .cam-ctrl-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
            .cam-ctrl-btn-primary {
                background: #2563a8;
                width: 28px;
                height: 28px;
                color: #eee;
                font-size: 12px;
            }
            .cam-ctrl-btn-primary:hover {
                background: #3074b9;
            }
            .cam-timeline-step {
                flex: 1;
                height: 5px;
                background: #1a1a1e;
                border-radius: 2px;
                cursor: pointer;
                transition: all 0.15s ease;
                position: relative;
            }
            .cam-timeline-step:hover {
                background: #2a2a30;
            }
            .cam-timeline-step.active {
                background: #2563a8;
            }
            .cam-timeline-step.completed {
                background: #1e5a32;
            }
            .cam-timeline-step.collision {
                border: 1px solid #cc4444;
            }
            .cam-timeline-step::after {
                content: attr(data-step);
                position: absolute;
                bottom: -14px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 9px;
                color: #555;
            }
            .cam-mode-btn {
                background: transparent;
                border: none;
                color: #666;
                padding: 3px 8px;
                font-size: 10px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s ease;
            }
            .cam-mode-btn:hover {
                color: #999;
            }
            .cam-mode-btn.active {
                background: rgba(37, 99, 168, 0.3);
                color: #5a9ed8;
            }
        `;
        document.head.appendChild(style);
        this._styleElement = style;

        document.body.appendChild(this.container);

        // Add version label at bottom right
        this._versionLabel = document.createElement('div');
        this._versionLabel.id = 'cam-version-label';
        this._versionLabel.textContent = 'MATERIAM CAM v0.1';
        this._versionLabel.style.cssText = `
            position: fixed;
            bottom: 8px;
            right: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 9px;
            color: rgba(255, 255, 255, 0.25);
            z-index: 50;
            pointer-events: none;
            user-select: none;
        `;
        document.body.appendChild(this._versionLabel);
    }

    _createTimelineSteps() {
        return this.steps.map((stepIdx, i) => {
            const hasCollision = this.camSimulation.hasCollisions(stepIdx);
            const collisionClass = hasCollision ? 'collision' : '';
            return `<div class="cam-timeline-step ${collisionClass}" 
                        data-step="${stepIdx}" 
                        data-index="${i}"></div>`;
        }).join('');
    }

    _attachEventListeners() {
        // Play/Pause
        const playBtn = document.getElementById('cam-btn-play');
        playBtn?.addEventListener('click', () => this.togglePlay());

        // Navigation
        document.getElementById('cam-btn-first')?.addEventListener('click', () => this.goToStep(1));
        document.getElementById('cam-btn-prev')?.addEventListener('click', () => this.previousStep());
        document.getElementById('cam-btn-next')?.addEventListener('click', () => this.nextStep());
        document.getElementById('cam-btn-last')?.addEventListener('click', () => this.goToStep(this.steps.length));

        // Timeline clicks
        document.querySelectorAll('.cam-timeline-step').forEach(el => {
            el.addEventListener('click', () => {
                const index = parseInt(el.dataset.index);
                this.goToStep(index + 1);
            });
        });

        // Color toggle
        const colorBtn = document.getElementById('cam-btn-colors');
        colorBtn?.addEventListener('click', () => {
            this._colorsEnabled = !this._colorsEnabled;
            if (this.sheetMetalPart) {
                this.sheetMetalPart.setFlangeColors(this._colorsEnabled);
            }
            colorBtn.style.color = this._colorsEnabled ? '#4a9eff' : '#ccc';
        });

        // Tools toggle
        const toolsBtn = document.getElementById('cam-btn-tools');
        toolsBtn?.addEventListener('click', () => {
            this._toolsVisible = !this._toolsVisible;
            if (this.camSimulation) {
                this.camSimulation.setToolsVisible(this._toolsVisible);
            }
            toolsBtn.style.color = this._toolsVisible ? '#4a9eff' : '#ccc';

            // Notify listener about tools visibility change
            if (this.onToolsVisibilityChange) {
                this.onToolsVisibilityChange(this._toolsVisible);
            }
        });

        // Progress slider
        const progressSlider = document.getElementById('cam-progress-slider');
        progressSlider?.addEventListener('input', (e) => {
            const progress = parseFloat(e.target.value) / 100;
            this._setStepProgress(progress);
        });

        // Speed control
        const speedSelect = document.getElementById('cam-speed-select');
        speedSelect?.addEventListener('change', (e) => {
            this.playbackSpeed = 1 / parseFloat(e.target.value);
        });

        // Fold/Unfold mode toggle
        const unfoldBtn = document.getElementById('cam-btn-unfold');
        const foldBtn = document.getElementById('cam-btn-fold');

        unfoldBtn?.addEventListener('click', () => {
            if (!this._unfoldMode) {
                this._unfoldMode = true;
                this._updateModeButtons();
                this._resetTimeline();
                this.goToStep(1);
            }
        });

        foldBtn?.addEventListener('click', () => {
            if (this._unfoldMode) {
                this._unfoldMode = false;
                this._updateModeButtons();
                this._resetTimeline();
                this.goToStep(1);
            }
        });

        // Keyboard shortcuts
        this._keyHandler = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousStep();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextStep();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goToStep(1);
                    break;
                case 'End':
                    e.preventDefault();
                    this.goToStep(this.steps.length);
                    break;
                case 'a':
                case 'A':
                    e.preventDefault();
                    // Animate all bends simultaneously
                    this.playAllBendsSimultaneously();
                    break;
            }
        };
        document.addEventListener('keydown', this._keyHandler, true);
    }

    _updateDisplay() {
        // Get actual step index for the current display step
        const actualStep = this._getActualStepIndex(this.currentStepIndex);

        // Step label - always shows display step (1, 2, 3... going forward)
        const stepLabel = document.getElementById('cam-step-label');
        const bendLabel = document.getElementById('cam-bend-label');

        if (stepLabel) {
            stepLabel.textContent = `Step ${this.currentStepIndex} / ${this.steps.length}`;
        }

        if (bendLabel) {
            if (actualStep > 0 && actualStep <= this.steps.length) {
                const stepIdx = this.steps[actualStep - 1];
                const step = this.camSimulation.getStep(stepIdx);
                bendLabel.textContent = step ? `Bend ${step.bendId}` : '';
            } else {
                bendLabel.textContent = 'No bend selected';
            }
        }

        // Timeline highlighting - always based on display step (forward progression)
        document.querySelectorAll('.cam-timeline-step').forEach((el, i) => {
            el.classList.remove('active', 'completed');

            const stepNum = i + 1;  // 1-indexed display step
            if (stepNum < this.currentStepIndex) {
                el.classList.add('completed');
            } else if (stepNum === this.currentStepIndex) {
                el.classList.add('active');
            }
        });

        // Collision indicator - based on actual step
        const collisionIndicator = document.getElementById('cam-collision-indicator');
        if (collisionIndicator) {
            if (actualStep > 0 && actualStep <= this.steps.length) {
                const stepIdx = this.steps[actualStep - 1];
                const hasCollision = this.camSimulation.hasCollisions(stepIdx);
                collisionIndicator.style.display = hasCollision ? 'block' : 'none';
            } else {
                collisionIndicator.style.display = 'none';
            }
        }

        // Update button states
        const prevBtn = document.getElementById('cam-btn-prev');
        const firstBtn = document.getElementById('cam-btn-first');
        const nextBtn = document.getElementById('cam-btn-next');
        const lastBtn = document.getElementById('cam-btn-last');

        if (prevBtn) prevBtn.disabled = this.currentStepIndex <= 0;
        if (firstBtn) firstBtn.disabled = this.currentStepIndex <= 0;
        if (nextBtn) nextBtn.disabled = this.currentStepIndex >= this.steps.length;
        if (lastBtn) lastBtn.disabled = this.currentStepIndex >= this.steps.length;

        // Play/Pause icon
        const playIcon = document.getElementById('cam-icon-play');
        const pauseIcon = document.getElementById('cam-icon-pause');
        if (playIcon && pauseIcon) {
            playIcon.style.display = this.isPlaying ? 'none' : 'block';
            pauseIcon.style.display = this.isPlaying ? 'block' : 'none';
        }
    }

    /**
     * Get the actual step index (into this.steps array) for a given display step number.
     * Timeline always progresses forward (1, 2, 3...).
     * In Fold mode, step 1 corresponds to the LAST unfold step, step 2 to second-to-last, etc.
     * @param {number} displayStep - 1-indexed step number as shown to user
     * @returns {number} - 1-indexed step number in actual array order
     */
    _getActualStepIndex(displayStep) {
        if (this._unfoldMode) {
            return displayStep;
        } else {
            // Fold: step 1 maps to last step, step 2 to second-to-last, etc.
            return this.steps.length - displayStep + 1;
        }
    }

    /**
     * Update the fold/unfold mode button states
     */
    _updateModeButtons() {
        const unfoldBtn = document.getElementById('cam-btn-unfold');
        const foldBtn = document.getElementById('cam-btn-fold');

        if (unfoldBtn) {
            unfoldBtn.classList.toggle('active', this._unfoldMode);
        }
        if (foldBtn) {
            foldBtn.classList.toggle('active', !this._unfoldMode);
        }
    }

    /**
     * Reset the timeline and part state when mode changes
     */
    _resetTimeline() {
        this.stop();
        this.currentStepIndex = 0;
        this._stepProgress = 0;

        // Set initial state based on mode
        // In presentation mode, don't reset root transform
        const shouldResetRoot = !this._presentationMode;
        if (this._unfoldMode) {
            // Unfold starts with everything folded
            this.sheetMetalPart.foldAll(shouldResetRoot);
        } else {
            // Fold starts with everything unfolded
            // Instead of rebuilding from scratch, just unfold all hinges
            // while keeping the current root transform if already unfolded,
            // or build it properly if coming from folded state

            // Check if we're already at a fully unfolded state (e.g., coming from end of unfold mode)
            // by checking if all hinges are at progress 1
            let allUnfolded = true;
            for (const [, hinge] of this.sheetMetalPart.hinges) {
                if (hinge.getProgress() < 0.99) {
                    allUnfolded = false;
                    break;
                }
            }

            if (!allUnfolded) {
                // Need to rebuild the state
                this._unfoldAllWithCompensation();
            }
            // If already unfolded, keep the current state (including root transform)
        }
        this.camSimulation.setActiveStep(0);

        // Reset progress slider
        const progressSlider = document.getElementById('cam-progress-slider');
        if (progressSlider) {
            progressSlider.value = 0;
        }

        this._updateDisplay();
    }

    /**
     * Go to a specific step (1-indexed, 0 = reset)
     */
    goToStep(stepNumber) {
        this.stop();

        this.currentStepIndex = Math.max(0, Math.min(this.steps.length, stepNumber));
        this._stepProgress = 0;

        if (this.currentStepIndex === 0) {
            // In presentation mode, don't reset root transform
            const shouldResetRoot = !this._presentationMode;
            if (this._unfoldMode) {
                // In presentation mode, hide part before updates
                if (this._presentationMode && this.onPresentationBegin) {
                    this.onPresentationBegin();
                }

                this.sheetMetalPart.foldAll(shouldResetRoot);

                // In presentation mode, fix flange position and show part
                if (this._presentationMode) {
                    if (this.onPresentationUpdate) {
                        this.onPresentationUpdate();
                    }
                    if (this.onPresentationEnd) {
                        this.onPresentationEnd();
                    }
                }
            } else {
                // Fold mode at step 0 should show fully unfolded with compensation
                // (onPresentationBegin/End is called inside _unfoldAllWithCompensation)
                this._unfoldAllWithCompensation();
            }
            this.camSimulation.setActiveStep(0);
        } else {
            this._applyFullState();
        }

        this._updateDisplay();
        this._notifyStepChange();

        // In fold mode, after partWorldTransform is applied, unfold the current hinge
        // WITH compensation to match what unfold mode would look like at end of animation
        // (unless in presentation mode where we don't compensate)
        if (this._foldModeNeedsCurrentHingeUnfold && this._foldModeCurrentBendId !== undefined) {
            // In presentation mode, hide part before this additional update
            if (this._presentationMode && this.onPresentationBegin) {
                this.onPresentationBegin();
            }

            const shouldCompensate = !this._presentationMode;
            this.sheetMetalPart.setUnfoldProgress(this._foldModeCurrentBendId, 1, shouldCompensate);
            this._foldModeNeedsCurrentHingeUnfold = false;
            this._foldModeCurrentBendId = undefined;

            // Update CAM simulation to show tools at starting position (progress=0)
            // In fold mode, this means punch at home position ready for rapid approach
            this.camSimulation.setProgress(0, true);

            // In presentation mode, fix flange position and show part
            if (this._presentationMode) {
                if (this.onPresentationUpdate) {
                    this.onPresentationUpdate();
                }
                if (this.onPresentationEnd) {
                    this.onPresentationEnd();
                }
            }
        }

        // Update slider to show starting position
        const progressSlider = document.getElementById('cam-progress-slider');
        if (progressSlider) {
            progressSlider.value = this._stepProgress * 100;
        }

        // Notify that all state setup is complete
        if (this.onStateReady) {
            this.onStateReady();
        }
    }

    /**
     * Apply full state - called when step changes.
     * Sets up all hinges from scratch.
     *
     * IMPORTANT: For symmetry compensation to work correctly, we must use
     * setUnfoldProgress() in sequence to build up the proper accumulated
     * compensation in the root transform.
     *
     * Unfold: Start folded, unfold completed steps in order, current animates 0→1
     * Fold: Start folded, unfold steps 1..actualStep (so current is at 1), current animates 1→0
     */
    _applyFullState() {
        const actualStep = this._getActualStepIndex(this.currentStepIndex);

        if (actualStep <= 0 || actualStep > this.steps.length) {
            if (this._unfoldMode) {
                this.sheetMetalPart.foldAll();
            } else {
                // For fold mode at step 0, need full unfold with compensation
                this._unfoldAllWithCompensation();
            }
            this.camSimulation.setActiveStep(0);
            return;
        }

        const actualStepIdx = this.steps[actualStep - 1];

        // Determine if we should apply symmetry compensation
        // In presentation mode, no compensation (base flange stays fixed)
        const shouldCompensate = !this._presentationMode;

        // In presentation mode, don't reset the root transform - just fold hinges
        // This prevents any flashing from intermediate states
        const shouldResetRoot = !this._presentationMode;

        // In presentation mode, hide part before batch updates to prevent flashing
        if (this._presentationMode && this.onPresentationBegin) {
            this.onPresentationBegin();
        }

        if (this._unfoldMode) {
            // Unfold mode: start folded, unfold completed steps with compensation
            this.sheetMetalPart.foldAll(shouldResetRoot);

            // Unfold completed steps in order, using setUnfoldProgress for proper compensation
            for (let i = 1; i < this.currentStepIndex; i++) {
                const stepNum = this._getActualStepIndex(i);
                const stepIdx = this.steps[stepNum - 1];
                const step = this.camSimulation.getStep(stepIdx);
                if (step) {
                    this.sheetMetalPart.setUnfoldProgress(step.bendId, 1, shouldCompensate);
                }
            }
            // Current step hinge is at 0 (folded), will animate 0→1
        } else {
            // Fold mode: Set up hinge states for the current step.
            //
            // In fold mode at display step N, actualStep = steps.length - N + 1
            // We want hinges 1..(actualStep-1) unfolded, hinge actualStep unfolded (to animate 1→0),
            // and hinges (actualStep+1)..n folded.
            //
            // CRITICAL: The partWorldTransform was computed assuming the SAME state as unfold mode:
            // hinges 1..(actualStep-1) unfolded, hinge actualStep FOLDED.
            // But we need hinge actualStep to be UNFOLDED for fold animation.
            //
            // Solution: Set up the SAME state as unfold mode (to match partWorldTransform),
            // then unfold the current hinge WITHOUT compensation after partWorldTransform is applied.
            // We'll do this by setting a flag and handling it after _onCAMStepChanged.
            //
            // Start from fully folded (resets root transform only if not in presentation mode)
            this.sheetMetalPart.foldAll(shouldResetRoot);

            // Unfold hinges 1..(actualStep-1) WITH compensation - same as unfold mode
            // (unless in presentation mode)
            for (let i = 1; i < actualStep; i++) {
                const stepIdx = this.steps[i - 1];
                const step = this.camSimulation.getStep(stepIdx);
                if (step) {
                    this.sheetMetalPart.setUnfoldProgress(step.bendId, 1, shouldCompensate);
                }
            }
            // Current hinge (actualStep) stays at 0 - same as unfold mode
            // Hinges (actualStep+1)..n stay at 0 from foldAll()

            // Mark that we need to unfold the current hinge after partWorldTransform is applied
            this._foldModeNeedsCurrentHingeUnfold = true;
            this._foldModeCurrentBendId = this.camSimulation.getStep(actualStepIdx)?.bendId;
        }

        // Set CAM tools to current step
        this.camSimulation.setActiveStep(actualStepIdx);
        this.camSimulation.setProgress(0, !this._unfoldMode);

        // In presentation mode, fix flange position and show part
        // IMPORTANT: In fold mode, DON'T show part yet - the current hinge is still folded
        // and will be unfolded in goToStep. Showing it now would cause a flash.
        if (this._presentationMode) {
            if (this.onPresentationUpdate) {
                this.onPresentationUpdate();
            }
            // Only show part if we're NOT waiting to unfold the current hinge
            if (this.onPresentationEnd && !this._foldModeNeedsCurrentHingeUnfold) {
                this.onPresentationEnd();
            }
        }
    }

    /**
     * Unfold all steps in sequence WITH symmetry compensation.
     * Used for fold mode initial state (step 0) - fully unfolded.
     * Uses the same code path as unfold mode to ensure identical results.
     */
    _unfoldAllWithCompensation() {
        // Start from fully folded
        // In presentation mode, don't reset root transform to prevent flashing
        const shouldResetRoot = !this._presentationMode;

        // In presentation mode, hide part before batch updates
        if (this._presentationMode && this.onPresentationBegin) {
            this.onPresentationBegin();
        }

        this.sheetMetalPart.foldAll(shouldResetRoot);

        // Determine if we should apply symmetry compensation
        const shouldCompensate = !this._presentationMode;

        // Unfold each step WITH compensation - use same pattern as unfold mode
        // (unless in presentation mode)
        for (let i = 1; i <= this.steps.length; i++) {
            const stepIdx = this.steps[i - 1];
            const step = this.camSimulation.getStep(stepIdx);
            if (step) {
                this.sheetMetalPart.setUnfoldProgress(step.bendId, 1, shouldCompensate);
            }
        }

        // In presentation mode, fix flange position and show part
        if (this._presentationMode) {
            if (this.onPresentationUpdate) {
                this.onPresentationUpdate();
            }
            if (this.onPresentationEnd) {
                this.onPresentationEnd();
            }
        }
    }

    /**
     * Update only the current hinge progress - called during animation.
     *
     * Unfold: progress 0→1 means hinge 0→1, WITH symmetry compensation
     * Fold: progress 0→1 means hinge 1→0, WITH symmetry compensation (reverse direction)
     */
    _updateCurrentProgress() {
        const actualStep = this._getActualStepIndex(this.currentStepIndex);

        if (actualStep <= 0 || actualStep > this.steps.length) return;

        const actualStepIdx = this.steps[actualStep - 1];
        const actualStepData = this.camSimulation.getStep(actualStepIdx);

        if (actualStepData) {
            // Calculate the hinge progress value
            let hingeProgress;
            if (this._unfoldMode) {
                // Unfold mode: motion during 0-60%, then retract
                const motionProgress = Math.min(1, this._stepProgress / 0.6);
                hingeProgress = motionProgress;
            } else {
                // Fold mode: punch approach 0-10%, then part folds 10-60%, then retract
                // Part motion happens during 10-60% of step progress
                const approachEnd = 0.1;
                const motionEnd = 0.6;

                if (this._stepProgress < approachEnd) {
                    // During approach, part stays unfolded
                    hingeProgress = 1;
                } else if (this._stepProgress < motionEnd) {
                    // During part motion, fold from 1→0
                    const t = (this._stepProgress - approachEnd) / (motionEnd - approachEnd);
                    hingeProgress = 1 - t;
                } else {
                    // After motion complete, part is folded
                    hingeProgress = 0;
                }
            }

            // Apply compensation in BOTH modes to keep the part visually centered during animation.
            // In fold mode, we applied compensation when setting up the initial unfolded state,
            // so we need to continue applying it during animation for consistency.
            // In presentation mode, use special callback that hides/shows to prevent flashing.
            if (this._presentationMode && this.onPresentationHingeUpdate) {
                this.onPresentationHingeUpdate(actualStepData.bendId, hingeProgress);
            } else {
                const shouldCompensate = !this._presentationMode;
                this.sheetMetalPart.setUnfoldProgress(actualStepData.bendId, hingeProgress, shouldCompensate);

                // In presentation mode, immediately notify so the viewer can fix flange position
                if (this._presentationMode && this.onPresentationUpdate) {
                    this.onPresentationUpdate();
                }
            }
        }

        this.camSimulation.setProgress(this._stepProgress, !this._unfoldMode);
    }

    /**
     * Set progress within the current step (0-1)
     * Only updates the current hinge, not the full state
     */
    _setStepProgress(progress) {
        this._stepProgress = Math.max(0, Math.min(1, progress));

        if (this.currentStepIndex > 0) {
            this._updateCurrentProgress();
        }

        // Update slider
        const progressSlider = document.getElementById('cam-progress-slider');
        if (progressSlider) {
            progressSlider.value = this._stepProgress * 100;
        }

        if (this.onProgressChange) {
            this.onProgressChange(this._stepProgress);
        }
    }

    nextStep() {
        if (this.currentStepIndex < this.steps.length) {
            this.goToStep(this.currentStepIndex + 1);
        }
    }

    previousStep() {
        if (this.currentStepIndex > 0) {
            this.goToStep(this.currentStepIndex - 1);
        }
    }

    /**
     * Toggle play/pause
     */
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Animate all bends simultaneously.
     * In fold mode: all hinges fold from 1 to 0 together
     * In unfold mode: all hinges unfold from 0 to 1 together
     */
    playAllBendsSimultaneously() {
        // Stop any current animation
        this.stop();

        // Get all bend IDs from steps
        const allBendIds = [];
        for (let i = 0; i < this.steps.length; i++) {
            const stepIdx = this.steps[i];
            const step = this.camSimulation.getStep(stepIdx);
            if (step && step.bendId !== undefined) {
                allBendIds.push(step.bendId);
            }
        }

        if (allBendIds.length === 0) return;

        // Set initial state based on mode
        const shouldResetRoot = !this._presentationMode;

        // In presentation mode, hide part before setup
        if (this._presentationMode && this.onPresentationBegin) {
            this.onPresentationBegin();
        }

        if (this._unfoldMode) {
            // Start folded
            this.sheetMetalPart.foldAll(shouldResetRoot);
        } else {
            // Start unfolded - unfold all hinges
            this.sheetMetalPart.foldAll(shouldResetRoot);
            for (const bendId of allBendIds) {
                this.sheetMetalPart.setUnfoldProgress(bendId, 1, !this._presentationMode);
            }
        }

        // Fix flange in presentation mode
        if (this._presentationMode) {
            if (this.onPresentationUpdate) {
                this.onPresentationUpdate();
            }
            if (this.onPresentationEnd) {
                this.onPresentationEnd();
            }
        }

        // Hide tools during simultaneous animation
        this.camSimulation.setActiveStep(0);

        // Start simultaneous animation
        this._simultaneousBendIds = allBendIds;
        this._simultaneousProgress = 0;
        this._isPlayingSimultaneous = true;

        let lastTime = performance.now();

        const animateSimultaneous = (currentTime) => {
            if (!this._isPlayingSimultaneous) return;

            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            // Use same speed as regular playback
            const progressIncrement = deltaTime / this.playbackSpeed;
            this._simultaneousProgress += progressIncrement;

            if (this._simultaneousProgress >= 1) {
                this._simultaneousProgress = 1;
                this._updateAllBendsProgress(1);
                this._isPlayingSimultaneous = false;
                return;
            }

            this._updateAllBendsProgress(this._simultaneousProgress);
            this._simultaneousAnimationFrame = requestAnimationFrame(animateSimultaneous);
        };

        this._simultaneousAnimationFrame = requestAnimationFrame(animateSimultaneous);
    }

    /**
     * Update all bends to the same progress value simultaneously
     * @param {number} progress - Progress from 0 to 1
     */
    _updateAllBendsProgress(progress) {
        if (!this._simultaneousBendIds || this._simultaneousBendIds.length === 0) return;

        // Calculate hinge progress based on mode
        let hingeProgress;
        if (this._unfoldMode) {
            // Unfold: 0 -> 1
            hingeProgress = progress;
        } else {
            // Fold: 1 -> 0
            hingeProgress = 1 - progress;
        }

        if (this._presentationMode) {
            // In presentation mode, remove from scene, update all hinges, fix, then add back
            const root = this.sheetMetalPart.getRoot();
            const partParent = root.parent;
            if (partParent) {
                partParent.remove(root);
            }

            // Update all hinges without compensation
            for (const bendId of this._simultaneousBendIds) {
                this.sheetMetalPart.setUnfoldProgress(bendId, hingeProgress, false);
            }

            // Fix flange position
            if (this.onPresentationUpdate) {
                this.onPresentationUpdate();
            }

            // Add back to scene (onPresentationUpdate may have already done this via _fixLargestFlangeInPlace)
            if (!root.parent && partParent) {
                partParent.add(root);
            }
        } else {
            // Normal mode with compensation
            for (const bendId of this._simultaneousBendIds) {
                this.sheetMetalPart.setUnfoldProgress(bendId, hingeProgress, true);
            }
        }

        // Notify progress change
        if (this.onProgressChange) {
            this.onProgressChange(progress);
        }
    }

    /**
     * Start playback
     */
    play() {
        if (this.isPlaying) return;

        // Check if at the end
        const atEnd = this.currentStepIndex >= this.steps.length && this._stepProgress >= 1;

        // If at the end or not started, go to step 1
        if (atEnd || this.currentStepIndex === 0) {
            this.goToStep(1);
        }

        this.isPlaying = true;
        this._updateDisplay();
        this._startAnimation();
    }

    /**
     * Pause playback
     */
    pause() {
        this.isPlaying = false;
        this._stopAnimation();
        this._updateDisplay();
    }

    /**
     * Stop playback and reset
     */
    stop() {
        this.isPlaying = false;
        this._stopAnimation();
        this._stopSimultaneousAnimation();
        this._updateDisplay();
    }

    /**
     * Stop simultaneous bend animation
     */
    _stopSimultaneousAnimation() {
        this._isPlayingSimultaneous = false;
        if (this._simultaneousAnimationFrame) {
            cancelAnimationFrame(this._simultaneousAnimationFrame);
            this._simultaneousAnimationFrame = null;
        }
    }

    _startAnimation() {
        let lastTime = performance.now();

        const animate = (currentTime) => {
            if (!this.isPlaying) return;

            const deltaTime = (currentTime - lastTime) / 1000; // seconds
            lastTime = currentTime;

            // Progress always goes 0→1 for display
            const progressIncrement = deltaTime / this.playbackSpeed;
            this._stepProgress += progressIncrement;

            if (this._stepProgress >= 1) {
                this._stepProgress = 1;
                this._setStepProgress(1);
                this._advanceToNextStep();
                return;
            }

            this._setStepProgress(this._stepProgress);
            this._animationFrame = requestAnimationFrame(animate);
        };

        this._animationFrame = requestAnimationFrame(animate);
    }

    _advanceToNextStep() {
        if (this.currentStepIndex < this.steps.length) {
            // Go to next step
            setTimeout(() => {
                if (this.isPlaying) {
                    this.currentStepIndex++;
                    this._stepProgress = 0;

                    if (this.currentStepIndex <= this.steps.length) {
                        this._applyFullState();
                        this._updateDisplay();
                        this._notifyStepChange();

                        // In fold mode, unfold the current hinge (same as in goToStep)
                        if (this._foldModeNeedsCurrentHingeUnfold && this._foldModeCurrentBendId !== undefined) {
                            if (this._presentationMode && this.onPresentationBegin) {
                                this.onPresentationBegin();
                            }

                            const shouldCompensate = !this._presentationMode;
                            this.sheetMetalPart.setUnfoldProgress(this._foldModeCurrentBendId, 1, shouldCompensate);
                            this._foldModeNeedsCurrentHingeUnfold = false;
                            this._foldModeCurrentBendId = undefined;

                            this.camSimulation.setProgress(0, true);

                            if (this._presentationMode) {
                                if (this.onPresentationUpdate) {
                                    this.onPresentationUpdate();
                                }
                                if (this.onPresentationEnd) {
                                    this.onPresentationEnd();
                                }
                            }
                        }

                        // Call onStateReady after state transition
                        if (this.onStateReady) {
                            this.onStateReady();
                        }

                        this._startAnimation();
                    } else {
                        // Finished all steps
                        this.pause();
                    }
                }
            }, 300); // Brief pause between steps
        } else {
            // All done
            this.pause();
        }
    }

    _stopAnimation() {
        if (this._animationFrame) {
            cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
        }
    }

    _notifyStepChange() {
        if (this.onStepChange) {
            const actualStep = this._getActualStepIndex(this.currentStepIndex);
            const stepIdx = (actualStep > 0 && actualStep <= this.steps.length) ? this.steps[actualStep - 1] : 0;
            this.onStepChange(stepIdx, this.currentStepIndex);
        }
    }

    /**
     * Get current step index (1-based)
     */
    getCurrentStep() {
        return this.currentStepIndex;
    }

    /**
     * Get current progress within step (0-1)
     */
    getStepProgress() {
        return this._stepProgress;
    }

    /**
     * Clean up
     */
    dispose() {
        this.stop();
        
        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler, true);
        }
        
        if (this._styleElement) {
            this._styleElement.remove();
        }
        
        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        if (this._versionLabel) {
            this._versionLabel.remove();
            this._versionLabel = null;
        }
    }
}
