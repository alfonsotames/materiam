import { UIPanel } from '../../core/ui/UIPanel.js';

/**
 * Control panel for sheet metal bend operations.
 * Provides sliders for each hinge and fold/unfold all buttons.
 */
export class BendControlPanel extends UIPanel {
    constructor(options = {}) {
        super({
            id: 'bend-control-panel',
            title: 'Bend Controls',
            ...options
        });

        this.part = null;
        this.version = options.version || 'v1.0';
        this.sliders = new Map();
    }

    /**
     * Initialize the panel with a sheet metal part
     * @param {SheetMetalPart} part - The sheet metal part to control
     */
    init(part) {
        this.part = part;
        this.create();
        this._buildUI();
        this._attachEventListeners();
        return this;
    }

    _buildUI() {
        const hingeIds = this.part.getHingeIds();

        // Build HTML content
        let html = `<h3 style="margin:0 0 15px 0; color:#fff;">Sheet Metal (${this.version})</h3>`;

        // Fold/Unfold buttons
        html += `
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <button id="btn-fold" style="flex:1; background:#3a3a40; border:none; padding:8px; color:white; border-radius:4px; cursor:pointer;">
                    Unfold All
                </button>
                <button id="btn-unfold" style="flex:1; background:#4a9eff; border:none; padding:8px; color:white; border-radius:4px; cursor:pointer;">
                    Fold All
                </button>
            </div>
        `;

        // Sliders for each hinge
        hingeIds.forEach(id => {
            html += `
                <div style="margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between;">
                        <span>Bend ${id}</span>
                        <span id="progress_${id}">0%</span>
                    </div>
                    <input type="range" id="bend_${id}" min="0" max="100" value="0" style="width:100%;">
                </div>
            `;
        });

        this.setContent(html);
    }

    _attachEventListeners() {
        const hingeIds = this.part.getHingeIds();

        // Slider events
        hingeIds.forEach(id => {
            const slider = document.getElementById(`bend_${id}`);
            const progressLabel = document.getElementById(`progress_${id}`);

            if (slider) {
                this.sliders.set(id, { slider, progressLabel });

                slider.addEventListener('input', (e) => {
                    const progress = parseFloat(e.target.value) / 100;
                    if (progressLabel) {
                        progressLabel.textContent = Math.round(progress * 100) + '%';
                    }
                    this.part.setUnfoldProgress(id, progress);
                });
            }
        });

        // Fold All button (sets to 0%)
        const btnFold = document.getElementById('btn-fold');
        if (btnFold) {
            btnFold.addEventListener('click', () => {
                this._setAllSliders(0);
                this.part.foldAll();
            });
        }

        // Unfold All button (sets to 100%)
        const btnUnfold = document.getElementById('btn-unfold');
        if (btnUnfold) {
            btnUnfold.addEventListener('click', () => {
                this._setAllSliders(100);
                this.part.unfoldAll();
            });
        }
    }

    _setAllSliders(value) {
        const percentage = value + '%';
        this.sliders.forEach(({ slider, progressLabel }) => {
            if (slider) slider.value = value;
            if (progressLabel) progressLabel.textContent = percentage;
        });
    }

    /**
     * Set a specific slider value
     * @param {number} hingeId - The hinge ID
     * @param {number} value - Value from 0 to 100
     */
    setSliderValue(hingeId, value) {
        const sliderData = this.sliders.get(hingeId);
        if (sliderData) {
            sliderData.slider.value = value;
            sliderData.progressLabel.textContent = value + '%';
        }
    }

    /**
     * Get the current value of a slider
     * @param {number} hingeId - The hinge ID
     * @returns {number} Value from 0 to 100
     */
    getSliderValue(hingeId) {
        const sliderData = this.sliders.get(hingeId);
        return sliderData ? parseFloat(sliderData.slider.value) : 0;
    }

    /**
     * Clean up resources
     */
    dispose() {
        this.sliders.clear();
        super.dispose();
    }
}
