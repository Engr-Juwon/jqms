import React, { useRef, useState, useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  Environment,
  ContactShadows,
  Html,
  Box as DreiBox,
  Cylinder,
} from "@react-three/drei";
import * as THREE from "three";
import {
  Box,
  Layers,
  Ruler,
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  Grid3x3,
  Crosshair,
  ExternalLink,
  Sun,
  Moon,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { StructuralElement } from "@/types";

/* ─────────────────────────────────────────────────────────────────────────
   3D PRIMITIVE COMPONENTS — True Structural Engineering Geometry & Rebar
   ───────────────────────────────────────────────────────────────────────── */

const CONCRETE_COLOR = "#cbd5e1";
const CONCRETE_ROUGHNESS = 0.85;
const CONCRETE_METALNESS = 0.05;
const REBAR_COLOR = "#b45309";

/* ─── Base Concrete Material ─── */
const ConcreteMaterial: React.FC<{ wireframe?: boolean; color?: string }> = ({
  wireframe,
  color = CONCRETE_COLOR,
}) => (
  <meshStandardMaterial
    color={wireframe ? "#f97316" : color}
    roughness={CONCRETE_ROUGHNESS}
    metalness={CONCRETE_METALNESS}
    wireframe={wireframe}
  />
);

/* ─── Rectangular Column ─── */
const RectangularColumn3D: React.FC<{
  length: number;
  width: number;
  height: number;
  showRebar: boolean;
  showDimensions: boolean;
  wireframe: boolean;
}> = ({ length, width, height, showRebar, showDimensions, wireframe }) => {
  const sL = (length && length > 50 ? length / 1000 : length) || 0.6;
  const sW = (width && width > 50 ? width / 1000 : width) || 0.6;
  const sH = (height && height > 50 ? height / 1000 : height) || 3.0;

  const rebarPositions = useMemo(() => {
    if (!showRebar) return [];
    const bars: [number, number, number][] = [];
    const cover = 0.04; // 40mm clear cover
    const spacingX = Math.max(0.12, (sL - 2 * cover) / 2);
    const spacingZ = Math.max(0.12, (sW - 2 * cover) / 2);

    for (let x = -sL / 2 + cover; x <= sL / 2 - cover + 0.01; x += spacingX) {
      for (let z = -sW / 2 + cover; z <= sW / 2 - cover + 0.01; z += spacingZ) {
        bars.push([x, 0, z]);
      }
    }
    return bars;
  }, [sL, sW, showRebar]);

  return (
    <group>
      {/* Main concrete column body */}
      <DreiBox args={[sL, sH, sW]} position={[0, sH / 2, 0]}>
        <ConcreteMaterial wireframe={wireframe} />
      </DreiBox>

      {/* Vertical Rebar Cage */}
      {showRebar &&
        rebarPositions.map((pos, i) => (
          <Cylinder
            key={i}
            args={[0.012, 0.012, sH - 0.08, 8]}
            position={[pos[0], sH / 2, pos[2]]}
          >
            <meshStandardMaterial
              color={REBAR_COLOR}
              metalness={0.8}
              roughness={0.3}
            />
          </Cylinder>
        ))}

      {/* Dimension Labels */}
      {showDimensions && (
        <>
          <DimensionLabel
            start={[-sL / 2, 0, sW / 2 + 0.1]}
            end={[sL / 2, 0, sW / 2 + 0.1]}
            text={`${(sL * 1000).toFixed(0)} mm`}
            offset={[0, -0.15, 0]}
          />
          <DimensionLabel
            start={[sL / 2 + 0.1, 0, -sW / 2]}
            end={[sL / 2 + 0.1, 0, sW / 2]}
            text={`${(sW * 1000).toFixed(0)} mm`}
            offset={[0.15, 0, 0]}
            rotate
          />
          <DimensionLabel
            start={[-sL / 2 - 0.15, 0, -sW / 2 - 0.15]}
            end={[-sL / 2 - 0.15, sH, -sW / 2 - 0.15]}
            text={`${(sH * 1000).toFixed(0)} mm`}
            offset={[-0.2, 0, 0]}
          />
        </>
      )}
    </group>
  );
};

/* ─── Circular Column ─── */
const CircularColumn3D: React.FC<{
  diameter: number;
  height: number;
  showRebar: boolean;
  showDimensions: boolean;
  wireframe: boolean;
}> = ({ diameter, height, showRebar, showDimensions, wireframe }) => {
  const sD = (diameter && diameter > 50 ? diameter / 1000 : diameter) || 0.6;
  const sH = (height && height > 50 ? height / 1000 : height) || 3.0;
  const radius = sD / 2;

  const rebarCount = useMemo(() => {
    if (!showRebar) return 0;
    const circumference = Math.PI * (sD - 0.08);
    return Math.max(6, Math.floor(circumference / 0.12));
  }, [sD, showRebar]);

  return (
    <group>
      <Cylinder args={[radius, radius, sH, 32]} position={[0, sH / 2, 0]}>
        <ConcreteMaterial wireframe={wireframe} />
      </Cylinder>

      {showRebar &&
        Array.from({ length: rebarCount }).map((_, i) => {
          const angle = (i / rebarCount) * Math.PI * 2;
          const r = radius - 0.04;
          return (
            <Cylinder
              key={i}
              args={[0.012, 0.012, sH - 0.08, 8]}
              position={[Math.cos(angle) * r, sH / 2, Math.sin(angle) * r]}
            >
              <meshStandardMaterial
                color={REBAR_COLOR}
                metalness={0.8}
                roughness={0.3}
              />
            </Cylinder>
          );
        })}

      {showDimensions && (
        <>
          <DimensionLabel
            start={[-radius, 0, radius + 0.1]}
            end={[radius, 0, radius + 0.1]}
            text={`Ø ${(sD * 1000).toFixed(0)} mm`}
            offset={[0, -0.15, 0]}
          />
          <DimensionLabel
            start={[-radius - 0.15, 0, 0]}
            end={[-radius - 0.15, sH, 0]}
            text={`${(sH * 1000).toFixed(0)} mm`}
            offset={[-0.2, 0, 0]}
          />
        </>
      )}
    </group>
  );
};

/* ─── Inclined Column ─── */
const InclinedColumn3D: React.FC<{
  length: number;
  width: number;
  height: number;
  tiltAngle?: number;
  showRebar: boolean;
  showDimensions: boolean;
  wireframe: boolean;
}> = ({ length, width, height, tiltAngle = 12, showRebar, showDimensions, wireframe }) => {
  const sL = (length && length > 50 ? length / 1000 : length) || 0.6;
  const sW = (width && width > 50 ? width / 1000 : width) || 0.6;
  const sH = (height && height > 50 ? height / 1000 : height) || 3.0;
  const rad = (tiltAngle * Math.PI) / 180;

  return (
    <group rotation={[0, 0, rad]} position={[(sH / 2) * Math.sin(rad), (sH / 2) * Math.cos(rad), 0]}>
      <DreiBox args={[sL, sH, sW]}>
        <ConcreteMaterial wireframe={wireframe} />
      </DreiBox>

      {showDimensions && (
        <DimensionLabel
          start={[-sL / 2 - 0.15, -sH / 2, 0]}
          end={[-sL / 2 - 0.15, sH / 2, 0]}
          text={`Height: ${(sH * 1000).toFixed(0)} mm (${tiltAngle}° inclined)`}
          offset={[-0.2, 0, 0]}
        />
      )}
    </group>
  );
};

/* ─── Standard Beam ─── */
const Beam3D: React.FC<{
  length: number;
  width: number;
  depth: number;
  showRebar: boolean;
  showDimensions: boolean;
  wireframe: boolean;
}> = ({ length, width, depth, showRebar, showDimensions, wireframe }) => {
  const sL = (length && length > 50 ? length / 1000 : length) || 4.0;
  const sW = (width && width > 50 ? width / 1000 : width) || 0.4;
  const sD = (depth && depth > 50 ? depth / 1000 : depth) || 0.6;

  return (
    <group>
      <DreiBox args={[sL, sD, sW]} position={[0, sD / 2, 0]}>
        <ConcreteMaterial wireframe={wireframe} />
      </DreiBox>

      {showRebar && (
        <>
          {/* Bottom longitudinal tension bars */}
          {[-sW / 2 + 0.04, 0, sW / 2 - 0.04].map((z, i) => (
            <Cylinder
              key={`bot-${i}`}
              args={[0.012, 0.012, sL - 0.08, 8]}
              rotation={[0, 0, Math.PI / 2]}
              position={[0, 0.05, z]}
            >
              <meshStandardMaterial
                color={REBAR_COLOR}
                metalness={0.8}
                roughness={0.3}
              />
            </Cylinder>
          ))}
          {/* Top hanger bars */}
          {[-sW / 2 + 0.04, sW / 2 - 0.04].map((z, i) => (
            <Cylinder
              key={`top-${i}`}
              args={[0.01, 0.01, sL - 0.08, 8]}
              rotation={[0, 0, Math.PI / 2]}
              position={[0, sD - 0.05, z]}
            >
              <meshStandardMaterial
                color={REBAR_COLOR}
                metalness={0.8}
                roughness={0.3}
              />
            </Cylinder>
          ))}
          {/* Stirrups */}
          {Array.from({ length: Math.max(4, Math.floor(sL / 0.2)) }).map((_, i) => {
            const x = -sL / 2 + 0.1 + i * 0.2;
            return (
              <group key={`stirrup-${i}`} position={[x, sD / 2, 0]}>
                <mesh>
                  <torusGeometry
                    args={[Math.min(sD, sW) / 2 - 0.03, 0.005, 8, 4]}
                  />
                  <meshStandardMaterial
                    color={REBAR_COLOR}
                    metalness={0.8}
                    roughness={0.3}
                  />
                </mesh>
              </group>
            );
          })}
        </>
      )}

      {showDimensions && (
        <>
          <DimensionLabel
            start={[-sL / 2, -0.1, sW / 2 + 0.1]}
            end={[sL / 2, -0.1, sW / 2 + 0.1]}
            text={`${(sL * 1000).toFixed(0)} mm`}
            offset={[0, -0.15, 0]}
          />
          <DimensionLabel
            start={[sL / 2 + 0.1, 0, -sW / 2]}
            end={[sL / 2 + 0.1, 0, sW / 2]}
            text={`${(sW * 1000).toFixed(0)} mm`}
            offset={[0.15, 0, 0]}
            rotate
          />
          <DimensionLabel
            start={[-sL / 2 - 0.15, 0, -sW / 2 - 0.15]}
            end={[-sL / 2 - 0.15, sD, -sW / 2 - 0.15]}
            text={`${(sD * 1000).toFixed(0)} mm`}
            offset={[-0.2, 0, 0]}
          />
        </>
      )}
    </group>
  );
};

/* ─── Tapered Beam ─── */
const TaperedBeam3D: React.FC<{
  length: number;
  width: number;
  startDepth: number;
  endDepth: number;
  showRebar: boolean;
  showDimensions: boolean;
  wireframe: boolean;
}> = ({ length, width, startDepth, endDepth, showRebar, showDimensions, wireframe }) => {
  const sL = (length && length > 50 ? length / 1000 : length) || 4.0;
  const sW = (width && width > 50 ? width / 1000 : width) || 0.4;
  const sD1 = (startDepth && startDepth > 50 ? startDepth / 1000 : startDepth) || 0.7;
  const sD2 = (endDepth && endDepth > 50 ? endDepth / 1000 : endDepth) || 0.4;

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-sL / 2, 0);
    s.lineTo(sL / 2, 0);
    s.lineTo(sL / 2, sD2);
    s.lineTo(-sL / 2, sD1);
    s.closePath();
    return s;
  }, [sL, sD1, sD2]);

  const extrudeSettings = useMemo(
    () => ({ steps: 1, depth: sW, bevelEnabled: false }),
    [sW],
  );

  return (
    <group position={[0, 0, -sW / 2]}>
      <mesh>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <ConcreteMaterial wireframe={wireframe} />
      </mesh>

      {showDimensions && (
        <>
          <DimensionLabel
            start={[-sL / 2, 0, sW + 0.1]}
            end={[sL / 2, 0, sW + 0.1]}
            text={`Span: ${(sL * 1000).toFixed(0)} mm`}
            offset={[0, -0.15, 0]}
          />
          <DimensionLabel
            start={[-sL / 2 - 0.15, 0, sW / 2]}
            end={[-sL / 2 - 0.15, sD1, sW / 2]}
            text={`D1: ${(sD1 * 1000).toFixed(0)} mm`}
            offset={[-0.2, 0, 0]}
          />
          <DimensionLabel
            start={[sL / 2 + 0.15, 0, sW / 2]}
            end={[sL / 2 + 0.15, sD2, sW / 2]}
            text={`D2: ${(sD2 * 1000).toFixed(0)} mm`}
            offset={[0.2, 0, 0]}
          />
        </>
      )}
    </group>
  );
};

