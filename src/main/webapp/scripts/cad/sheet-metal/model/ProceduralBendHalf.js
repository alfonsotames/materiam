import * as THREE from 'three';

/**
 * Procedurally generated half of a bend arc.
 * Creates curved geometry that connects two flanges at a hinge.
 */
export class ProceduralBendHalf extends THREE.Mesh {
    constructor(radius, width, thickness, materialOrColor, totalArcLength) {
        const geometry = new THREE.BufferGeometry();
        
        let material;
        let ownMaterial = false;

        if (materialOrColor && materialOrColor.isMaterial) {
            material = materialOrColor;
        } else {
            material = new THREE.MeshStandardMaterial({
                color: materialOrColor || 0xffff00,
                roughness: 0.3,
                metalness: 0.7,
                side: THREE.DoubleSide
            });
            ownMaterial = true;
        }

        super(geometry, material);

        this.bendRadius = radius;
        this.bendWidth = width;
        this.bendThickness = thickness;
        this.totalArcLength = totalArcLength;
        this._ownMaterial = ownMaterial;

        // Create edge lines object
        this.edgeLines = new THREE.LineSegments(
            new THREE.BufferGeometry(),
            new THREE.LineBasicMaterial({ color: 0x000000 })
        );
        this.add(this.edgeLines);

        // Initialize with 0 angle (invisible)
        this.updateGeometry(0);
    }

    /**
     * Update the bend geometry for a given arc angle
     * @param {number} currentAngleRad - The arc angle in radians
     */
    updateGeometry(currentAngleRad) {
        if (this.geometry) this.geometry.dispose();
        if (this.edgeLines.geometry) this.edgeLines.geometry.dispose();

        // If angle is effectively zero, hide geometry to prevent artifacts
        if (Math.abs(currentAngleRad) < 0.001) {
            this.geometry = new THREE.BufferGeometry();
            this.edgeLines.geometry = new THREE.BufferGeometry();
            return;
        }

        const rInner = this.bendRadius;
        const rOuter = this.bendRadius + this.bendThickness;
        const halfW = this.bendWidth / 2;

        // High resolution for smooth appearance
        const segments = Math.max(8, Math.ceil(Math.abs(currentAngleRad) * 32));

        const positions = [];
        const normals = [];
        const indices = [];
        let idx = 0;

        const addQuad = (p0, p1, p2, p3, n) => {
            const base = idx;
            positions.push(...p0, ...p1, ...p2, ...p3);
            normals.push(...n, ...n, ...n, ...n);
            indices.push(base, base + 1, base + 2);
            indices.push(base, base + 2, base + 3);
            idx += 4;
        };

        // Generate arc segments
        for (let i = 0; i < segments; i++) {
            const t0 = i / segments;
            const t1 = (i + 1) / segments;
            const theta0 = t0 * currentAngleRad;
            const theta1 = t1 * currentAngleRad;

            const cos0 = Math.cos(theta0), sin0 = Math.sin(theta0);
            const cos1 = Math.cos(theta1), sin1 = Math.sin(theta1);

            // Inner surface points
            const xi0 = rInner * cos0, yi0 = rInner * sin0;
            const xi1 = rInner * cos1, yi1 = rInner * sin1;

            // Outer surface points
            const xo0 = rOuter * cos0, yo0 = rOuter * sin0;
            const xo1 = rOuter * cos1, yo1 = rOuter * sin1;

            // Radial normal direction
            const mx = (cos0 + cos1) / 2;
            const my = (sin0 + sin1) / 2;
            const nm = Math.sqrt(mx * mx + my * my);
            const nnx = nm > 0.001 ? mx / nm : 1;
            const nny = nm > 0.001 ? my / nm : 0;

            // Inner Surface
            addQuad(
                [xi0, yi0, -halfW],
                [xi0, yi0, halfW],
                [xi1, yi1, halfW],
                [xi1, yi1, -halfW],
                [-nnx, -nny, 0]
            );

            // Outer Surface
            addQuad(
                [xo0, yo0, halfW],
                [xo0, yo0, -halfW],
                [xo1, yo1, -halfW],
                [xo1, yo1, halfW],
                [nnx, nny, 0]
            );

            // Side Caps (Z+ and Z-)
            addQuad(
                [xi0, yi0, halfW],
                [xo0, yo0, halfW],
                [xo1, yo1, halfW],
                [xi1, yi1, halfW],
                [0, 0, 1]
            );
            addQuad(
                [xi1, yi1, -halfW],
                [xo1, yo1, -halfW],
                [xo0, yo0, -halfW],
                [xi0, yi0, -halfW],
                [0, 0, -1]
            );
        }

        // Bisector Face (at θ=0)
        addQuad(
            [rInner, 0, halfW],
            [rInner, 0, -halfW],
            [rOuter, 0, -halfW],
            [rOuter, 0, halfW],
            [0, -1, 0]
        );

        // Flange Face (at θ=currentAngleRad)
        const cosTip = Math.cos(currentAngleRad), sinTip = Math.sin(currentAngleRad);
        const xiTip = rInner * cosTip, yiTip = rInner * sinTip;
        const xoTip = rOuter * cosTip, yoTip = rOuter * sinTip;
        const tx = -sinTip, ty = cosTip;

        addQuad(
            [xiTip, yiTip, -halfW],
            [xiTip, yiTip, halfW],
            [xoTip, yoTip, halfW],
            [xoTip, yoTip, -halfW],
            [tx, ty, 0]
        );

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        this.geometry.setIndex(indices);

        // Generate edge lines
        this._updateEdgeLines(currentAngleRad, rInner, rOuter, halfW, segments);
    }

    _updateEdgeLines(currentAngleRad, rInner, rOuter, halfW, segments) {
        const edgePositions = [];

        const addLine = (p0, p1) => {
            edgePositions.push(...p0, ...p1);
        };

        for (let i = 0; i < segments; i++) {
            const t0 = i / segments;
            const t1 = (i + 1) / segments;
            const theta0 = t0 * currentAngleRad;
            const theta1 = t1 * currentAngleRad;

            const cos0 = Math.cos(theta0), sin0 = Math.sin(theta0);
            const cos1 = Math.cos(theta1), sin1 = Math.sin(theta1);

            const xi0 = rInner * cos0, yi0 = rInner * sin0;
            const xi1 = rInner * cos1, yi1 = rInner * sin1;
            const xo0 = rOuter * cos0, yo0 = rOuter * sin0;
            const xo1 = rOuter * cos1, yo1 = rOuter * sin1;

            // Inner arc edges
            addLine([xi0, yi0, halfW], [xi1, yi1, halfW]);
            addLine([xi0, yi0, -halfW], [xi1, yi1, -halfW]);
            // Outer arc edges
            addLine([xo0, yo0, halfW], [xo1, yo1, halfW]);
            addLine([xo0, yo0, -halfW], [xo1, yo1, -halfW]);
        }

        this.edgeLines.geometry = new THREE.BufferGeometry();
        this.edgeLines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
    }

    /**
     * Dispose of geometry and materials
     */
    dispose() {
        if (this.geometry) this.geometry.dispose();
        if (this.material && this._ownMaterial) this.material.dispose();
        if (this.edgeLines) {
            this.edgeLines.geometry.dispose();
            this.edgeLines.material.dispose();
        }
    }
}
