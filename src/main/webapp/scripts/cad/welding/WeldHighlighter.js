/**
 * WeldHighlighter.js - Handles edge highlighting and hover effects
 *
 * Provides visual feedback for edges that can be welded, including
 * raycast-based hover detection and highlight rendering.
 */

import * as THREE from 'three';

export class WeldHighlighter {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        // Raycaster for hover detection
        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Line.threshold = 5; // Pixel threshold for line picking

        // Highlight materials
        this.nearbyMaterial = new THREE.LineBasicMaterial({
            color: 0xff9800, // Orange for nearby edges
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });

        this.hoverMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff00, // Green for hovered edge
            linewidth: 3,
            transparent: true,
            opacity: 1.0
        });

        // Highlight group
        this.highlightGroup = new THREE.Group();
        this.highlightGroup.name = 'weld-highlights';
        this.scene.add(this.highlightGroup);

        // Hover state
        this.hoveredEdgePair = null;
        this.hoverHighlight = null;

        // Store original materials for restoration
        this.originalMaterials = new Map();

        // Nearby edge pair geometries
        this.nearbyHighlights = [];
    }

    /**
     * Highlight all nearby edge pairs
     */
    highlightNearbyEdges(edgePairs) {
        this.clearHighlights();

        for (const pair of edgePairs) {
            // Create highlight geometry for the weld segment
            if (pair.weldSegment) {
                const highlight = this._createWeldSegmentHighlight(pair);
                if (highlight) {
                    highlight.userData.edgePair = pair;
                    this.highlightGroup.add(highlight);
                    this.nearbyHighlights.push(highlight);
                }
            }
        }
    }

    /**
     * Create a highlight for a weld segment
     */
    _createWeldSegmentHighlight(pair) {
        const segment = pair.weldSegment;
        if (!segment || segment.pointsA.length < 2) {
            return null;
        }

        // Create a line showing the potential weld location
        const points = [];

        // Use the midpoints between closest points on each edge
        for (let i = 0; i < Math.min(segment.pointsA.length, segment.pointsB.length); i++) {
            const midpoint = new THREE.Vector3().addVectors(
                segment.pointsA[i],
                segment.pointsB[i]
            ).multiplyScalar(0.5);
            points.push(midpoint);
        }

        if (points.length < 2) {
            // Fallback: create line between the two closest points
            points.push(segment.midpoint.clone());
            points.push(segment.midpoint.clone().add(
                segment.direction.clone().multiplyScalar(segment.length || 10)
            ));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, this.nearbyMaterial.clone());
        line.renderOrder = 999; // Render on top

        return line;
    }

    /**
     * Update hover state based on mouse position
     */
    updateHover(mouse, edgePairs) {
        // Clear previous hover
        if (this.hoverHighlight) {
            this.hoverHighlight.material = this.nearbyMaterial.clone();
            this.hoverHighlight = null;
        }
        this.hoveredEdgePair = null;

        // Raycast against highlight lines
        this.raycaster.setFromCamera(mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.nearbyHighlights, false);

        if (intersects.length > 0) {
            const closest = intersects[0];
            this.hoverHighlight = closest.object;
            this.hoverHighlight.material = this.hoverMaterial.clone();
            this.hoveredEdgePair = closest.object.userData.edgePair;

            // Change cursor
            this.renderer.domElement.style.cursor = 'pointer';
        } else {
            this.renderer.domElement.style.cursor = 'default';
        }
    }

    /**
     * Get the currently hovered edge pair
     */
    getHoveredEdge() {
        return this.hoveredEdgePair;
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        // Remove all highlight objects
        for (const highlight of this.nearbyHighlights) {
            this.highlightGroup.remove(highlight);
            if (highlight.geometry) {
                highlight.geometry.dispose();
            }
            if (highlight.material) {
                highlight.material.dispose();
            }
        }
        this.nearbyHighlights = [];

        // Clear hover state
        this.hoveredEdgePair = null;
        this.hoverHighlight = null;

        // Reset cursor
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.style.cursor = 'default';
        }
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        this.clearHighlights();

        if (this.highlightGroup.parent) {
            this.highlightGroup.parent.remove(this.highlightGroup);
        }

        this.nearbyMaterial.dispose();
        this.hoverMaterial.dispose();
    }
}