/* ─── Curved Beam ─── */
const CurvedBeam3D: React.FC<{
  length: number;
  width: number;
  depth: number;
  arcRadius?: number;
  showRebar: boolean;
  showDimensions: boolean;
  wireframe: boolean;
}> = ({ length, width, depth, arcRadius, showRebar, showDimensions, wireframe }) => {
  const sL = (length && length > 50 ? length / 1000 : length) || 4.0;
  const sW = (width && width > 50 ? width / 1000 : width) || 0.4;
  const sD = (depth && depth > 50 ? depth / 1000 : depth) || 0.6;
  const rise = (arcRadius && arcRadius > 50 ? arcRadius / 1000 : arcRadius) || sL * 0.2;

  const segments = 16;
  const beamParts = useMemo(() => {
    const parts = [];
    for (let i = 0; i < segments; i++) {
      const t1 = i / segments;
      const t2 = (i + 1) / segments;
      const x1 = -sL / 2 + t1 * sL;
      const x2 = -sL / 2 + t2 * sL;
      const z1 = Math.sin(t1 * Math.PI) * rise;
      const z2 = Math.sin(t2 * Math.PI) * rise;

      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      const segLen = Math.hypot(x2 - x1, z2 - z1);
      const angle = Math.atan2(z2 - z1, x2 - x1);

      parts.push({ midX, midZ, segLen, angle });
    }
    return parts;
  }, [sL, rise]);

  return (
    <group position={[0, sD / 2, 0]}>
      {beamParts.map((part, i) => (
        <group
          key={i}
          position={[part.midX, 0, part.midZ]}
          rotation={[0, -part.angle, 0]}
        >
          <DreiBox args={[part.segLen + 0.02, sD, sW]}>
            <ConcreteMaterial wireframe={wireframe} />
          </DreiBox>
        </group>
      ))}

      {showDimensions && (
        <>
          <DimensionLabel
            start={[-sL / 2, -sD / 2 - 0.1, 0]}
            end={[sL / 2, -sD / 2 - 0.1, 0]}
            text={`Chord: ${(sL * 1000).toFixed(0)} mm`}
            offset={[0, -0.15, 0]}
          />
          <DimensionLabel
            start={[0, -sD / 2 - 0.1, 0]}
            end={[0, -sD / 2 - 0.1, rise]}
            text={`Rise: ${(rise * 1000).toFixed(0)} mm`}
            offset={[0.2, 0, rise / 2]}
          />
        </>
      )}
    </group>
  );
};

