/**
 * EdgeProximity.js - Finds nearby edges between different parts
 *
 * Analyzes edge geometries to find pairs of edges from different parts
 * that are close enough to potentially be welded together.
 */

import * as THREE from 'three';

export class EdgeProximity {
    constructor(options = {}) {
        // Maximum distance between edges to be considered "nearby"
        // Set to 5mm - only find edges that are actually touching
        this.proximityThreshold = options.proximityThreshold || 5.0; // mm

        // Minimum overlap ratio for edges to be considered weldable
        // Lowered to 0.05 to be more permissive
        this.minOverlapRatio = options.minOverlapRatio || 0.05;

        // Sampling resolution for edge analysis
        this.sampleCount = options.sampleCount || 20;

        // Debug mode
        this.debug = true;
    }

    /**
     * Find pairs of edges from different parts that are near each other
     * @param {Map} partEdges - Map of partId -> edge data array
     * @returns {Array} Array of edge pair objects
     */
    findNearbyEdges(partEdges) {
        const nearbyPairs = [];
        const partIds = Array.from(partEdges.keys());

        if (this.debug) {
            console.log(`EdgeProximity: Comparing ${partIds.length} parts`);
            console.log(`  Threshold: ${this.proximityThreshold}mm, MinOverlap: ${this.minOverlapRatio}`);
        }

        let comparisons = 0;
        let minDistanceFound = Infinity;

        // Compare edges between different parts
        for (let i = 0; i < partIds.length; i++) {
            for (let j = i + 1; j < partIds.length; j++) {
                const partA = partIds[i];
                const partB = partIds[j];

                const edgesA = partEdges.get(partA);
                const edgesB = partEdges.get(partB);

                comparisons++;
                const result = this._findNearbyEdgesBetweenParts(
                    partA, edgesA,
                    partB, edgesB
                );

                nearbyPairs.push(...result.pairs);

                if (result.minDistance < minDistanceFound) {
                    minDistanceFound = result.minDistance;
                }
            }
        }

        if (this.debug) {
            console.log(`EdgeProximity: ${comparisons} part comparisons done`);
            console.log(`  Overall minimum distance found: ${minDistanceFound.toFixed(2)}mm`);
            console.log(`  Threshold: ${this.proximityThreshold}mm`);
            console.log(`  Nearby pairs found: ${nearbyPairs.length}`);
        }

        return nearbyPairs;
    }

    /**
     * Find nearby edges between two specific parts
     * Returns { pairs: [], minDistance: number }
     */
    _findNearbyEdgesBetweenParts(partIdA, edgesA, partIdB, edgesB) {
        const pairs = [];
        let minDistBetweenParts = Infinity;

        for (const edgeA of edgesA) {
            for (const edgeB of edgesB) {
                const proximity = this._analyzeEdgeProximity(edgeA, edgeB);

                if (proximity.minDistance < minDistBetweenParts) {
                    minDistBetweenParts = proximity.minDistance;
                }

                if (proximity.isNearby) {
                    if (this.debug) {
                        console.log(`  Found nearby pair: ${partIdA} <-> ${partIdB}, dist=${proximity.minDistance.toFixed(2)}mm`);
                    }
                    pairs.push({
                        partA: partIdA,
                        partB: partIdB,
                        edgeA: edgeA,
                        edgeB: edgeB,
                        distance: proximity.minDistance,
                        overlapRatio: proximity.overlapRatio,
                        weldSegment: proximity.weldSegment
                    });
                }
            }
        }

        // Log first few comparisons for debugging
        if (this.debug && !this._logCount) {
            this._logCount = 0;
        }
        if (this.debug && this._logCount < 10) {
            console.log(`  Parts ${partIdA} <-> ${partIdB}: minDist=${minDistBetweenParts.toFixed(2)}mm, pairs=${pairs.length}`);
            this._logCount++;
        }

        return { pairs, minDistance: minDistBetweenParts };
    }

    /**
     * Analyze the proximity between two edges
     */
    _analyzeEdgeProximity(edgeA, edgeB) {
        const pointsA = this._extractEdgePoints(edgeA);
        const pointsB = this._extractEdgePoints(edgeB);

        if (pointsA.length < 2 || pointsB.length < 2) {
            if (this.debug && !this._loggedPointsWarning) {
                console.warn(`EdgeProximity: Edge has < 2 points (A: ${pointsA.length}, B: ${pointsB.length})`);
                this._loggedPointsWarning = true;
            }
            return { isNearby: false };
        }

        // Sample points along both edges
        const samplesA = this._sampleEdge(pointsA, this.sampleCount);
        const samplesB = this._sampleEdge(pointsB, this.sampleCount);

        // Find minimum distance between samples
        let minDistance = Infinity;
        let nearbyCount = 0;
        let closestPointA = null;
        let closestPointB = null;

        for (const pointA of samplesA) {
            for (const pointB of samplesB) {
                const distance = pointA.distanceTo(pointB);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestPointA = pointA.clone();
                    closestPointB = pointB.clone();
                }

                if (distance <= this.proximityThreshold) {
                    nearbyCount++;
                }
            }
        }

