/**
 * Help overlay displaying mouse/keyboard controls.
 * Shows in the bottom-right corner of the viewport.
 */
export class ControlsHelp {
    constructor(options = {}) {
        this.container = null;
        this.options = {
            position: { bottom: '20px', right: '20px' },
            opacity: 0.8,
            ...options
        };
    }

    /**
     * Create and attach the help overlay to the DOM
     */
    create() {
        this.dispose();

        this.container = document.createElement('div');
        this.container.id = 'controls-help';
        this.container.style.cssText = `
            position: fixed;
            bottom: ${this.options.position.bottom};
            right: ${this.options.position.right};
            background: rgba(0, 0, 0, ${this.options.opacity});
            padding: 12px 16px;
            border-radius: 5px;
            color: #ccc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            pointer-events: none;
            user-select: none;
            z-index: 100;
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        const controls = [
            { key: 'MMB / 2-Finger', action: 'Rotate', icon: '⟲' },
            { key: 'Shift + MMB/2F', action: 'Pan', icon: '⤧' },
            { key: 'Scroll / Pinch', action: 'Zoom', icon: '⤡' },
            { key: 'Space Bar', action: 'Play/Pause', icon: '⏯︎' }
        ];

        let html = '';
        controls.forEach(ctrl => {
            html += `
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                    <span style="
                        color: #888;
                        font-size: 14px;
                        width: 20px;
                        text-align: center;
                    ">${ctrl.icon}</span>
                    <span style="
                        background: rgba(255, 255, 255, 0.15);
                        padding: 2px 8px;
                        border-radius: 4px;
                        font-size: 11px;
                        font-weight: 500;
                        color: #fff;
                        min-width: 85px;
                        text-align: center;
                    ">${ctrl.key}</span>
                    <span style="color: #aaa;">${ctrl.action}</span>
                </div>
            `;
        });

        // Remove margin from last item
        this.container.innerHTML = html;
        const lastItem = this.container.lastElementChild;
        if (lastItem) {
            lastItem.style.marginBottom = '0';
        }

        document.body.appendChild(this.container);
        return this;
    }

    /**
     * Show the help overlay
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
        }
        return this;
    }

    /**
     * Hide the help overlay
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
        return this;
    }

    /**
     * Toggle visibility
     */
    toggle() {
        if (this.container) {
            const isVisible = this.container.style.display !== 'none';
            this.container.style.display = isVisible ? 'none' : 'block';
        }
        return this;
    }

    /**
     * Set opacity
     */
    setOpacity(opacity) {
        if (this.container) {
            this.container.style.background = `rgba(0, 0, 0, ${opacity})`;
        }
        return this;
    }

    /**
     * Remove from DOM
     */
    dispose() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}