/* ─── Standard Slab ─── */
const Slab3D: React.FC<{
  length: number;
  width: number;
  thickness: number;
  showRebar: boolean;
  showDimensions: boolean;
  wireframe: boolean;
}> = ({ length, width, thickness, showRebar, showDimensions, wireframe }) => {
  const sL = (length && length > 50 ? length / 1000 : length) || 4.0;
  const sW = (width && width > 50 ? width / 1000 : width) || 3.0;
  const sT = (thickness && thickness > 50 ? thickness / 1000 : thickness) || 0.25;

  return (
    <group>
      <DreiBox args={[sL, sT, sW]} position={[0, sT / 2, 0]}>
        <ConcreteMaterial wireframe={wireframe} />
      </DreiBox>

      {showRebar && (
        <>
          {/* Bottom Mesh - X Direction */}
          {Array.from({ length: Math.max(3, Math.floor(sW / 0.2)) }).map((_, i) => {
            const z = -sW / 2 + 0.1 + i * 0.2;
            return (
              <Cylinder
                key={`x-${i}`}
                args={[0.008, 0.008, sL - 0.08, 8]}
                rotation={[0, 0, Math.PI / 2]}
                position={[0, 0.03, z]}
              >
                <meshStandardMaterial
                  color={REBAR_COLOR}
                  metalness={0.8}
                  roughness={0.3}
                />
              </Cylinder>
            );
          })}
          {/* Bottom Mesh - Z Direction */}
          {Array.from({ length: Math.max(3, Math.floor(sL / 0.2)) }).map((_, i) => {
            const x = -sL / 2 + 0.1 + i * 0.2;
            return (
              <Cylinder
                key={`z-${i}`}
                args={[0.008, 0.008, sW - 0.08, 8]}
                rotation={[Math.PI / 2, 0, 0]}
                position={[x, 0.03, 0]}
              >
                <meshStandardMaterial
                  color={REBAR_COLOR}
                  metalness={0.8}
                  roughness={0.3}
                />
              </Cylinder>
            );
          })}
        </>
      )}

      {showDimensions && (
        <>
          <DimensionLabel
            start={[-sL / 2, -0.1, sW / 2 + 0.1]}
            end={[sL / 2, -0.1, sW / 2 + 0.1]}
            text={`${(sL * 1000).toFixed(0)} mm`}
            offset={[0, -0.15, 0]}
          />
          <DimensionLabel
            start={[sL / 2 + 0.1, -0.1, -sW / 2]}
            end={[sL / 2 + 0.1, -0.1, sW / 2]}
            text={`${(sW * 1000).toFixed(0)} mm`}
            offset={[0.15, 0, 0]}
            rotate
          />
          <DimensionLabel
            start={[-sL / 2 - 0.15, 0, -sW / 2 - 0.15]}
            end={[-sL / 2 - 0.15, sT, -sW / 2 - 0.15]}
            text={`${(sT * 1000).toFixed(0)} mm`}
            offset={[-0.2, 0, 0]}
          />
        </>
      )}
    </group>
  );
};

