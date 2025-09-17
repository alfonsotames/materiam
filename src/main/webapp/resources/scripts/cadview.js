
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ViewportGizmo } from "three-viewport-gizmo";

const container = document.getElementById("viewport");

const aspect = window.innerWidth / window.innerHeight;

//Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);



// Define the size of the orthographic frustum
const frustumSize = 3.5;

// Camera setup
const camera = new THREE.OrthographicCamera(
  (-frustumSize * aspect) / 2,  // left
  (frustumSize * aspect) / 2,   // right
  frustumSize / 2,              // top
  -frustumSize / 2,             // bottom
  0.1,                          // near
  1000                          // far
);

// Match position from perspective camera
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);


//Light Setup
const light1 = new THREE.DirectionalLight(0xffffff, 1.5);
light1.position.set(5, 5, 5);
scene.add(light1);

// Fill light (opposite side)
const light2 = new THREE.DirectionalLight(0xffffff, 1.5);
light2.position.set(-5, -5, -5);
scene.add(light2);

// Fill light (opposite side)
const light3 = new THREE.DirectionalLight(0xffffff, 2);
light3.position.set(-5, 5, -5);
scene.add(light3);

// Fill light (opposite side)
const light4 = new THREE.DirectionalLight(0xffffff, 1.5);
light4.position.set(5, -5, 5);
scene.add(light4);  

// Add some ambient to soften contrast
const ambient = new THREE.AmbientLight(0xffffff, 15);
scene.add(ambient);



//const grid = new THREE.GridHelper(10, 10, 0x303030, 0x303030);
//scene.add(grid);




// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth/1.5, window.innerHeight/1.5);
renderer.setAnimationLoop(animation);
container.appendChild(renderer.domElement);

// Init OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);

// Init Gizmo with OrbitControls
let gizmo = new ViewportGizmo(camera, renderer, {
    "type": "sphere",
    "size": 100,
    "placement": "top-center",
    "resolution": 64,
    "lineWidth": 6.336,
    "radius": 1,
    "smoothness": 18,
    "animated": true,
    "speed": 1,
    "background": {
    "enabled": true,
    "color": 16777215,
    "opacity": 0,
    "hover": {
    "color": 16777215,
    "opacity": 0.2
    }
    },
    "font": {
    "family": "sans-serif",
    "weight": 700
    },
    "offset": {
    "top": 100,
    "left": 90,
    "bottom": 0,
    "right": 0
    },
    "corners": {
    "enabled": false,
    "color": 15915362,
    "opacity": 1,
    "scale": 0.15,
    "radius": 1,
    "smoothness": 18,
    "hover": {
    "color": 16777215,
    "opacity": 1,
    "scale": 0.2
    }
    },
    "edges": {
    "enabled": false,
    "color": 15915362,
    "opacity": 1,
    "radius": 1,
    "smoothness": 18,
    "scale": 0.15,
    "hover": {
    "color": 16777215,
    "opacity": 1,
    "scale": 0.2
    }
    },
    "x": {
    "enabled": true,
    "color": 9100032,
    "opacity": 1,
    "scale": 0.5,
    "labelColor": 2236962,
    "line": true,
    "border": {
    "size": 0,
    "color": 14540253
    },
    "hover": {
    "color": 16777215,
    "labelColor": 2236962,
    "opacity": 1,
    "scale": 0.7,
    "border": {
    "size": 0,
    "color": 14540253
    }
    },
    "label": "X"
    },
    "y": {
    "enabled": true,
    "color": 2920447,
    "opacity": 1,
    "scale": 0.5,
    "labelColor": 2236962,
    "line": true,
    "border": {
    "size": 0,
    "color": 14540253
    },
    "hover": {
    "color": 16777215,
    "labelColor": 2236962,
    "opacity": 1,
    "scale": 0.7,
    "border": {
    "size": 0,
    "color": 14540253
    }
    },
    "label": "Z"
    },
    "z": {
    "enabled": true,
    "color": 16725587,
    "opacity": 1,
    "scale": 0.5,
    "labelColor": 2236962,
    "line": true,
    "border": {
    "size": 0,
    "color": 14540253
    },
    "hover": {
    "color": 16777215,
    "labelColor": 2236962,
    "opacity": 1,
    "scale": 0.7,
    "border": {
    "size": 0,
    "color": 14540253
    }
    },
    "label": "X"
    },
    "nx": {
    "line": false,
    "scale": 0.45,
    "hover": {
    "scale": 0.5,
    "color": 16777215,
    "labelColor": 2236962,
    "opacity": 1,
    "border": {
    "size": 0,
    "color": 14540253
    }
    },
    "label": "",
    "enabled": true,
    "color": 16725587,
    "opacity": 1,
    "labelColor": 2236962,
    "border": {
    "size": 0,
    "color": 14540253
    }
    },
    "ny": {
    "line": false,
    "scale": 0.45,
    "hover": {
    "scale": 0.5,
    "color": 16777215,
    "labelColor": 2236962,
    "opacity": 1,
    "border": {
    "size": 0,
    "color": 14540253
    }
    },
    "label": "",
    "enabled": true,
    "color": 9100032,
    "opacity": 1,
    "labelColor": 2236962,
    "border": {
    "size": 0,
    "color": 14540253
    }
    },
    "nz": {
    "line": false,
    "scale": 0.45,
    "hover": {
    "scale": 0.5,
    "color": 16777215,
    "labelColor": 2236962,
    "opacity": 1,
    "border": {
    "size": 0,
    "color": 14540253
    }
    },
    "label": "",
    "enabled": true,
    "color": 2920447,
    "opacity": 1,
    "labelColor": 2236962,
    "border": {
    "size": 0,
    "color": 14540253
    }
    },
    "isSphere": true
});



gizmo.attachControls(controls);

// animation
function animation(time) {
  renderer.render(scene, camera);
  gizmo.render();
}




// GLB loader
const loader = new GLTFLoader();



window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    //camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth/1.5, window.innerHeight/1.5);
    // Recompute orthographic frustum
    camera.left   = (-frustumSize * aspect) / 2;
    camera.right  = ( frustumSize * aspect) / 2;
    camera.top    =  frustumSize / 2;
    camera.bottom = -frustumSize / 2;

    camera.updateProjectionMatrix();
    gizmo.update();
};




// Load GLB
function loadGLB(url) {
    clearAllMeshes(scene);
    console.log("Attempting to load GLB, cadfile: "+url);
    console.log('url: '+url);
    loader.load(
        url,
        (gltf) => {
            scene.add(gltf.scene);
            // Center and scale the model
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.0 / maxDim;
            gltf.scene.scale.set(scale, scale, scale);
            gltf.scene.position.sub(center.multiplyScalar(scale));
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('Error loading GLB:', error);
        }
    );
}

function clearAllMeshes(scene) {
    const toRemove = [];
    scene.traverse((obj) => {
      if (obj.isMesh) {
        // Dispose geometry and material(s)
        if (obj.geometry) obj.geometry.dispose();

        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
        toRemove.push(obj); // mark for removal
      }
    });

    // Remove after traversal to avoid modifying the tree while iterating
    toRemove.forEach((mesh) => {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
    });
}

window.loadGLB = loadGLB;
window.clearAllMeshes = clearAllMeshes;
