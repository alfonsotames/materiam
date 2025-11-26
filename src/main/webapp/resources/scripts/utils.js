import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';

// We instantiate a loader once here to reuse it
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const loader = new GLTFLoader();

/**
 * Loads a GLB, centers it, and scales it to fit.
 * @param {string} url - Path to file
 * @param {THREE.Scene} scene - The scene to add to
 * @param {Coin3DControls} controls - The controls to update target
 * @param {Array} protectedObjects - Array of objects to NOT delete (helpers)
 */
export function loadGLB(url, scene, controls, protectedObjects = []) {
    clearAllMeshes(scene, protectedObjects);

    loader.load(
        url,
        (gltf) => {
            scene.add(gltf.scene);

            // Center & scale model
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.0 / maxDim;

            gltf.scene.scale.set(scale, scale, scale);
            gltf.scene.position.sub(center.multiplyScalar(scale));

            // Update controls
            controls.target.set(0, 0, 0);
            controls.snap('iso');
        },
        (xhr) => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
        (err) => console.error('Error loading GLB:', err)
    );
}

/**
 * Disposes of all meshes/lines in the scene to free memory.
 * @param {THREE.Scene} scene 
 * @param {Array} protectedObjects - Objects to keep (Grids, Axes, etc)
 */
export function clearAllMeshes(scene, protectedObjects = []) {
    const toRemove = [];

    scene.traverse((obj) => {
        if (obj.isCamera || obj.isLight) return;
        
        // Don't delete things in the protected list
        if (protectedObjects.includes(obj)) return;
        
        // Also check typical helpers by type if not explicitly passed
        if (obj.type === 'GridHelper' || obj.type === 'AxesHelper') return;

        const isRenderable =
            obj.isMesh ||
            obj.isLine ||
            obj.isLineSegments ||
            obj.isPoints ||
            (obj instanceof Line2);

        if (isRenderable) {
            if (obj.geometry) obj.geometry.dispose();

            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach((m) => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
            toRemove.push(obj);
        }
    });

    toRemove.forEach((obj) => obj.parent.remove(obj));
}