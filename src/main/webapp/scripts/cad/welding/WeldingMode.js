/**
 * WeldingMode.js - Main controller for the welding definition module
 *
 * Manages the welding mode state and coordinates edge highlighting and weld creation.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EdgeProximity } from './EdgeProximity.js';
import { WeldHighlighter } from './WeldHighlighter.js';
import { WeldGeometry } from './WeldGeometry.js';

export class WeldingMode {
    constructor(viewer) {
        this.viewer = viewer;
        this.scene = viewer.getScene();
        this.camera = viewer.camera;
        this.renderer = viewer.renderer;

        this.active = false;
        this.activeAssemblyPersid = null;
        this.activeCadfileUuid = null;

        // GLB loader
        this.gltfLoader = new GLTFLoader();

        // Welding components
        this.edgeProximity = new EdgeProximity();
        this.weldHighlighter = new WeldHighlighter(this.scene, this.camera, this.renderer);
        this.weldGeometry = new WeldGeometry(this.scene);

        // Edge data storage
        this.partEdges = new Map(); // persid -> edge lines array
        this.nearbyEdgePairs = []; // pairs of edges that are near each other

        // Loaded models for this welding session
        this.loadedModels = new Map(); // persid -> THREE.Object3D
        this.assemblyGroup = null; // Container for all loaded parts

        // Instance transform data for weld edge positioning
        // Maps instance persid -> { transform: Matrix4, relativeTransform: Matrix4 or null }
        this.instanceTransforms = new Map();

        // Weld definitions
        this.welds = []; // Array of weld objects
        this.selectedWeldEdges = new Set(); // Set of selected weld edge lines

        // Raycaster for hover/click detection
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Hover state
        this.hoveredEdge = null;

        // Materials for weld interface edges (using MeshBasicMaterial for tubes)
        this.materials = {
            normal: new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
            hovered: new THREE.MeshBasicMaterial({ color: 0xffff00 }),
            selected: new THREE.MeshBasicMaterial({ color: 0x00ffff })
        };

        // Tube radius for weld edge visualization (in mm)
        this.weldEdgeRadius = 4.5;

        // Bind event handlers
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Toggle welding mode for an assembly
     */
    toggle(assemblyPersid, cadfileUuid) {
        if (this.active && this.activeAssemblyPersid === assemblyPersid) {
            this.deactivate();
        } else {
            // Note: This will be replaced by activateWithInstances when called via fetchWeldingData
            this.activate(assemblyPersid);
        }
    }

    /**
     * Activate welding mode with instance data and weld interfaces from the server.
     * Loads all parts for the assembly and highlights detected weld interfaces.
     */
    async activateWithInstances(assemblyPersid, cadfileUuid, instances, weldInterfaces) {
        if (this.active) {
            this.deactivate();
        }

        this.active = true;
        this.activeAssemblyPersid = assemblyPersid;
        this.activeCadfileUuid = cadfileUuid;
        this.weldInterfaces = weldInterfaces;

        // Update UI button state
        this._updateButtonState(assemblyPersid, true);

        console.log(`Activating welding mode for assembly: ${assemblyPersid}`);
        console.log(`Loading ${instances.length} instances...`);

        // Clear any existing models from the scene (from regular viewing)
        this._clearExistingModels();

        // Create a group to hold all assembly parts
        this.assemblyGroup = new THREE.Group();
        this.assemblyGroup.name = 'welding-assembly';
        this.scene.add(this.assemblyGroup);

        // Load all parts with their transforms
        await this._loadInstanceParts(instances);

        // Render weld interfaces from stepguru detection
        if (weldInterfaces && weldInterfaces.weldInterfaces) {
            this._renderWeldInterfaces(weldInterfaces.weldInterfaces);
            console.log(`Rendered ${weldInterfaces.weldInterfaces.length} weld interfaces`);
        } else {
            console.warn('No weld interfaces data available');
        }

        // Add event listeners
        this.renderer.domElement.addEventListener('mousemove', this._onMouseMove);
        this.renderer.domElement.addEventListener('click', this._onClick);

        // Fit camera to the assembly
        this._fitCameraToAssembly();

        console.log(`Welding mode activated for assembly: ${assemblyPersid}`);
    }

    /**
     * Load all instance parts with their transforms.
     * Groups instances by part, loads each part GLB once, then clones for additional instances.
     */
    async _loadInstanceParts(instances) {
        // Group instances by their part persid
        const instancesByPart = new Map();
        for (const instance of instances) {
            if (!instance.glbUrl || !instance.partPersid) {
                console.warn(`Instance ${instance.persid} has no glbUrl or partPersid`);
                continue;
            }
            if (!instancesByPart.has(instance.partPersid)) {
                instancesByPart.set(instance.partPersid, []);
            }
            instancesByPart.get(instance.partPersid).push(instance);
        }

        console.log(`Found ${instancesByPart.size} unique parts with ${instances.length} instances`);

        // Load each unique part and clone for additional instances
        const loadPromises = [];
        for (const [partPersid, partInstances] of instancesByPart) {
            const promise = this._loadPartWithInstances(partInstances);
            loadPromises.push(promise);
        }

        await Promise.all(loadPromises);
        console.log(`Loaded ${this.loadedModels.size} instance models`);
    }

    /**
     * Load a part GLB and create models for all instances of that part.
     * Finds which instance's transform matches the GLB's baked world coordinates,
     * then applies relative transforms to position all other instances.
     */
    _loadPartWithInstances(partInstances) {
        const firstInstance = partInstances[0];

        return new Promise((resolve) => {
            this.gltfLoader.load(
                firstInstance.glbUrl,
                (gltf) => {
                    const baseModel = gltf.scene;

                    // Get the bounding box center of the base model (this is the baked world position)
                    const baseBox = new THREE.Box3().setFromObject(baseModel);
                    const glbCenter = baseBox.getCenter(new THREE.Vector3());

                    // Convert row-major transform to THREE.js Matrix4 (column-major)
                    // Row-major: [r0c0, r0c1, r0c2, r0c3, r1c0, r1c1, r1c2, r1c3, ...]
                    // Column-major: [r0c0, r1c0, r2c0, r3c0, r0c1, r1c1, r2c1, r3c1, ...]
                    const rowMajorToColumnMajor = (rm) => {
                        if (!rm || rm.length !== 16) return new THREE.Matrix4();
                        return new THREE.Matrix4().set(
                            rm[0], rm[1], rm[2], rm[3],
                            rm[4], rm[5], rm[6], rm[7],
                            rm[8], rm[9], rm[10], rm[11],
                            rm[12], rm[13], rm[14], rm[15]
                        );
                    };

                    // Find which instance's transform position best matches the GLB's baked center
                    // The GLB has one instance's world coordinates baked in, but we don't know which one
                    let baseInstanceIndex = 0;
                    let minDistance = Infinity;
                    const instancePositions = [];

                    for (let i = 0; i < partInstances.length; i++) {
                        const instance = partInstances[i];
                        const matrix = rowMajorToColumnMajor(instance.transform);
                        const pos = new THREE.Vector3();
                        matrix.decompose(pos, new THREE.Quaternion(), new THREE.Vector3());
                        instancePositions.push({ index: i, pos, matrix });

                        // Compare transform position to GLB center
                        const distance = pos.distanceTo(glbCenter);
                        if (distance < minDistance) {
                            minDistance = distance;
                            baseInstanceIndex = i;
                        }
                    }

                    const baseInstance = partInstances[baseInstanceIndex];
                    const baseMatrix = instancePositions[baseInstanceIndex].matrix;
                    const basePos = instancePositions[baseInstanceIndex].pos;

                    console.log(`Part ${firstInstance.partName} (${firstInstance.partPersid}): ${partInstances.length} instances`);
                    console.log(`  GLB center: (${glbCenter.x.toFixed(1)}, ${glbCenter.y.toFixed(1)}, ${glbCenter.z.toFixed(1)})`);
                    if (partInstances.length > 1) {
                        console.log(`  Base instance ${baseInstance.persid} (index ${baseInstanceIndex}) pos: (${basePos.x.toFixed(1)}, ${basePos.y.toFixed(1)}, ${basePos.z.toFixed(1)}) distance: ${minDistance.toFixed(1)}`);
                    }

                    // Store the base matrix inverse for relative transform calculations
                    const baseMatrixInverse = baseMatrix.clone().invert();

                    // Process each instance
                    for (let i = 0; i < partInstances.length; i++) {
                        const instance = partInstances[i];
                        const instanceMatrix = instancePositions[i].matrix;
                        const instancePos = instancePositions[i].pos;
                        let model;
                        let relativeMatrix = null;

                        if (i === baseInstanceIndex) {
                            // Base instance: use the loaded model directly (already positioned)
                            model = baseModel;
                            // Store transform data - base instance has no relative transform
                            this.instanceTransforms.set(instance.persid, {
                                transform: baseMatrix.clone(),
                                relativeTransform: null,
                                isBaseInstance: true
                            });
                        } else {
                            // Other instances: clone and apply relative transform
                            model = baseModel.clone();

                            // The GLB has vertices at Tbase * localVerts (base instance's world transform baked in)
                            // We want vertices at Ti * localVerts (this instance's world transform)
                            // So we apply: Ti * Tbase^-1 to transform from base to this instance
                            relativeMatrix = instanceMatrix.clone().multiply(baseMatrixInverse);

                            // Apply the relative transform to the model
                            model.applyMatrix4(relativeMatrix);

                            // Store transform data for weld edge positioning
                            this.instanceTransforms.set(instance.persid, {
                                transform: instanceMatrix.clone(),
                                relativeTransform: relativeMatrix.clone(),
                                isBaseInstance: false
                            });

                            console.log(`  Instance ${instance.persid} pos: (${instancePos.x.toFixed(1)}, ${instancePos.y.toFixed(1)}, ${instancePos.z.toFixed(1)})`);
                        }

                        // Set metadata
                        model.name = instance.persid;
                        model.userData.persid = instance.persid;
                        model.userData.partPersid = instance.partPersid;
                        model.userData.partName = instance.partName;

                        // Tag all children
                        model.traverse((child) => {
                            child.userData.persid = instance.persid;
                            child.userData.partPersid = instance.partPersid;
                        });

                        // Log position for debugging
                        model.updateMatrixWorld(true);
                        const box = new THREE.Box3().setFromObject(model);
                        const center = box.getCenter(new THREE.Vector3());
                        console.log(`  Instance ${instance.persid} center: (${center.x.toFixed(1)}, ${center.y.toFixed(1)}, ${center.z.toFixed(1)})`);

                        this.assemblyGroup.add(model);
                        this.loadedModels.set(instance.persid, model);
                    }

                    resolve(baseModel);
                },
                undefined,
                (error) => {
                    console.error(`Error loading ${firstInstance.glbUrl}:`, error);
                    resolve(null);
                }
            );
        });
    }

    /**
     * Fit camera to view the entire assembly
     */
    _fitCameraToAssembly() {
        if (!this.assemblyGroup || this.assemblyGroup.children.length === 0) {
            return;
        }

        const box = new THREE.Box3().setFromObject(this.assemblyGroup);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        // Move camera to fit the assembly
        const fov = this.camera.fov * (Math.PI / 180);
        const distance = maxDim / (2 * Math.tan(fov / 2)) * 1.5;

        this.camera.position.set(
            center.x + distance * 0.5,
            center.y + distance * 0.3,
            center.z + distance
        );
        this.camera.lookAt(center);

        // Update orbit controls target if available
        if (this.viewer.controls && typeof this.viewer.controls.update === 'function') {
            this.viewer.controls.target.copy(center);
            this.viewer.controls.update();
        } else if (this.viewer.orbitControls && typeof this.viewer.orbitControls.update === 'function') {
            this.viewer.orbitControls.target.copy(center);
            this.viewer.orbitControls.update();
        }
    }

    /**
     * Render weld interface edges from stepguru detection data.
     * Creates tube geometry for each contact edge for better visibility.
     * Deduplicates overlapping edges to prevent double-selection.
     * Note: Edge coordinates from stepguru are already in correct world positions
     * (stepguru analyzes the STEP file with correct instance transforms).
     */
    _renderWeldInterfaces(interfaces) {
        // Create a group to hold all weld interface tubes
        this.weldInterfaceGroup = new THREE.Group();
        this.weldInterfaceGroup.name = 'weld-interfaces';

        // Track existing edges for deduplication using bounding boxes
        const existingEdges = [];
        const OVERLAP_TOLERANCE = 2.0; // mm - edges closer than this are considered duplicates

        // Check if a new edge overlaps with any existing edge
        const isOverlapping = (newPoints) => {
            // Compute bounding box and center/length for new edge
            const newBox = new THREE.Box3();
            for (const p of newPoints) {
                newBox.expandByPoint(p);
            }
            const newCenter = newBox.getCenter(new THREE.Vector3());
            const newSize = newBox.getSize(new THREE.Vector3());
            const newLength = Math.max(newSize.x, newSize.y, newSize.z);

            for (const existing of existingEdges) {
                // Quick check: are centers close enough?
                const centerDist = newCenter.distanceTo(existing.center);
                if (centerDist > newLength + existing.length) {
                    continue; // Too far apart
                }

                // Check if bounding boxes overlap (with tolerance)
                const expandedExisting = existing.box.clone().expandByScalar(OVERLAP_TOLERANCE);
                if (expandedExisting.intersectsBox(newBox)) {
                    // Additional check: compare endpoints
                    const newStart = newPoints[0];
                    const newEnd = newPoints[newPoints.length - 1];
                    const existStart = existing.points[0];
                    const existEnd = existing.points[existing.points.length - 1];

                    // Check if endpoints match (in either direction)
                    const startMatchesStart = newStart.distanceTo(existStart) < OVERLAP_TOLERANCE;
                    const startMatchesEnd = newStart.distanceTo(existEnd) < OVERLAP_TOLERANCE;
                    const endMatchesStart = newEnd.distanceTo(existStart) < OVERLAP_TOLERANCE;
                    const endMatchesEnd = newEnd.distanceTo(existEnd) < OVERLAP_TOLERANCE;

                    if ((startMatchesStart && endMatchesEnd) || (startMatchesEnd && endMatchesStart)) {
                        return true; // Duplicate edge
                    }
                }
            }
            return false;
        };

        let totalEdges = 0;
        let duplicatesSkipped = 0;
        let edgeIndex = 0;

        for (const iface of interfaces) {
            for (const edge of iface.edges) {
                if (edge.vertices.length < 2) continue;

                // Create points from vertices (already in correct world coordinates)
                const points = edge.vertices.map(v => new THREE.Vector3(v[0], v[1], v[2]));

                // Check for duplicate/overlapping edge
                if (isOverlapping(points)) {
                    duplicatesSkipped++;
                    continue;
                }

                // Create a tube along the edge path
                const tube = this._createEdgeTube(points);
                if (tube) {
                    // Store edge info for future deduplication checks
                    const box = new THREE.Box3();
                    for (const p of points) {
                        box.expandByPoint(p);
                    }
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    existingEdges.push({
                        points,
                        box,
                        center,
                        length: Math.max(size.x, size.y, size.z)
                    });

                    tube.userData.isWeldInterface = true;
                    tube.userData.componentA = iface.componentA;
                    tube.userData.componentB = iface.componentB;
                    tube.userData.contactArea = iface.contactAreaMm2;
                    tube.userData.edgeIndex = edgeIndex++;
                    tube.userData.interfaceData = iface;

                    this.weldInterfaceGroup.add(tube);
                    totalEdges++;
                }
            }
        }

        this.scene.add(this.weldInterfaceGroup);
        console.log(`Created ${totalEdges} weld interface edge tubes (${duplicatesSkipped} duplicates skipped)`);
    }

    /**
     * Create a tube mesh along an edge path
     */
    _createEdgeTube(points) {
        if (points.length < 2) return null;

        // For 2 points, create a simple cylinder
        if (points.length === 2) {
            return this._createCylinder(points[0], points[1]);
        }

        // For multiple points, create a CatmullRomCurve3 and TubeGeometry
        const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0);

        // Calculate segments based on curve length
        const curveLength = curve.getLength();
        const segments = Math.max(8, Math.ceil(curveLength / 2));

        const geometry = new THREE.TubeGeometry(
            curve,
            segments,           // tubular segments
            this.weldEdgeRadius, // radius
            8,                  // radial segments
            false               // closed
        );

        const mesh = new THREE.Mesh(geometry, this.materials.normal);
        return mesh;
    }

    /**
     * Create a cylinder between two points
     */
    _createCylinder(pointA, pointB) {
        const direction = new THREE.Vector3().subVectors(pointB, pointA);
        const length = direction.length();

        if (length < 0.001) return null;

        const geometry = new THREE.CylinderGeometry(
            this.weldEdgeRadius,  // top radius
            this.weldEdgeRadius,  // bottom radius
            length,               // height
            8                     // radial segments
        );

        // Cylinder is created along Y axis, need to rotate to match direction
        const mesh = new THREE.Mesh(geometry, this.materials.normal);

        // Position at midpoint
        const midpoint = new THREE.Vector3().addVectors(pointA, pointB).multiplyScalar(0.5);
        mesh.position.copy(midpoint);

        // Rotate to align with direction
        const axis = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction.normalize());
        mesh.quaternion.copy(quaternion);

        return mesh;
    }

    /**
     * Clear weld interface lines from the scene
     */
    _clearWeldInterfaces() {
        if (this.weldInterfaceGroup) {
            this.weldInterfaceGroup.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) object.material.dispose();
            });
            this.scene.remove(this.weldInterfaceGroup);
            this.weldInterfaceGroup = null;
        }
    }

    /**
     * Activate welding mode for the given assembly (legacy, uses existing scene)
     */
    activate(assemblyPersid) {
        if (this.active) {
            this.deactivate();
        }

        this.active = true;
        this.activeAssemblyPersid = assemblyPersid;

        // Update UI button state
        this._updateButtonState(assemblyPersid, true);

        // Extract edges from loaded models
        this._extractEdges();

        // Find nearby edges between different parts
        this._findNearbyEdges();

        // Highlight nearby edges
        this.weldHighlighter.highlightNearbyEdges(this.nearbyEdgePairs);

        // Add event listeners
        this.renderer.domElement.addEventListener('mousemove', this._onMouseMove);
        this.renderer.domElement.addEventListener('click', this._onClick);

        console.log(`Welding mode activated for assembly: ${assemblyPersid}`);
    }

    /**
     * Deactivate welding mode
     */
    deactivate() {
        if (!this.active) return;

        // Update UI button state
        this._updateButtonState(this.activeAssemblyPersid, false);

        // Clear highlights
        this.weldHighlighter.clearHighlights();

        // Clear weld interface lines
        this._clearWeldInterfaces();

        // Clear hover and selection state
        this.hoveredEdge = null;
        this.selectedWeldEdges.clear();
        this.renderer.domElement.style.cursor = 'default';

        // Remove event listeners
        this.renderer.domElement.removeEventListener('mousemove', this._onMouseMove);
        this.renderer.domElement.removeEventListener('click', this._onClick);

        // Remove loaded assembly models
        this._clearLoadedModels();

        this.active = false;
        this.activeAssemblyPersid = null;
        this.activeCadfileUuid = null;
        this.weldInterfaces = null;
        this.nearbyEdgePairs = [];
        this.partEdges.clear();
        this.instanceTransforms.clear();

        console.log('Welding mode deactivated');
    }

    /**
     * Clear all loaded models from the scene
     */
    _clearLoadedModels() {
        // Remove assembly group with all its children
        if (this.assemblyGroup) {
            this.assemblyGroup.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(m => m.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            this.scene.remove(this.assemblyGroup);
            this.assemblyGroup = null;
        }

        this.loadedModels.clear();
    }

    /**
     * Clear existing models from the scene (from regular viewing mode)
     */
    _clearExistingModels() {
        // Find and remove any existing loaded models (not lights, cameras, or our groups)
        const toRemove = [];
        const ourGroups = ['weld-highlights', 'welds', 'weld-interfaces', 'welding-assembly'];

        this.scene.traverse((object) => {
            // Skip lights, cameras, and our own groups
            if (object.isLight || object.isCamera) return;
            if (ourGroups.includes(object.name)) return;
            if (object === this.scene) return;

            // Remove root-level groups/meshes that aren't ours
            if (object.parent === this.scene && object.isMesh) {
                toRemove.push(object);
            }
            if (object.parent === this.scene && object.isGroup &&
                !ourGroups.includes(object.name)) {
                toRemove.push(object);
            }
        });

        for (const obj of toRemove) {
            obj.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.scene.remove(obj);
            console.log(`Removed existing model: ${obj.name || obj.type}`);
        }

        // Also clear the global currentModel reference if it exists
        if (window.currentModel) {
            window.currentModel = null;
        }
    }

    /**
     * Extract edge geometries from the currently loaded GLB model
     */
    _extractEdges() {
        this.partEdges.clear();

        // IMPORTANT: Update world matrices before extracting edges
        // This ensures all positions are in world space
        this.scene.updateMatrixWorld(true);

        // First, log scene structure for debugging
        console.log('Scene structure:');
        this._logSceneStructure(this.scene, 0);

        // Find all meshes first - these represent parts
        const meshes = [];
        this.scene.traverse((object) => {
            if (object.isMesh) {
                meshes.push(object);
            }
        });
        console.log(`Found ${meshes.length} meshes (parts)`);

        // Now find edges and associate them with the nearest parent mesh
        this.scene.traverse((object) => {
            if (object.isLine || object.isLineSegments) {
                const geometry = object.geometry;
                if (geometry && geometry.attributes.position) {
                    // Try to find a part ID from the object hierarchy
                    let partId = this._findPartId(object);

                    if (!this.partEdges.has(partId)) {
                        this.partEdges.set(partId, []);
                    }

                    this.partEdges.get(partId).push({
                        object: object,
                        geometry: geometry,
                        worldMatrix: object.matrixWorld.clone()
                    });
                }
            }
        });

        console.log(`Extracted edges from ${this.partEdges.size} parts`);
        for (const [partId, edges] of this.partEdges) {
            console.log(`  Part "${partId}": ${edges.length} edge objects`);
        }
    }

    /**
     * Find the part ID for an edge by looking at its hierarchy
     */
    _findPartId(edgeObject) {
        // Strategy 1: Check userData on the edge or its ancestors
        let current = edgeObject;
        while (current) {
            if (current.userData && current.userData.persid) {
                return current.userData.persid;
            }
            if (current.userData && current.userData.name) {
                return current.userData.name;
            }
            current = current.parent;
        }

        // Strategy 2: Find the nearest mesh sibling and use its name
        if (edgeObject.parent) {
            for (const sibling of edgeObject.parent.children) {
                if (sibling.isMesh && sibling.name) {
                    return sibling.name;
                }
            }
            // Use parent's name if it has one
            if (edgeObject.parent.name && edgeObject.parent.name !== 'Scene') {
                return edgeObject.parent.name;
            }
        }

        // Strategy 3: Use the edge object's own name if meaningful
        if (edgeObject.name && edgeObject.name.length > 0) {
            return edgeObject.name;
        }

        // Fallback: use uuid
        return edgeObject.uuid;
    }

    /**
     * Log scene structure for debugging
     */
    _logSceneStructure(object, depth) {
        const indent = '  '.repeat(depth);
        const type = object.isMesh ? 'Mesh' :
                     object.isLine ? 'Line' :
                     object.isLineSegments ? 'LineSegments' :
                     object.isGroup ? 'Group' : 'Object3D';
        console.log(`${indent}${type}: "${object.name}" (children: ${object.children.length})`);

        // Only log first 3 levels to avoid spam
        if (depth < 3) {
            for (const child of object.children) {
                this._logSceneStructure(child, depth + 1);
            }
        }
    }

    /**
     * Find pairs of edges from different parts that are close together
     */
    _findNearbyEdges() {
        // Try edge-based proximity first
        this.nearbyEdgePairs = this.edgeProximity.findNearbyEdges(this.partEdges);
        console.log(`Found ${this.nearbyEdgePairs.length} nearby edge pairs`);

        // If no edge pairs found, try vertex-based proximity detection
        if (this.nearbyEdgePairs.length === 0) {
            console.log('No edge pairs found, trying vertex-based proximity...');
            this._findNearbyVertices();
        }
    }

    /**
     * Find vertices from different parts that are close together.
     * This is more reliable than edge-based detection for finding contact points.
     */
    _findNearbyVertices() {
        const threshold = 5.0; // mm - vertices must be this close
        const contactPoints = [];

        // Collect mesh data from each part
        const partMeshes = new Map();

        if (this.assemblyGroup) {
            this.assemblyGroup.traverse((object) => {
                if (object.isMesh && object.geometry) {
                    const partId = object.userData.persid ||
                                   (object.parent ? object.parent.userData.persid : null) ||
                                   object.uuid;

                    if (!partMeshes.has(partId)) {
                        partMeshes.set(partId, []);
                    }
                    partMeshes.get(partId).push(object);
                }
            });
        }

        console.log(`Found ${partMeshes.size} parts with meshes for vertex analysis`);

        const partIds = Array.from(partMeshes.keys());
        let pairsChecked = 0;
        let contactsFound = 0;

        // Compare vertices between different parts
        for (let i = 0; i < partIds.length; i++) {
            for (let j = i + 1; j < partIds.length; j++) {
                const partA = partIds[i];
                const partB = partIds[j];

                const meshesA = partMeshes.get(partA);
                const meshesB = partMeshes.get(partB);

                pairsChecked++;

                // Check for close vertices between these parts
                const contacts = this._findContactsBetweenParts(meshesA, meshesB, threshold);

                if (contacts.length > 0) {
                    contactsFound += contacts.length;
                    console.log(`  Contact found: ${partA} <-> ${partB}: ${contacts.length} points`);

                    // Add to nearby pairs for highlighting
                    for (const contact of contacts) {
                        contactPoints.push({
                            partA: partA,
                            partB: partB,
                            point: contact.midpoint,
                            distance: contact.distance
                        });
                    }
                }
            }
        }

        console.log(`Vertex analysis: ${pairsChecked} part pairs checked, ${contactsFound} contact points found`);

        // Store contact points for visualization
        this.contactPoints = contactPoints;

        // Highlight contact points
        if (contactPoints.length > 0) {
            this._highlightContactPoints(contactPoints);
        }
    }

    /**
     * Find contact points between two sets of meshes
     */
    _findContactsBetweenParts(meshesA, meshesB, threshold) {
        const contacts = [];
        const thresholdSq = threshold * threshold;

        for (const meshA of meshesA) {
            const posA = meshA.geometry.attributes.position;
            if (!posA) continue;

            // Get world matrix for meshA
            meshA.updateMatrixWorld(true);
            const matrixA = meshA.matrixWorld;

            for (const meshB of meshesB) {
                const posB = meshB.geometry.attributes.position;
                if (!posB) continue;

                // Get world matrix for meshB
                meshB.updateMatrixWorld(true);
                const matrixB = meshB.matrixWorld;

                // Sample vertices (don't check every single one for performance)
                const stepA = Math.max(1, Math.floor(posA.count / 100));
                const stepB = Math.max(1, Math.floor(posB.count / 100));

                const tempA = new THREE.Vector3();
                const tempB = new THREE.Vector3();

                for (let ia = 0; ia < posA.count; ia += stepA) {
                    tempA.fromBufferAttribute(posA, ia);
                    tempA.applyMatrix4(matrixA);

                    for (let ib = 0; ib < posB.count; ib += stepB) {
                        tempB.fromBufferAttribute(posB, ib);
                        tempB.applyMatrix4(matrixB);

                        const distSq = tempA.distanceToSquared(tempB);
                        if (distSq <= thresholdSq) {
                            contacts.push({
                                pointA: tempA.clone(),
                                pointB: tempB.clone(),
                                midpoint: new THREE.Vector3().addVectors(tempA, tempB).multiplyScalar(0.5),
                                distance: Math.sqrt(distSq)
                            });
                            // Only record one contact per vertex pair region
                            break;
                        }
                    }
                }
            }
        }

        return contacts;
    }

    /**
     * Highlight contact points with small spheres
     */
    _highlightContactPoints(contactPoints) {
        const sphereGeometry = new THREE.SphereGeometry(3, 8, 8); // 3mm radius
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.7
        });

        for (const contact of contactPoints) {
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.copy(contact.point);
            sphere.userData.isContactHighlight = true;
            this.scene.add(sphere);
        }

        console.log(`Added ${contactPoints.length} contact point highlights`);
    }

    /**
     * Handle mouse move for hover effects
     */
    _onMouseMove(event) {
        if (!this.active) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.set(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        // Raycast against weld interface tubes
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Get all weld interface meshes (tubes/cylinders)
        const weldMeshes = [];
        if (this.weldInterfaceGroup) {
            this.weldInterfaceGroup.traverse((obj) => {
                if (obj.isMesh && obj.userData.isWeldInterface) {
                    weldMeshes.push(obj);
                }
            });
        }

        const intersects = this.raycaster.intersectObjects(weldMeshes, false);

        // Clear previous hover
        if (this.hoveredEdge && this.hoveredEdge !== intersects[0]?.object) {
            // Restore to normal or selected material
            if (this.selectedWeldEdges.has(this.hoveredEdge)) {
                this.hoveredEdge.material = this.materials.selected;
            } else {
                this.hoveredEdge.material = this.materials.normal;
            }
            this.hoveredEdge = null;
        }

        // Set new hover
        if (intersects.length > 0) {
            const hitLine = intersects[0].object;
            if (hitLine !== this.hoveredEdge) {
                this.hoveredEdge = hitLine;
                // Only change to hover color if not already selected
                if (!this.selectedWeldEdges.has(hitLine)) {
                    hitLine.material = this.materials.hovered;
                }
                // Change cursor to pointer
                this.renderer.domElement.style.cursor = 'pointer';
            }
        } else {
            this.renderer.domElement.style.cursor = 'default';
        }
    }

    /**
     * Handle click to select/deselect a weld edge
     */
    _onClick(event) {
        if (!this.active) return;

        // If we have a hovered edge, toggle its selection
        if (this.hoveredEdge) {
            this._toggleWeldSelection(this.hoveredEdge);
        }
    }

    /**
     * Toggle selection state of a weld interface edge
     */
    _toggleWeldSelection(line) {
        if (this.selectedWeldEdges.has(line)) {
            // Deselect
            this.selectedWeldEdges.delete(line);
            line.material = this.materials.hovered; // Keep hovered since mouse is still over it
            console.log(`Deselected weld edge: ${line.userData.componentA} <-> ${line.userData.componentB}`);
        } else {
            // Select
            this.selectedWeldEdges.add(line);
            line.material = this.materials.selected;
            console.log(`Selected weld edge: ${line.userData.componentA} <-> ${line.userData.componentB}, ` +
                        `area: ${line.userData.contactArea.toFixed(1)}mm²`);
        }

        // Log total selected
        console.log(`Total selected weld edges: ${this.selectedWeldEdges.size}`);
    }

    /**
     * Create a weld at the selected edge pair location
     */
    _createWeld(edgePair) {
        const weld = this.weldGeometry.createWeld(edgePair);
        if (weld) {
            this.welds.push(weld);
            console.log(`Created weld #${this.welds.length}`);
        }
    }

    /**
     * Update the weld button UI state
     */
    _updateButtonState(assemblyPersid, active) {
        const buttons = document.querySelectorAll('.weld-btn');
        buttons.forEach(btn => {
            if (btn.onclick && btn.onclick.toString().includes(assemblyPersid)) {
                if (active) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });
    }

    /**
     * Get all defined welds
     */
    getWelds() {
        return this.welds;
    }

    /**
     * Clear all welds
     */
    clearWelds() {
        this.welds.forEach(weld => {
            this.weldGeometry.removeWeld(weld);
        });
        this.welds = [];
    }

    /**
     * Dispose of resources
     */
    dispose() {
        this.deactivate();
        this.clearWelds();
        this.weldHighlighter.dispose();
        this.weldGeometry.dispose();
    }
}
