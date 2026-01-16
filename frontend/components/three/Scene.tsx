"use client"

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FaceDetection } from '@/lib/types'

interface SceneProps {
  detections: FaceDetection[]
  width?: number
  height?: number
}

function PulsingRing({ position, isReal }: { position: [number, number, number]; isReal: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.RingGeometry>(null)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.2
      meshRef.current.scale.setScalar(scale)
      meshRef.current.rotation.z = clock.getElapsedTime()
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <ringGeometry ref={ringRef} args={[0.8, 1, 32]} />
      <meshBasicMaterial
        color={isReal ? '#10b981' : '#ef4444'}
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function AmbientGlow({ isReal }: { isReal: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    if (lightRef.current) {
      const intensity = 0.5 + Math.sin(clock.getElapsedTime()) * 0.3
      lightRef.current.intensity = intensity
    }
  })

  return (
    <pointLight
      ref={lightRef}
      position={[0, 0, 5]}
      color={isReal ? '#10b981' : '#ef4444'}
      intensity={0.5}
      distance={10}
    />
  )
}

function SceneContent({ detections }: { detections: FaceDetection[] }) {
  const hasReal = detections.some((d) => d.label === 'real')
  const hasFake = detections.some((d) => d.label === 'fake')
  const isReal = hasReal && !hasFake

  // Create pulsing rings for each detection
  const rings = detections.map((detection, index) => {
    const x = (detection.bbox.x / 640) * 4 - 2 // Normalize to -2 to 2
    const y = -(detection.bbox.y / 480) * 3 + 1.5 // Normalize and flip Y
    return (
      <PulsingRing
        key={index}
        position={[x, y, 0]}
        isReal={detection.label === 'real'}
      />
    )
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      <AmbientGlow isReal={isReal} />
      {rings}
    </>
  )
}

export default function Scene({ detections, width = 640, height = 480 }: SceneProps) {
  return (
    <div className="absolute inset-0 -z-10" style={{ width, height }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
      >
        <SceneContent detections={detections} />
      </Canvas>
    </div>
  )
}
