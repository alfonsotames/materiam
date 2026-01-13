/**
 * Base class for UI panels.
 * Provides common styling and functionality for side panels.
 */
export class UIPanel {
    constructor(options = {}) {
        this.container = null;
        this.options = {
            id: 'ui-panel',
            title: 'Panel',
            position: { top: '20px', left: '20px' },
            width: '280px',
            maxHeight: '80vh',
            ...options
        };
    }

    /**
     * Create the panel container
     */
    create() {
        // Remove existing if present
        this.dispose();

        this.container = document.createElement('div');
        this.container.id = this.options.id;
        this.container.style.cssText = `
            position: fixed;
            top: ${this.options.position.top};
            left: ${this.options.position.left};
            width: ${this.options.width};
            max-height: ${this.options.maxHeight};
            background: rgba(20, 20, 25, 0.95);
            backdrop-filter: blur(10px);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #e0e0e0;
            font-family: sans-serif;
            font-size: 13px;
            overflow-y: auto;
            z-index: 99;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `;

        document.body.appendChild(this.container);
        return this;
    }

    /**
     * Set the HTML content of the panel
     */
    setContent(html) {
        if (this.container) {
            this.container.innerHTML = html;
        }
        return this;
    }

    /**
     * Add a title to the panel
     */
    addTitle(text) {
        const title = document.createElement('h3');
        title.style.cssText = 'margin: 0 0 15px 0; color: #fff;';
        title.textContent = text;
        if (this.container) {
            this.container.prepend(title);
        }
        return this;
    }

    /**
     * Create a button group
     */
    createButtonGroup() {
        const group = document.createElement('div');
        group.style.cssText = 'display: flex; gap: 10px; margin-bottom: 15px;';
        return group;
    }

    /**
     * Create a styled button
     */
    createButton(text, options = {}) {
        const {
            primary = false,
            flex = 1
        } = options;

        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            flex: ${flex};
            background: ${primary ? '#4a9eff' : '#3a3a40'};
            border: none;
            padding: 8px;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
        `;

        btn.onmouseover = () => {
            btn.style.background = primary ? '#5ab0ff' : '#4a4a50';
        };
        btn.onmouseout = () => {
            btn.style.background = primary ? '#4a9eff' : '#3a3a40';
        };

        return btn;
    }

    /**
     * Create a slider control
     */
    createSlider(options = {}) {
        const {
            id = 'slider',
            label = 'Slider',
            min = 0,
            max = 100,
            value = 0,
            showValue = true
        } = options;

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'margin-bottom: 10px;';

        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between;';
        
        const labelEl = document.createElement('span');
        labelEl.textContent = label;
        header.appendChild(labelEl);

        let valueEl = null;
        if (showValue) {
            valueEl = document.createElement('span');
            valueEl.id = `${id}_value`;
            valueEl.textContent = `${value}%`;
            header.appendChild(valueEl);
        }

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = id;
        slider.min = min;
        slider.max = max;
        slider.value = value;
        slider.style.cssText = 'width: 100%;';

        wrapper.appendChild(header);
        wrapper.appendChild(slider);

        return { wrapper, slider, valueEl };
    }

    /**
     * Get an element by ID within the panel
     */
    getElementById(id) {
        return this.container ? this.container.querySelector(`#${id}`) : null;
    }

    /**
     * Remove the panel from the DOM
     */
    dispose() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}
