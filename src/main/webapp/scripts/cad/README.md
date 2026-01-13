# 3D Part Viewer Project

A modular 3D viewing application built with Three.js, featuring a reusable core viewer library and a specialized sheet metal bend simulation module.

## Project Structure

```
project/
├── core/                           # Universal 3D Viewer Library
│   ├── index.js                    # Main exports
│   ├── BaseViewer.js               # Core viewer class
│   ├── controls/
│   │   ├── Coin3DControls.js       # Camera orbit/pan/zoom controls
│   │   └── index.js
│   ├── ui/
│   │   ├── ViewToolbar.js          # Projection/view buttons
│   │   ├── UIPanel.js              # Base panel component
│   │   └── index.js
│   ├── lighting/
│   │   ├── StudioLighting.js       # Professional lighting setup
│   │   └── index.js
│   └── helpers/
│       ├── PivotIndicator.js       # Rotation pivot visualization
│       └── index.js
│
├── sheet-metal/                    # Sheet Metal Application
│   ├── index.js                    # Main exports
│   ├── SheetMetalViewer.js         # Extended viewer for sheet metal
│   ├── model/
│   │   ├── SheetMetalPart.js       # Part assembly/hierarchy
│   │   ├── Flange.js               # Flat sheet geometry
│   │   ├── Hinge.js                # Bend joint logic
│   │   ├── ProceduralBendHalf.js   # Bend arc geometry
│   │   └── index.js
│   └── ui/
│       ├── BendControlPanel.js     # Bend sliders UI
│       └── index.js
│
├── main.js                         # Entry point
├── index.html                      # HTML template
└── README.md                       # This file
```

## Core Library (`core/`)

The core library provides a universal 3D viewing solution that can be used for any type of 3D model visualization.

### Features

- **Orthographic/Perspective Camera** - Toggle between projection modes
- **Coin3D-style Navigation** - Intuitive rotate, pan, zoom controls
- **Studio Lighting** - Professional multi-light setup with environment mapping
- **View Snapping** - Quick access to standard views (front, top, iso, etc.)
- **Pivot Indicator** - Visual feedback for rotation pivot point

### Usage

```javascript
import { BaseViewer } from './core/index.js';

const viewer = new BaseViewer({
    containerId: 'canvas-container',
    backgroundColor: 0x3a3a42
});

// Add your 3D objects
viewer.addObject(myMesh);
viewer.fitToScene();
```

### Controls

| Action | Input |
|--------|-------|
| Rotate | Middle Mouse |
| Pan | Shift + Middle Mouse |
| Zoom (drag) | Ctrl + Middle Mouse |
| Zoom (scroll) | Mouse Wheel |
| Focus on object | Click while rotating |

## Sheet Metal Module (`sheet-metal/`)

A specialized extension for viewing and simulating sheet metal bend operations.

### Features

- **Blueprint Loading** - Load parts from JSON blueprint files
- **Interactive Bends** - Control each hinge with sliders
- **Fold/Unfold Animation** - Visualize the bending process
- **Symmetry Compensation** - Center rotation around the active hinge

### Usage

```javascript
import { SheetMetalViewer } from './sheet-metal/index.js';

const viewer = new SheetMetalViewer({
    assetPath: '/simulation_output/',
    containerId: 'canvas-container'
});

// The viewer automatically loads blueprint.json from assetPath

// Programmatic control
viewer.setHingeProgress(0, 0.5);  // Set hinge 0 to 50%
viewer.foldAll();                  // Fold all hinges
viewer.unfoldAll();                // Unfold all hinges
```

### Blueprint JSON Format

```json
{
    "sheets": [
        {
            "id": 0,
            "thickness": 1.0,
            "outer": [[0,0], [100,0], [100,50], [0,50]],
            "holes": [],
            "matrix": [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]
        }
    ],
    "bends": [
        {
            "id": 0,
            "parentId": 0,
            "childId": 1,
            "radius": 2.0,
            "width": 50,
            "restAngle": 1.5708,
            "matrixParentToHinge": [...],
            "matrixHingeToChild": [...]
        }
    ]
}
```

## Extending the Core Library

To create a new specialized viewer:

```javascript
import { BaseViewer } from './core/index.js';

class MyCustomViewer extends BaseViewer {
    constructor(options) {
        super(options);
        // Add your custom initialization
    }

    // Add your custom methods
    loadMyModel(url) {
        // Custom loading logic
    }
}
```

## Dependencies

- [Three.js](https://threejs.org/) (v0.160.0 or later)

## Browser Support

Modern browsers with ES modules support:
- Chrome 89+
- Firefox 89+
- Safari 15+
- Edge 89+

## License

MIT
