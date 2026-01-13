import { SheetMetalViewer } from './sheet-metal/index.js';

// Configuration
const ASSET_PATH = '/simulation_output/';
const VERSION = 'v1.0-refactored';

// Debug flag
window.DEBUG_HINGES = new URLSearchParams(window.location.search).has('debug');

// Initialize the viewer
window.sheetMetalViewer = new SheetMetalViewer({
    assetPath: ASSET_PATH,
    version: VERSION,
    containerId: 'canvas-container'
});

// Export for console access
window.viewer = window.sheetMetalViewer;