/* ─── Circular Slab ─── */
const CircularSlab3D: React.FC<{
  diameter: number;
  thickness: number;
  showRebar: boolean;
  showDimensions: boolean;
  wireframe: boolean;
}> = ({ diameter, thickness, showRebar, showDimensions, wireframe }) => {
  const sD = (diameter && diameter > 50 ? diameter / 1000 : diameter) || 4.0;
  const sT = (thickness && thickness > 50 ? thickness / 1000 : thickness) || 0.25;
  const radius = sD / 2;

  const ringCount = useMemo(() => {
    return Math.max(2, Math.floor(radius / 0.4));
  }, [radius]);

  return (
    <group>
      <Cylinder args={[radius, radius, sT, 48]} position={[0, sT / 2, 0]}>
        <ConcreteMaterial wireframe={wireframe} />
      </Cylinder>

      {showRebar && (
        <>
          {Array.from({ length: ringCount }).map((_, i) => {
            const r = 0.2 + (i * (radius - 0.25)) / (ringCount || 1);
            return (
              <group key={`ring-${i}`} position={[0, sT / 2, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[r, 0.006, 8, 32]} />
                  <meshStandardMaterial color={REBAR_COLOR} metalness={0.8} roughness={0.3} />
                </mesh>
              </group>
            );
          })}
        </>
      )}

      {showDimensions && (
        <>
          <DimensionLabel
            start={[-radius, 0, radius + 0.1]}
            end={[radius, 0, radius + 0.1]}
            text={`Ø ${(sD * 1000).toFixed(0)} mm`}
            offset={[0, -0.15, 0]}
          />
          <DimensionLabel
            start={[-radius - 0.15, 0, 0]}
            end={[-radius - 0.15, sT, 0]}
            text={`${(sT * 1000).toFixed(0)} mm`}
            offset={[-0.2, 0, 0]}
          />
        </>
      )}
    </group>
  );
};

/* ─── Curved Cantilever / Balcony Bay Slab ─── */
const CurvedCantileverSlab3D: React.FC<{
  length: number;
  cantileverDepth: number;
  arcRadius?: number;
  thickness: number;
  showRebar: boolean;
  showDimensions: boolean;
  wireframe: boolean;
}> = ({ length, cantileverDepth, arcRadius, thickness, showRebar, showDimensions, wireframe }) => {
  const sL = (length && length > 50 ? length / 1000 : length) || 4.0;
  const sW = (cantileverDepth && cantileverDepth > 50 ? cantileverDepth / 1000 : cantileverDepth) || 1.5;
  const sT = (thickness && thickness > 50 ? thickness / 1000 : thickness) || 0.2;

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-sL / 2, 0);
    s.lineTo(sL / 2, 0);
    s.lineTo(sL / 2, sW * 0.7);
    s.quadraticCurveTo(0, sW * 1.25, -sL / 2, sW * 0.7);
    s.closePath();
    return s;
  }, [sL, sW]);

  const extrudeSettings = useMemo(
    () => ({ steps: 1, depth: sT, bevelEnabled: false }),
    [sT],
  );

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -sW / 2]}>
      <mesh position={[0, 0, 0]}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <ConcreteMaterial wireframe={wireframe} />
      </mesh>

      {showDimensions && (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <DimensionLabel
            start={[-sL / 2, 0, 0]}
            end={[sL / 2, 0, 0]}
            text={`Span: ${(sL * 1000).toFixed(0)} mm`}
            offset={[0, -0.15, -0.1]}
          />
          <DimensionLabel
            start={[0, 0, 0]}
            end={[0, 0, sW]}
            text={`Cantilever: ${(sW * 1000).toFixed(0)} mm`}
            offset={[0.2, -0.1, sW / 2]}
          />
        </group>
      )}
    </group>
  );
};

/* ─── Trapezoidal / Tapered Cantilever Slab ─── */
const TrapezoidalCantileverSlab3D: React.FC<{
  length: number;
  startDepth: number;
  endDepth: number;
  thickness: number;
  showRebar: boolean;
  showDimensions: boolean;
  wireframe: boolean;
}> = ({ length, startDepth, endDepth, thickness, showRebar, showDimensions, wireframe }) => {
  const sL = (length && length > 50 ? length / 1000 : length) || 4.0;
  const sW1 = (startDepth && startDepth > 50 ? startDepth / 1000 : startDepth) || 1.8;
  const sW2 = (endDepth && endDepth > 50 ? endDepth / 1000 : endDepth) || 0.9;
  const sT = (thickness && thickness > 50 ? thickness / 1000 : thickness) || 0.2;

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-sL / 2, 0);
    s.lineTo(sL / 2, 0);
    s.lineTo(sL / 2, sW2);
    s.lineTo(-sL / 2, sW1);
    s.closePath();
    return s;
  }, [sL, sW1, sW2]);

  const extrudeSettings = useMemo(
    () => ({ steps: 1, depth: sT, bevelEnabled: false }),
    [sT],
  );

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -(sW1 + sW2) / 4]}>
      <mesh>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <ConcreteMaterial wireframe={wireframe} />
      </mesh>

      {showDimensions && (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <DimensionLabel
            start={[-sL / 2, 0, 0]}
            end={[sL / 2, 0, 0]}
            text={`L: ${(sL * 1000).toFixed(0)} mm`}
            offset={[0, -0.15, -0.1]}
          />
          <DimensionLabel
            start={[-sL / 2, 0, 0]}
            end={[-sL / 2, 0, sW1]}
            text={`W1: ${(sW1 * 1000).toFixed(0)} mm`}
            offset={[-0.2, 0, sW1 / 2]}
          />
          <DimensionLabel
            start={[sL / 2, 0, 0]}
            end={[sL / 2, 0, sW2]}
            text={`W2: ${(sW2 * 1000).toFixed(0)} mm`}
            offset={[0.2, 0, sW2 / 2]}
          />
        </group>
      )}
    </group>
  );
};

