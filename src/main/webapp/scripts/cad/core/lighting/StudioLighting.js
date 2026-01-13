import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/**
 * Professional studio-style lighting setup for 3D visualization.
 * 
 * Features:
 * - Soft, diffuse lighting from multiple directions
 * - Low contrast ratio between light and shadow
 * - Wrap-around illumination for smooth gradients on metal surfaces
 * - Environment mapping for realistic reflections
 */
export class StudioLighting {
    constructor() {
        this.lights = [];
        this.environment = null;
    }

    /**
     * Apply studio lighting to a scene
     * @param {THREE.Scene} scene - The scene to light
     * @param {THREE.WebGLRenderer} renderer - The renderer (needed for PMREM)
     * @param {Object} options - Configuration options
     */
    apply(scene, renderer, options = {}) {
        const {
            ambientIntensity = 0.4,
            hemiIntensity = 0.5,
            keyIntensity = 0.6,
            fillIntensity = 0.4,
            rimIntensity = 0.3,
            topIntensity = 0.25,
            bounceIntensity = 0.15,
            environmentSigma = 0.02
        } = options;

        // Environment map for reflections
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        this.environment = pmremGenerator.fromScene(new RoomEnvironment(), environmentSigma).texture;
        scene.environment = this.environment;

        // Ambient light - base fill to lift shadows
        const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
        scene.add(ambientLight);
        this.lights.push(ambientLight);

        // Hemisphere light - sky/ground gradient for natural feel
        const hemiLight = new THREE.HemisphereLight(0xfff8f0, 0xd0e0f0, hemiIntensity);
        scene.add(hemiLight);
        this.lights.push(hemiLight);

        // Key light - main light source, slightly warm
        const keyLight = new THREE.DirectionalLight(0xfffaf0, keyIntensity);
        keyLight.position.set(150, 300, 200);
        scene.add(keyLight);
        this.lights.push(keyLight);

        // Fill light - softer, cooler, from opposite side
        const fillLight = new THREE.DirectionalLight(0xf0f5ff, fillIntensity);
        fillLight.position.set(-200, 150, 100);
        scene.add(fillLight);
        this.lights.push(fillLight);

        // Back/rim light - creates subtle edge definition
        const rimLight = new THREE.DirectionalLight(0xffffff, rimIntensity);
        rimLight.position.set(-50, 100, -200);
        scene.add(rimLight);
        this.lights.push(rimLight);

        // Top light - softens shadows underneath overhangs
        const topLight = new THREE.DirectionalLight(0xffffff, topIntensity);
        topLight.position.set(0, 400, 0);
        scene.add(topLight);
        this.lights.push(topLight);

        // Bottom bounce - simulates light reflecting off floor
        const bounceLight = new THREE.DirectionalLight(0xf5f5ff, bounceIntensity);
        bounceLight.position.set(0, -200, 50);
        scene.add(bounceLight);
        this.lights.push(bounceLight);

        return this;
    }

    /**
     * Remove all lights from the scene
     */
    dispose(scene) {
        this.lights.forEach(light => {
            scene.remove(light);
            if (light.dispose) light.dispose();
        });
        this.lights = [];
        
        if (this.environment) {
            this.environment.dispose();
            this.environment = null;
        }
    }
}
