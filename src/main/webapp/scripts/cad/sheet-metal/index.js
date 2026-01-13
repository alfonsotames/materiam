// Sheet Metal Viewer Module
// Specialized viewer for sheet metal parts with bend simulation

export { SheetMetalViewer } from './SheetMetalViewer.js';

// Model classes
export { 
    SheetMetalPart, 
    Flange, 
    Hinge, 
    ProceduralBendHalf 
} from './model/index.js';

// UI components
export { BendControlPanel } from './ui/index.js';

// CAM Simulation
export { CAMSimulation, CAMControlPanel, CAMPlaybackController } from './cam/index.js';