/* ─── Wall ─── */
const Wall3D: React.FC<{
  length: number;
  height: number;
  thickness: number;
  showRebar: boolean;
  showDimensions: boolean;
  wireframe: boolean;
}> = ({ length, height, thickness, showRebar, showDimensions, wireframe }) => {
  const sL = (length && length > 50 ? length / 1000 : length) || 4.0;
  const sH = (height && height > 50 ? height / 1000 : height) || 3.0;
  const sT = (thickness && thickness > 50 ? thickness / 1000 : thickness) || 0.25;

  return (
    <group>
      <DreiBox args={[sL, sH, sT]} position={[0, sH / 2, 0]}>
        <ConcreteMaterial wireframe={wireframe} />
      </DreiBox>

      {showRebar && (
        <>
          {/* Vertical Double Reinforcement */}
          {Array.from({ length: Math.max(3, Math.floor(sL / 0.25)) }).map((_, i) => {
            const x = -sL / 2 + 0.12 + i * 0.25;
            return (
              <group key={`v-${i}`}>
                <Cylinder
                  args={[0.008, 0.008, sH - 0.08, 8]}
                  position={[x, sH / 2, -sT / 2 + 0.04]}
                >
                  <meshStandardMaterial
                    color={REBAR_COLOR}
                    metalness={0.8}
                    roughness={0.3}
                  />
                </Cylinder>
                <Cylinder
                  args={[0.008, 0.008, sH - 0.08, 8]}
                  position={[x, sH / 2, sT / 2 - 0.04]}
                >
                  <meshStandardMaterial
                    color={REBAR_COLOR}
                    metalness={0.8}
                    roughness={0.3}
                  />
                </Cylinder>
              </group>
            );
          })}
          {/* Horizontal Double Reinforcement */}
          {Array.from({ length: Math.max(3, Math.floor(sH / 0.3)) }).map((_, i) => {
            const y = 0.15 + i * 0.3;
            return (
              <group key={`h-${i}`}>
                <Cylinder
                  args={[0.008, 0.008, sL - 0.08, 8]}
                  rotation={[0, 0, Math.PI / 2]}
                  position={[0, y, -sT / 2 + 0.04]}
                >
                  <meshStandardMaterial
                    color={REBAR_COLOR}
                    metalness={0.8}
                    roughness={0.3}
                  />
                </Cylinder>
                <Cylinder
                  args={[0.008, 0.008, sL - 0.08, 8]}
                  rotation={[0, 0, Math.PI / 2]}
                  position={[0, y, sT / 2 - 0.04]}
                >
                  <meshStandardMaterial
                    color={REBAR_COLOR}
                    metalness={0.8}
                    roughness={0.3}
                  />
                </Cylinder>
              </group>
            );
          })}
        </>
      )}

      {showDimensions && (
        <>
          <DimensionLabel
            start={[-sL / 2, -0.1, sT / 2 + 0.1]}
            end={[sL / 2, -0.1, sT / 2 + 0.1]}
            text={`${(sL * 1000).toFixed(0)} mm`}
            offset={[0, -0.15, 0]}
          />
          <DimensionLabel
            start={[-sL / 2 - 0.15, 0, 0]}
            end={[-sL / 2 - 0.15, sH, 0]}
            text={`${(sH * 1000).toFixed(0)} mm`}
            offset={[-0.2, 0, 0]}
          />
          <DimensionLabel
            start={[sL / 2 + 0.1, 0, -sT / 2]}
            end={[sL / 2 + 0.1, 0, sT / 2]}
            text={`${(sT * 1000).toFixed(0)} mm`}
            offset={[0.15, 0, 0]}
            rotate
          />
        </>
      )}
    </group>
  );
};

/* ─── Stair ─── */
const Stair3D: React.FC<{
  length: number;
  width: number;
  height: number;
  showDimensions: boolean;
  wireframe: boolean;
}> = ({ length, width, height, showDimensions, wireframe }) => {
  const sL = (length && length > 50 ? length / 1000 : length) || 3.0;
  const sW = (width && width > 50 ? width / 1000 : width) || 1.2;
  const sH = (height && height > 50 ? height / 1000 : height) || 2.0;

  const steps = 10;
  const stepLength = sL / steps;
  const stepHeight = sH / steps;

  return (
    <group>
      {/* Steps */}
      {Array.from({ length: steps }).map((_, i) => (
        <DreiBox
          key={i}
          args={[stepLength, (i + 1) * stepHeight, sW]}
          position={[
            -sL / 2 + stepLength / 2 + i * stepLength,
            ((i + 1) * stepHeight) / 2,
            0,
          ]}
        >
          <ConcreteMaterial wireframe={wireframe} />
        </DreiBox>
      ))}

      {showDimensions && (
        <DimensionLabel
          start={[-sL / 2, 0, sW / 2 + 0.1]}
          end={[sL / 2, 0, sW / 2 + 0.1]}
          text={`${(sL * 1000).toFixed(0)} mm`}
          offset={[0, -0.15, 0]}
        />
      )}
    </group>
  );
};

