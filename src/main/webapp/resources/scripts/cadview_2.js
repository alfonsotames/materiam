
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

var camera, scene, renderer, orbitControls;
var meshes = [];
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var frustumSize = 3.5;
var compHeight = 180;

init();
animate();



function init() {

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
    var geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
    var material = new THREE.MeshNormalMaterial();
    var mesh = new THREE.Mesh( geometry, material );
    meshes.push( mesh ); 
    scene.add( mesh );
    var container = document.getElementById( 'viewport' );
    renderer = new THREE.WebGLRenderer( { antialias: true} );
    renderer.setSize( window.innerWidth, window.innerHeight-compHeight);
    renderer.setPixelRatio( window.devicePixelRatio );

    container.appendChild( renderer.domElement );
    orbitControls = new OrbitControls( camera, renderer.domElement );
    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener( 'mousedown', onMouseDown, false);
		 
}

function onMouseDown(event){
    var canvasBounds = renderer.domElement.getBoundingClientRect();
    mouse.x = ( ( event.clientX - canvasBounds.left ) / ( canvasBounds.right - canvasBounds.left ) ) * 2 - 1;
    mouse.y = - ( ( event.clientY - canvasBounds.top ) / ( canvasBounds.bottom - canvasBounds.top) ) * 2 + 1;
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( meshes, true );
    if(intersects.length > 0){
        for ( var i = 0; i < intersects.length; i++ ) {
                console.log(intersects[i].point);
        }
    }
    else { 
        console.log("clicked outside the mesh");
    }
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('mouseup', onMouseUp, false);
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
}

function animate() {
    requestAnimationFrame( animate );
    orbitControls.update();
    raycaster.setFromCamera( mouse, camera );
    renderer.render( scene, camera );
}