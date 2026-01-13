/**
 * Toolbar for camera view controls.
 * Provides buttons for projection mode and snap views.
 */
export class ViewToolbar {
    constructor(options = {}) {
        this.container = null;
        this.btnOrtho = null;
        this.btnPersp = null;
        
        this.options = {
            position: { top: '20px', right: '20px' },
            activeColor: '#4a9eff',
            inactiveColor: '#888',
            ...options
        };

        // Callbacks
        this.onProjectionChange = null;
        this.onViewSnap = null;
    }

    /**
     * Create and attach the toolbar to the DOM
     */
    create() {
        this.dispose();

        this.container = document.createElement('div');
        this.container.id = 'view-toolbar';
        this.container.style.cssText = `
            position: fixed;
            top: ${this.options.position.top};
            right: ${this.options.position.right};
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 100;
        `;
        document.body.appendChild(this.container);

        this._createProjectionToggle();
        this._createViewButtons();

        return this;
    }

    _createProjectionToggle() {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            display: flex;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 6px;
            padding: 3px;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        `;

        const createToggleBtn = (text, isDefault) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            btn.style.cssText = `
                background: ${isDefault ? 'rgba(74, 158, 255, 0.2)' : 'transparent'};
                border: none;
                color: ${isDefault ? this.options.activeColor : this.options.inactiveColor};
                padding: 6px 14px;
                font-size: 12px;
                font-weight: 500;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                cursor: pointer;
                border-radius: 4px;
                transition: all 0.15s ease;
            `;
            btn.onmouseover = () => {
                if (!btn.classList.contains('active')) {
                    btn.style.background = 'rgba(255, 255, 255, 0.08)';
                }
            };
            btn.onmouseout = () => {
                if (!btn.classList.contains('active')) {
                    btn.style.background = 'transparent';
                }
            };
            if (isDefault) btn.classList.add('active');
            return btn;
        };

        this.btnOrtho = createToggleBtn('Ortho', false);
        this.btnPersp = createToggleBtn('Persp', true);

        this.btnOrtho.onclick = () => this._handleProjection('ortho');
        this.btnPersp.onclick = () => this._handleProjection('persp');

        wrapper.appendChild(this.btnOrtho);
        wrapper.appendChild(this.btnPersp);
        this.container.appendChild(wrapper);
    }

    _createViewButtons() {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            display: flex;
            gap: 4px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 6px;
            padding: 4px;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        `;

        const views = [
            { id: 'front', label: 'F', tooltip: 'Front View' },
            { id: 'top', label: 'T', tooltip: 'Top View' },
            { id: 'right', label: 'R', tooltip: 'Right View' },
            { id: 'iso', label: 'Iso', tooltip: 'Isometric View' }
        ];

        views.forEach(view => {
            const btn = document.createElement('button');
            btn.textContent = view.label;
            btn.title = view.tooltip;
            btn.style.cssText = `
                background: transparent;
                border: none;
                color: ${this.options.inactiveColor};
                width: ${view.label.length > 1 ? 'auto' : '28px'};
                height: 28px;
                padding: ${view.label.length > 1 ? '0 10px' : '0'};
                font-size: 12px;
                font-weight: 600;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                cursor: pointer;
                border-radius: 4px;
                transition: all 0.15s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            btn.onmouseover = () => {
                btn.style.background = 'rgba(255, 255, 255, 0.1)';
                btn.style.color = '#fff';
            };
            btn.onmouseout = () => {
                btn.style.background = 'transparent';
                btn.style.color = this.options.inactiveColor;
            };
            btn.onclick = () => this._handleViewSnap(view.id);

            wrapper.appendChild(btn);
        });

        this.container.appendChild(wrapper);
    }

    _handleProjection(mode) {
        this._setActiveProjection(mode);
        if (this.onProjectionChange) {
            this.onProjectionChange(mode);
        }
    }

    _handleViewSnap(viewName) {
        if (this.onViewSnap) {
            this.onViewSnap(viewName);
        }
    }

    _setActiveProjection(mode) {
        if (this.btnOrtho) {
            const isOrtho = mode === 'ortho';
            this.btnOrtho.style.background = isOrtho ? 'rgba(74, 158, 255, 0.2)' : 'transparent';
            this.btnOrtho.style.color = isOrtho ? this.options.activeColor : this.options.inactiveColor;
            this.btnOrtho.classList.toggle('active', isOrtho);
        }
        if (this.btnPersp) {
            const isPersp = mode === 'persp';
            this.btnPersp.style.background = isPersp ? 'rgba(74, 158, 255, 0.2)' : 'transparent';
            this.btnPersp.style.color = isPersp ? this.options.activeColor : this.options.inactiveColor;
            this.btnPersp.classList.toggle('active', isPersp);
        }
    }

    /**
     * Update the toolbar to reflect the current projection mode
     */
    setProjectionMode(mode) {
        this._setActiveProjection(mode);
    }

    /**
     * Remove the toolbar from the DOM
     */
    dispose() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.btnOrtho = null;
        this.btnPersp = null;
    }
}