        const overlapRatio = nearbyCount / (samplesA.length * samplesB.length);
        const isNearby = minDistance <= this.proximityThreshold &&
                         overlapRatio >= this.minOverlapRatio;

        // Calculate the weld segment (line between closest points on each edge)
        let weldSegment = null;
        if (isNearby && closestPointA && closestPointB) {
            weldSegment = this._calculateWeldSegment(
                pointsA, pointsB,
                closestPointA, closestPointB
            );
        }

        return {
            isNearby,
            minDistance,
            overlapRatio,
            weldSegment
        };
    }

    /**
     * Extract world-space points from an edge geometry
     */
    _extractEdgePoints(edge) {
        const geometry = edge.geometry;
        const positions = geometry.attributes.position;
        const worldMatrix = edge.worldMatrix;

        const points = [];
        const tempVec = new THREE.Vector3();

        for (let i = 0; i < positions.count; i++) {
            tempVec.fromBufferAttribute(positions, i);
            tempVec.applyMatrix4(worldMatrix);
            points.push(tempVec.clone());
        }

        return points;
    }

    /**
     * Sample points along an edge at regular intervals
     */
    _sampleEdge(points, sampleCount) {
        if (points.length < 2) return points;

        // Calculate total edge length
        let totalLength = 0;
        const segments = [];

        for (let i = 0; i < points.length - 1; i++) {
            const length = points[i].distanceTo(points[i + 1]);
            totalLength += length;
            segments.push({
                start: points[i],
                end: points[i + 1],
                length: length
            });
        }

        if (totalLength === 0) return [points[0]];

        // Sample at regular intervals
        const samples = [];
        const stepLength = totalLength / (sampleCount - 1);

        let currentLength = 0;
        let segmentIndex = 0;
        let segmentProgress = 0;

        for (let i = 0; i < sampleCount; i++) {
            const targetLength = i * stepLength;

            // Find the segment containing this target length
            while (segmentIndex < segments.length - 1 &&
                   currentLength + segments[segmentIndex].length < targetLength) {
                currentLength += segments[segmentIndex].length;
                segmentIndex++;
            }

            const segment = segments[segmentIndex];
            if (segment.length > 0) {
                segmentProgress = (targetLength - currentLength) / segment.length;
                segmentProgress = Math.max(0, Math.min(1, segmentProgress));
            } else {
                segmentProgress = 0;
            }

            const sample = new THREE.Vector3().lerpVectors(
                segment.start, segment.end, segmentProgress
            );
            samples.push(sample);
        }

        return samples;
    }

    /**
     * Calculate the weld segment definition
     */
    _calculateWeldSegment(pointsA, pointsB, closestPointA, closestPointB) {
        // Find the range of the weld along both edges
        const weldPointsA = [];
        const weldPointsB = [];

        // Get all points from both edges that are within threshold
        for (const pointA of pointsA) {
            for (const pointB of pointsB) {
                if (pointA.distanceTo(pointB) <= this.proximityThreshold) {
                    if (!weldPointsA.some(p => p.equals(pointA))) {
                        weldPointsA.push(pointA);
                    }
                    if (!weldPointsB.some(p => p.equals(pointB))) {
                        weldPointsB.push(pointB);
                    }
                }
            }
        }

        // Calculate midpoint and direction
        const midpoint = new THREE.Vector3().addVectors(
            closestPointA, closestPointB
        ).multiplyScalar(0.5);

        // Direction is along the edge (approximate using first and last weld points)
        let direction = new THREE.Vector3(0, 0, 1);
        if (weldPointsA.length >= 2) {
            direction = new THREE.Vector3().subVectors(
                weldPointsA[weldPointsA.length - 1],
                weldPointsA[0]
            ).normalize();
        }

        // Calculate weld length
        let weldLength = 0;
        if (weldPointsA.length >= 2) {
            weldLength = weldPointsA[0].distanceTo(
                weldPointsA[weldPointsA.length - 1]
            );
        }

        return {
            midpoint,
            direction,
            length: weldLength,
            gap: closestPointA.distanceTo(closestPointB),
            pointsA: weldPointsA,
            pointsB: weldPointsB
        };
    }

    /**
     * Set the proximity threshold
     */
    setThreshold(threshold) {
        this.proximityThreshold = threshold;
    }

    /**
     * Set the minimum overlap ratio
     */
    setMinOverlapRatio(ratio) {
        this.minOverlapRatio = ratio;
    }
}
