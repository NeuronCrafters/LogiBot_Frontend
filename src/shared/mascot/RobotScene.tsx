import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef } from "react";
import { Group, MathUtils, Mesh } from "three";
import type { RobotSceneProps } from "./types";

const SHELL = "#e3f0f5";

function ContextLifecycle({ onUnavailable }: Pick<RobotSceneProps, "onUnavailable">) {
  const canvas = useThree(state => state.gl.domElement);
  useEffect(() => {
    const onContextLost = (event: Event) => { event.preventDefault(); onUnavailable(); };
    canvas.addEventListener("webglcontextlost", onContextLost);
    // Three.js also releases the context when a static/hidden preference unmounts it.
    return () => canvas.removeEventListener("webglcontextlost", onContextLost);
  }, [canvas, onUnavailable]);
  return null;
}

function ResponsiveCamera({ variant }: Pick<RobotSceneProps, "variant">) {
  const { camera, size, invalidate } = useThree();
  useLayoutEffect(() => {
    camera.zoom = Math.min(size.width / 2.9, size.height / (variant === "head" ? 2.5 : 3.65));
    const center = variant === "head" ? 0.12 : 0.32;
    camera.position.set(0, center, 7);
    camera.lookAt(0, center, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, variant, invalidate]);
  return null;
}

function Robot({ variant, mood, reaction, monochrome }: Pick<RobotSceneProps, "variant" | "mood" | "reaction" | "monochrome">) {
  const robot = useRef<Group>(null), head = useRef<Group>(null), arm = useRef<Group>(null);
  const leftEye = useRef<Mesh>(null), rightEye = useRef<Mesh>(null);
  const began = useRef(0);
  const invalidate = useThree(state => state.invalidate);
  useEffect(() => { began.current = performance.now(); invalidate(); }, [mood, reaction, invalidate]);
  useFrame((_state, delta) => {
    if (!robot.current || !head.current) return;
    const time = (performance.now() - began.current) / 1000;
    const envelope = (1 - Math.cos(time * Math.PI / 2)) / 2;
    const curious = mood === "curious" || mood === "thinking";
    const blend = 1 - Math.exp(-Math.min(delta, 0.05) * 12);
    robot.current.position.y = MathUtils.lerp(robot.current.position.y, Math.sin(time * 2.2) * 0.08 * envelope, blend);
    robot.current.rotation.y = MathUtils.lerp(robot.current.rotation.y, -0.12 + Math.sin(time * 1.6) * 0.12 * envelope, blend);
    head.current.rotation.z = MathUtils.lerp(head.current.rotation.z, (curious ? -0.12 : 0) + Math.sin(time * 2.4) * 0.08 * envelope, blend);
    head.current.rotation.y = MathUtils.lerp(head.current.rotation.y, Math.sin(time * 1.4) * 0.1 * envelope, blend);
    if (arm.current) arm.current.rotation.z = MathUtils.lerp(arm.current.rotation.z, 0.25 + (mood === "celebrate" || mood === "welcome" ? 2.1 : 0.12) * envelope * (0.8 + 0.2 * Math.sin(time * 5)), blend);
    const blink = Math.max(0.08, 1 - Math.exp(-Math.pow(((time % 4) - 1.6) / 0.1, 2)) * 0.92);
    if (leftEye.current) leftEye.current.scale.y = blink;
    if (rightEye.current) rightEye.current.scale.y = blink;
    invalidate(); // Keep moving while the visible avatar is in animated mode.
  });
  const accent = monochrome ? "#475569" : "#2563eb";
  return <group ref={robot} position={[0, 0, 0]}>
    <group ref={head} position={[0, variant === "head" ? -0.15 : 0.75, 0]}>
      <mesh castShadow scale={[1.02, 0.64, 0.62]}>
        <sphereGeometry args={[1, 48, 40]} /><meshStandardMaterial color={SHELL} roughness={0.45} metalness={0.02} />
      </mesh>
      {[-1, 1].map(side => <group key={side} position={[side * 0.48, 0.65, -0.03]} rotation={[0, 0, side * -0.45]}>
        <mesh position={[0, 0.21, 0]}><capsuleGeometry args={[0.065, 0.36, 5, 12]} /><meshStandardMaterial color={SHELL} roughness={0.45} /></mesh>
      </group>)}
      {[-1, 1].map((side, index) => <mesh key={side} ref={index === 0 ? leftEye : rightEye} position={[side * 0.3, 0.02, 0.585]}>
        <capsuleGeometry args={[0.064, 0.23, 5, 12]} /><meshStandardMaterial color="#102336" roughness={0.32} />
      </mesh>)}
    </group>
    {variant === "full" && <>
      <mesh position={[0, -0.45, 0]} scale={[0.5, 0.64, 0.4]}>
        <sphereGeometry args={[1, 48, 40]} /><meshStandardMaterial color={SHELL} metalness={0.02} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.13, 0]} scale={[0.15, 0.075, 0.15]}>
        <sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#647d92" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.37, 0.402]} rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[0.036, 0.14, 4, 10]} /><meshStandardMaterial color={accent} roughness={0.4} /></mesh>
      <group position={[-0.62, -0.12, 0]} rotation={[0, 0, -0.25]}>
        <mesh position={[0, -0.26, 0]}><capsuleGeometry args={[0.11, 0.36, 5, 16]} /><meshStandardMaterial color={SHELL} roughness={0.45} /></mesh>
      </group>
      <group ref={arm} position={[0.62, -0.12, 0]} rotation={[0, 0, 0.25]}>
        <mesh position={[0, -0.26, 0]}><capsuleGeometry args={[0.11, 0.36, 5, 16]} /><meshStandardMaterial color={SHELL} roughness={0.45} /></mesh>
      </group>
    </>}
  </group>;
}

export default function RobotScene({ onReady, onUnavailable, ...props }: RobotSceneProps) {
  return <Canvas orthographic camera={{ position: [0, props.variant === "head" ? 0.2 : 0.35, 7], zoom: props.variant === "head" ? 48 : 50, near: 0.1, far: 30 }}
    dpr={[1, 1.5]} frameloop="demand" gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
    fallback={null} onCreated={() => {
      onReady();
    }} style={{ pointerEvents: "none" }}>
    <ContextLifecycle onUnavailable={onUnavailable} />
    <ResponsiveCamera variant={props.variant} />
    <ambientLight intensity={1.5} />
    <directionalLight position={[3, 5, 4]} intensity={2.2} color="#fff6ed" />
    <directionalLight position={[-3, 0, 2]} intensity={1.1} color="#b5d9ff" />
    <Robot {...props} />
  </Canvas>;
}