/* ─── Dimension Label Helper ─── */
const DimensionLabel: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
  text: string;
  offset?: [number, number, number];
  rotate?: boolean;
}> = ({ start, end, text, offset = [0, 0, 0], rotate }) => {
  const midX = (start[0] + end[0]) / 2 + offset[0];
  const midY = (start[1] + end[1]) / 2 + offset[1];
  const midZ = (start[2] + end[2]) / 2 + offset[2];

  return (
    <Html position={[midX, midY, midZ]} center>
      <div
        className="bg-slate-900/90 border border-slate-700 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md whitespace-nowrap pointer-events-none shadow-md backdrop-blur-xs"
        style={{ transform: rotate ? "rotate(90deg)" : "none" }}
      >
        {text}
      </div>
    </Html>
  );
};

/* ─── 2D Cross-Section SVG Blueprint View ─── */
const CrossSectionView: React.FC<{
  element: StructuralElement;
  showRebar: boolean;
  theme?: "dark" | "light";
}> = ({ element, showRebar, theme = "dark" }) => {
  const { elementType, length, width, thickness, depth, diameter, height } = element;

  const svgW = 400;
  const svgH = 300;
  const padding = 40;

  const isLight = theme === "light";
  const w = (width && width > 50 ? width : (width || 0.6) * 1000);
  const d = (depth || thickness || height ? ((depth || thickness || height)! > 50 ? (depth || thickness || height)! : (depth || thickness || height)! * 1000) : 600);
  const dia = (diameter && diameter > 50 ? diameter : (diameter || 0.6) * 1000);

  const renderSection = () => {
    const type = (elementType || "").toUpperCase();

    if (type.includes("COLUMN") && (element.columnShape === "circular" || type.includes("CIRCULAR"))) {
      const scale = Math.min((svgW - padding * 2) / dia, (svgH - padding * 2) / dia);
      const cx = svgW / 2;
      const cy = svgH / 2;
      const r = (dia / 2) * scale;

      return (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill={isLight ? "#f0f9ff" : "#1e293b"}
            stroke={isLight ? "#0284c7" : "#f97316"}
            strokeWidth={2}
          />
          {showRebar && (
            <>
              {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => {
                const rad = (ang * Math.PI) / 180;
                const br = r - 16;
                return (
                  <circle
                    key={ang}
                    cx={cx + Math.cos(rad) * br}
                    cy={cy + Math.sin(rad) * br}
                    r={5}
                    fill="#f59e0b"
                    stroke="#b45309"
                    strokeWidth={1.5}
                  />
                );
              })}
            </>
          )}
          <line
            x1={cx - r}
            y1={cy + r + 20}
            x2={cx + r}
            y2={cy + r + 20}
            stroke={isLight ? "#64748b" : "#94a3b8"}
            strokeWidth={1.5}
          />
          <text
            x={cx}
            y={cy + r + 38}
            textAnchor="middle"
            fill={isLight ? "#0f172a" : "#f8fafc"}
            fontSize="11"
            fontWeight="bold"
            fontFamily="monospace"
          >
            Ø {dia.toFixed(0)} mm
          </text>
        </g>
      );
    }

    const rw = Math.min(w * (Math.min((svgW - padding * 2) / w, (svgH - padding * 2) / d)), svgW - padding * 2);
    const rh = Math.min(d * (Math.min((svgW - padding * 2) / w, (svgH - padding * 2) / d)), svgH - padding * 2);
    const cx = svgW / 2;
    const cy = svgH / 2;

    return (
      <g>
        <rect
          x={cx - rw / 2}
          y={cy - rh / 2}
          width={rw}
          height={rh}
          rx={4}
          fill={isLight ? "#f0f9ff" : "#1e293b"}
          stroke={isLight ? "#0284c7" : "#f97316"}
          strokeWidth={2}
        />
        {showRebar && (
          <>
            <circle cx={cx - rw / 2 + 18} cy={cy - rh / 2 + 18} r={5} fill="#f59e0b" stroke="#b45309" strokeWidth={1.5} />
            <circle cx={cx + rw / 2 - 18} cy={cy - rh / 2 + 18} r={5} fill="#f59e0b" stroke="#b45309" strokeWidth={1.5} />
            <circle cx={cx - rw / 2 + 18} cy={cy + rh / 2 - 18} r={5} fill="#f59e0b" stroke="#b45309" strokeWidth={1.5} />
            <circle cx={cx + rw / 2 - 18} cy={cy + rh / 2 - 18} r={5} fill="#f59e0b" stroke="#b45309" strokeWidth={1.5} />
            <circle cx={cx} cy={cy + rh / 2 - 18} r={5} fill="#f59e0b" stroke="#b45309" strokeWidth={1.5} />
            <circle cx={cx} cy={cy - rh / 2 + 18} r={5} fill="#f59e0b" stroke="#b45309" strokeWidth={1.5} />
          </>
        )}
        <line
          x1={cx - rw / 2}
          y1={cy + rh / 2 + 20}
          x2={cx + rw / 2}
          y2={cy + rh / 2 + 20}
          stroke={isLight ? "#64748b" : "#94a3b8"}
          strokeWidth={1.5}
        />
        <text
          x={cx}
          y={cy + rh / 2 + 36}
          textAnchor="middle"
          fill={isLight ? "#0f172a" : "#f8fafc"}
          fontSize="11"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {w.toFixed(0)} mm
        </text>
        <line
          x1={cx + rw / 2 + 20}
          y1={cy - rh / 2}
          x2={cx + rw / 2 + 20}
          y2={cy + rh / 2}
          stroke={isLight ? "#64748b" : "#94a3b8"}
          strokeWidth={1.5}
        />
        <text
          x={cx + rw / 2 + 36}
          y={cy}
          textAnchor="middle"
          fill={isLight ? "#0f172a" : "#f8fafc"}
          fontSize="11"
          fontWeight="bold"
          fontFamily="monospace"
          transform={`rotate(90, ${cx + rw / 2 + 36}, ${cy})`}
        >
          {d.toFixed(0)} mm
        </text>
      </g>
    );
  };

  return (
    <svg
      width={svgW}
      height={svgH}
      className={`w-full h-auto rounded-2xl border transition-colors ${
        isLight ? "bg-white border-slate-200" : "bg-slate-950 border-slate-800"
      }`}
    >
      {renderSection()}
    </svg>
  );
};

