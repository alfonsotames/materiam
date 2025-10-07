
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ViewportGizmo } from "three-viewport-gizmo";


import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';



var camera, scene, renderer, orbitControls, gizmo, loader;
var meshes = [];
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var frustumSize = 3.5;
var compHeight = 250;
var points = [];
let line;
var clicks=0;
var weldingpointing=false;

init();


animate();



function init() {

    loader = new GLTFLoader();
    
    camera = new THREE.OrthographicCamera(
      (-frustumSize * (window.innerWidth / (window.innerHeight-compHeight))) / 2,  // left
      (frustumSize * (window.innerWidth / (window.innerHeight-compHeight))) / 2,   // right
      frustumSize / 2,              // top
      -frustumSize / 2,             // bottom
      0.1,                          // near
      1000                          // far
    );

    // Match position from perspective camera
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    scene = new THREE.Scene();
    //loadGLB('http://localhost:8080/materiam/images/test.glb');
    var geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
    var material = new THREE.MeshNormalMaterial();
    var mesh = new THREE.Mesh( geometry, material );
    meshes.push( mesh ); 
    scene.add( mesh );
    
    
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


    var container = document.getElementById( 'viewport' );
    renderer = new THREE.WebGLRenderer( { antialias: true} );
    renderer.setSize( window.innerWidth, window.innerHeight-compHeight);
    renderer.setPixelRatio( window.devicePixelRatio );

    container.appendChild( renderer.domElement );
    orbitControls = new OrbitControls( camera, renderer.domElement );
    
    gizmo = new ViewportGizmo(camera, renderer, {
        "type": "sphere",
        "size": 100,
        "placement": "top-right",
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
        "top": 90,
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
        "label": "Y"
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



    gizmo.attachControls(orbitControls);    
    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'mousedown', onMouseDown, false);
		 
}

function onMouseDown(event){
    
    if (weldingpointing) {
        var canvasBounds = renderer.domElement.getBoundingClientRect();
        mouse.x = ( ( event.clientX - canvasBounds.left ) / ( canvasBounds.right - canvasBounds.left ) ) * 2 - 1;
        mouse.y = - ( ( event.clientY - canvasBounds.top ) / ( canvasBounds.bottom - canvasBounds.top) ) * 2 + 1;
        raycaster.setFromCamera( mouse, camera );
        var intersects = raycaster.intersectObjects( scene.children, true );
        if(intersects.length > 0){
            for ( var i = 0; i < intersects.length; i++ ) {
                    console.log(intersects[i].point);
            }

            //intersects[ 0 ].object.material.color.set( 0xff0000 );
            clicks++;
            if (clicks < 2) {
                console.log("Clicks: "+clicks);
                 points[0] = intersects[0].point;
            }
            if (clicks > 1) {
                console.log("Clicks: "+clicks);
                points[1] = intersects[0].point;
                clicks=0;


                console.log("Making a line with points: "+points[0].x+" and "+points[1]);

                const path = new THREE.LineCurve3(points[0], points[1]);
                const geometry = new THREE.TubeGeometry(path, 1, 0.05, 8, false);
                const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
                const tube = new THREE.Mesh(geometry, material);
                scene.add(tube);

                points = [];
                renderer.render( scene, camera );
            }


        }

        else { 
            console.log("clicked outside the mesh");
        }
        window.addEventListener('mousemove', onMouseMove, false);
        window.addEventListener('mouseup', onMouseUp, false);
    }
}


  
function onMouseMove(event){
	//mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	//mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;  
}

function onMouseUp(event){
  window.removeEventListener('mousemove', onMouseMove);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.left   = (-frustumSize * (window.innerWidth / (window.innerHeight-compHeight))) / 2;
    camera.right  = ( frustumSize * (window.innerWidth / (window.innerHeight-compHeight))) / 2;
    camera.top    = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight-compHeight );
    gizmo.update();
}

function animate() {
    requestAnimationFrame( animate );
    orbitControls.update();
    raycaster.setFromCamera( mouse, camera );
    renderer.render( scene, camera );
    gizmo.render();
}

function loadGLB(url) {
    clearAllMeshes(scene);
    console.log("Attempting to load GLB, cadfile: "+url);
    console.log('url: '+url);
    loader.load(
        url,
        (gltf) => {
            scene.add(gltf.scene);
            // Center and scale the model
            var box = new THREE.Box3().setFromObject(gltf.scene);
            var center = box.getCenter(new THREE.Vector3());
            var size = box.getSize(new THREE.Vector3());
            var maxDim = Math.max(size.x, size.y, size.z);
            var scale = 2.0 / maxDim;
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
