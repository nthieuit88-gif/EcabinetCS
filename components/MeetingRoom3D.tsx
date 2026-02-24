import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  Float, 
  ContactShadows,
  RoundedBox,
  Text,
  MeshTransmissionMaterial
} from '@react-three/drei';
import * as THREE from 'three';

const Table = () => {
  return (
    <group position={[0, 0.5, 0]}>
      {/* Table Top - Glass/Modern */}
      <RoundedBox args={[3.5, 0.1, 1.8]} radius={0.05} smoothness={4}>
        <MeshTransmissionMaterial 
          backside
          samples={4}
          thickness={0.1}
          chromaticAberration={0.05}
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.5}
          temporalDistortion={0.1}
          color="#e2e8f0"
        />
      </RoundedBox>
      {/* Table Core/Projector */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 0.1, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Glowing Ring */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.02, 16, 100]} />
        <meshBasicMaterial color="#0ea5a4" />
      </mesh>
      
      {/* Table Legs */}
      <mesh position={[-1.2, -0.5, 0.5]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 32]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1.2, -0.5, 0.5]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 32]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-1.2, -0.5, -0.5]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 32]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1.2, -0.5, -0.5]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 32]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

const Chair = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Seat */}
      <RoundedBox args={[0.6, 0.1, 0.6]} radius={0.05} position={[0, 0.4, 0]}>
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </RoundedBox>
      {/* Backrest */}
      <RoundedBox args={[0.6, 0.7, 0.05]} radius={0.05} position={[0, 0.8, -0.275]}>
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </RoundedBox>
      {/* Base/Leg */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};

const Screen = () => {
  return (
    <group position={[0, 1.8, -2.5]}>
      {/* Screen Frame */}
      <RoundedBox args={[3.2, 1.8, 0.1]} radius={0.05}>
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.5} />
      </RoundedBox>
      {/* Screen Display */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[3.0, 1.6]} />
        <meshBasicMaterial color="#020617" />
      </mesh>
      
      {/* Screen Content - Simulated Dashboard */}
      <group position={[0, 0, 0.07]}>
         {/* Header */}
         <mesh position={[0, 0.6, 0]}>
            <planeGeometry args={[2.8, 0.2]} />
            <meshBasicMaterial color="#1e293b" />
         </mesh>
         
         {/* Charts */}
         <mesh position={[-0.7, 0.1, 0]}>
            <planeGeometry args={[1.2, 0.6]} />
            <meshBasicMaterial color="#0ea5a4" transparent opacity={0.7} />
         </mesh>
         <mesh position={[0.7, 0.1, 0]}>
            <planeGeometry args={[1.2, 0.6]} />
            <meshBasicMaterial color="#3b82f6" transparent opacity={0.7} />
         </mesh>
         
         {/* Bottom Bar */}
         <mesh position={[0, -0.5, 0]}>
            <planeGeometry args={[2.8, 0.3]} />
            <meshBasicMaterial color="#334155" transparent opacity={0.5} />
         </mesh>
         
         {/* Text overlay */}
         <Text position={[-1.2, 0.6, 0.01]} fontSize={0.08} color="#ffffff" anchorX="left">
           EcabinetCS Dashboard
         </Text>
      </group>
      
      {/* Screen Glow */}
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[3.2, 1.8]} />
        <meshBasicMaterial color="#0ea5a4" transparent opacity={0.1} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

const Hologram = () => {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.5;
      group.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={group} position={[0, 0.8, 0]}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* Holographic Sphere */}
        <mesh>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshBasicMaterial color="#0ea5a4" wireframe transparent opacity={0.3} blending={THREE.AdditiveBlending} />
        </mesh>
        {/* Inner Core */}
        <mesh>
          <octahedronGeometry args={[0.1]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </mesh>
        
        {/* Floating Data Particles */}
        <mesh position={[0.3, 0.2, 0]}>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[-0.2, -0.3, 0.2]}>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[0.1, 0.4, -0.2]}>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </Float>
      
      {/* Light beam from table */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.2, 0.05, 0.4, 32]} />
        <meshBasicMaterial color="#0ea5a4" transparent opacity={0.1} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

const Scene = () => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[5, 4, 6]} fov={45} />
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 2.2}
        autoRotate
        autoRotateSpeed={0.8}
      />
      
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 3, 0]} intensity={2} color="#0ea5a4" distance={5} />
      <spotLight position={[5, 8, 5]} angle={0.4} penumbra={1} intensity={1.5} castShadow />
      <spotLight position={[-5, 8, -5]} angle={0.4} penumbra={1} intensity={1} color="#3b82f6" />

      <group position={[0, -0.5, 0]}>
        <Table />
        
        {/* Chairs around the table */}
        <Chair position={[0, 0, 1.4]} rotation={[0, Math.PI, 0]} />
        <Chair position={[0, 0, -1.4]} rotation={[0, 0, 0]} />
        <Chair position={[-1.5, 0, 0.5]} rotation={[0, Math.PI / 2, 0]} />
        <Chair position={[-1.5, 0, -0.5]} rotation={[0, Math.PI / 2, 0]} />
        <Chair position={[1.5, 0, 0.5]} rotation={[0, -Math.PI / 2, 0]} />
        <Chair position={[1.5, 0, -0.5]} rotation={[0, -Math.PI / 2, 0]} />
        
        <Screen />
        <Hologram />
        
        <ContactShadows resolution={1024} scale={15} blur={2} opacity={0.4} far={10} color="#0f172a" />
      </group>
      
      <Environment preset="city" />
    </>
  );
};

const MeetingRoom3D: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[400px] rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-2xl relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
      <Canvas shadows dpr={[1, 2]}>
        <Scene />
      </Canvas>
    </div>
  );
};

export default MeetingRoom3D;