/* ─── Element 3D Scene ─── */
const Element3DScene: React.FC<{
  element: StructuralElement;
  showRebar: boolean;
  showDimensions: boolean;
  wireframe: boolean;
  autoRotate: boolean;
  theme?: "dark" | "light";
}> = ({ element, showRebar, showDimensions, wireframe, autoRotate, theme = "dark" }) => {
  const type = (element.elementType || "").toUpperCase();
  const isLight = theme === "light";

  const renderGeometry = () => {
    // 1. Column Variants
    if (type.includes("COLUMN")) {
      if (element.columnShape === "circular" || type.includes("CIRCULAR")) {
        return (
          <CircularColumn3D
            diameter={element.diameter || 600}
            height={element.height || element.dimensions?.height || 3000}
            showRebar={showRebar}
            showDimensions={showDimensions}
            wireframe={wireframe}
          />
        );
      }
      if (element.columnShape === "inclined") {
        return (
          <InclinedColumn3D
            length={element.length || element.dimensions?.length || 600}
            width={element.width || element.dimensions?.width || 600}
            height={element.height || element.dimensions?.height || 3000}
            showRebar={showRebar}
            showDimensions={showDimensions}
            wireframe={wireframe}
          />
        );
      }
      return (
        <RectangularColumn3D
          length={element.length || element.dimensions?.length || 600}
          width={element.width || element.dimensions?.width || 600}
          height={element.height || element.dimensions?.height || 3000}
          showRebar={showRebar}
          showDimensions={showDimensions}
          wireframe={wireframe}
        />
      );
    }

    // 2. Beam Variants
    if (type.includes("BEAM")) {
      if (element.beamShape === "curved" || (element.arcRadius && element.arcRadius > 0)) {
        return (
          <CurvedBeam3D
            length={element.length || element.dimensions?.length || 4000}
            width={element.width || element.dimensions?.width || 400}
            depth={element.depth || element.height || element.dimensions?.height || 600}
            arcRadius={element.arcRadius}
            showRebar={showRebar}
            showDimensions={showDimensions}
            wireframe={wireframe}
          />
        );
      }
      if (element.beamShape === "tapered" || (element.taperEndDepth && element.taperEndDepth > 0)) {
        return (
          <TaperedBeam3D
            length={element.length || element.dimensions?.length || 4000}
            width={element.width || element.dimensions?.width || 400}
            startDepth={element.depth || element.height || element.dimensions?.height || 600}
            endDepth={element.taperEndDepth || 400}
            showRebar={showRebar}
            showDimensions={showDimensions}
            wireframe={wireframe}
          />
        );
      }
      return (
        <Beam3D
          length={element.length || element.dimensions?.length || 4000}
          width={element.width || element.dimensions?.width || 400}
          depth={element.depth || element.height || element.dimensions?.height || 600}
          showRebar={showRebar}
          showDimensions={showDimensions}
          wireframe={wireframe}
        />
      );
    }

    // 3. Slab Variants
    if (type.includes("SLAB")) {
      if (element.slabShape === "circular") {
        return (
          <CircularSlab3D
            diameter={element.diameter || element.width || 4000}
            thickness={element.thickness || 250}
            showRebar={showRebar}
            showDimensions={showDimensions}
            wireframe={wireframe}
          />
        );
      }
      if (element.slabShape === "curved_cantilever") {
        return (
          <CurvedCantileverSlab3D
            length={element.length || element.dimensions?.length || 4000}
            cantileverDepth={element.cantileverDepth || element.width || 1500}
            arcRadius={element.arcRadius}
            thickness={element.thickness || 200}
            showRebar={showRebar}
            showDimensions={showDimensions}
            wireframe={wireframe}
          />
        );
      }
      if (element.slabShape === "trapezoidal_cantilever") {
        return (
          <TrapezoidalCantileverSlab3D
            length={element.length || element.dimensions?.length || 4000}
            startDepth={element.cantileverDepth || element.width || 1800}
            endDepth={element.taperEndDepth || 900}
            thickness={element.thickness || 200}
            showRebar={showRebar}
            showDimensions={showDimensions}
            wireframe={wireframe}
          />
        );
      }
      return (
        <Slab3D
          length={element.length || element.dimensions?.length || 4000}
          width={element.width || element.dimensions?.width || 3000}
          thickness={element.thickness || 250}
          showRebar={showRebar}
          showDimensions={showDimensions}
          wireframe={wireframe}
        />
      );
    }

    // 4. Wall
    if (type.includes("WALL")) {
      return (
        <Wall3D
          length={element.length || element.dimensions?.length || 4000}
          height={element.height || element.dimensions?.height || 3000}
          thickness={element.thickness || element.width || 250}
          showRebar={showRebar}
          showDimensions={showDimensions}
          wireframe={wireframe}
        />
      );
    }

    // 5. Stair
    if (type.includes("STAIR")) {
      return (
        <Stair3D
          length={element.length || 3000}
          width={element.width || 1200}
          height={element.height || 2000}
          showDimensions={showDimensions}
          wireframe={wireframe}
        />
      );
    }

    // Default Footing / Generic Block
    return (
      <RectangularColumn3D
        length={element.length || element.dimensions?.length || 1000}
        width={element.width || element.dimensions?.width || 1000}
        height={element.height || element.dimensions?.height || 800}
        showRebar={showRebar}
        showDimensions={showDimensions}
        wireframe={wireframe}
      />
    );
  };

  return (
    <Canvas camera={{ position: [3, 3, 3], fov: 45 }} className="w-full h-full" shadows>
      <color attach="background" args={[isLight ? "#f8fafc" : "#0a0f1d"]} />
      <ambientLight intensity={isLight ? 0.9 : 0.7} />
      <directionalLight position={[6, 12, 6]} intensity={isLight ? 1.4 : 1.2} castShadow />
      <directionalLight position={[-6, 4, -6]} intensity={0.4} color="#38bdf8" />
      <Grid
        position={[0, -0.01, 0]}
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor={isLight ? "#cbd5e1" : "#1e293b"}
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#0284c7"
        fadeDistance={20}
        fadeStrength={1}
        followCamera={false}
      />
      <Suspense fallback={null}>{renderGeometry()}</Suspense>
      <ContactShadows position={[0, -0.01, 0]} opacity={isLight ? 0.25 : 0.4} scale={10} blur={2} />
      <OrbitControls
        autoRotate={autoRotate}
        autoRotateSpeed={2}
        enablePan
        enableZoom
        enableRotate
        minDistance={1}
        maxDistance={15}
      />
      <Environment preset="city" />
    </Canvas>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN ELEMENT VIEWER MODAL
   ═══════════════════════════════════════════════════════════════════════════ */

interface ElementViewerProps {
  element: StructuralElement | null;
  levelName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ElementViewer: React.FC<ElementViewerProps> = ({
  element,
  levelName,
  isOpen,
  onClose,
}) => {
  const [activeView, setActiveView] = useState<"3d" | "cross-section">("3d");
  const [viewerTheme, setViewerTheme] = useState<"dark" | "light">("dark");
  const [showRebar, setShowRebar] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !element) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-slate-950/85 backdrop-blur-md p-4">
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isFullscreen ? "w-[96vw] h-[96vh]" : "w-full max-w-5xl max-h-[90vh]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center">
              <Box size={20} className="text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{element.elementName}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-500/30 font-mono">
                  {element.elementType}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Level: <strong className="text-slate-800 dark:text-slate-200">{levelName || element.levelName || "Level"}</strong> · Grid:{" "}
                <strong className="text-slate-800 dark:text-slate-200 font-mono">{element.grid || element.gridAxis || "N/A"}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 flex">
              <button
                onClick={() => setActiveView("3d")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === "3d" ? "bg-brand-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                3D BIM Twin
              </button>
              <button
                onClick={() => setActiveView("cross-section")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === "cross-section" ? "bg-brand-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Cross-Section
              </button>
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Interactive Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setViewerTheme((t) => (t === "dark" ? "light" : "dark"))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewerTheme === "light"
                ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
                : "bg-slate-800 text-white shadow border border-slate-700"
            }`}
            title="Toggle 3D & 2D Light/Dark Viewport Theme"
          >
            {viewerTheme === "light" ? <Sun size={13} className="text-amber-600" /> : <Moon size={13} className="text-sky-400" />}
            <span>{viewerTheme === "light" ? "Light View" : "Dark View"}</span>
          </button>

          <button
            onClick={() => setShowRebar(!showRebar)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              showRebar
                ? "bg-amber-600 text-white shadow"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Crosshair size={13} />
            Rebar Cage
          </button>

          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              showDimensions
                ? "bg-slate-800 text-white shadow"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Ruler size={13} />
            Dimensions
          </button>

          <button
            onClick={() => setWireframe(!wireframe)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              wireframe
                ? "bg-brand-600 text-white shadow"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Grid3x3 size={13} />
            Wireframe
          </button>

          {activeView === "3d" && (
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                autoRotate
                  ? "bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/40"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <RotateCcw size={13} />
              Auto-Rotate
            </button>
          )}

          <div className="ml-auto flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 px-2.5 py-1 rounded-xl">
              {(element.calculatedVolume || element.volume || 0).toFixed(3)} m³
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-slate-500">
              Drag to rotate · Scroll to zoom · Right-click to pan
            </span>
          </div>
        </div>

        {/* 3D Viewport / 2D Cross-Section */}
        <div
          className={`flex-1 min-h-[420px] relative transition-colors duration-200 ${
            viewerTheme === "light" ? "bg-slate-100" : "bg-slate-950"
          }`}
        >
          {activeView === "3d" ? (
            <Element3DScene
              element={element}
              showRebar={showRebar}
              showDimensions={showDimensions}
              wireframe={wireframe}
              autoRotate={autoRotate}
              theme={viewerTheme}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center p-8 transition-colors ${
              viewerTheme === "light" ? "bg-slate-100" : "bg-slate-950"
            }`}>
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 max-w-lg w-full space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                  <Layers size={14} className="text-brand-600 dark:text-brand-400" />
                  Engineering Cross-Section View
                </h4>
                <CrossSectionView element={element} showRebar={showRebar} theme={viewerTheme} />
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{element.elementType}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-brand-600 dark:text-brand-400 font-mono mt-0.5 block">{element.concreteGrade || "C35/45"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              Level: <strong className="text-slate-800 dark:text-slate-200">{levelName || element.levelName}</strong>
            </span>
            <span>
              Rebar: <strong className="text-slate-800 dark:text-slate-200 font-mono">{element.rebarSpec || "12T25, T10-150"}</strong>
            </span>
            <span>
              Status: <strong className="text-amber-600 dark:text-amber-400 font-bold">{element.status}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/project/elements/${element.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow transition"
            >
              <ExternalLink size={14} />
              <span>Open Element Passport</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Inline Compact 3D Thumbnail ─── */
export const Element3DPreview: React.FC<{
  element: StructuralElement;
  className?: string;
}> = ({ element, className = "" }) => {
  return (
    <div className={`relative rounded-xl overflow-hidden bg-[#0a0f1d] ${className}`} style={{ height: 120 }}>
      <Canvas camera={{ position: [2, 2, 2], fov: 40 }} className="w-full h-full">
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 4, 3]} intensity={1.2} />
        <Suspense fallback={null}>
          <DreiBox args={[0.8, 1.2, 0.8]} position={[0, 0.6, 0]}>
            <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
          </DreiBox>
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={3} />
      </Canvas>
      <div className="absolute bottom-1 right-1 bg-slate-900/90 backdrop-blur-xs rounded px-1.5 py-0.5 text-[9px] font-mono font-bold text-brand-400 border border-slate-700">
        3D BIM
      </div>
    </div>
  );
};

export default ElementViewer;
