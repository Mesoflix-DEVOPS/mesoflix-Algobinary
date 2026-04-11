"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Group } from "three"

export function LoginBackground() {
  const groupRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.1
    }
  })

  // Create a grid of lines representing data flow
  const lines = []
  const gridSize = 10
  const spacing = 1

  for (let x = -gridSize; x <= gridSize; x += spacing) {
    for (let z = -gridSize; z <= gridSize; z += spacing) {
      // Skip some lines to create a more interesting pattern
      if (Math.random() > 0.7) continue

      const height = 0.5 + Math.random() * 2
      const thickness = 0.02 + Math.random() * 0.05
      const yPos = -5 + Math.random() * 10

      lines.push(
        <mesh key={`${x}-${z}`} position={[x, yPos, z]}>
          <boxGeometry args={[thickness, height, thickness]} />
          <meshStandardMaterial
            color={Math.random() > 0.8 ? "#14b8a6" : "#0f766e"}
            emissive={Math.random() > 0.8 ? "#14b8a6" : "#0f766e"}
            emissiveIntensity={0.5}
            transparent
            opacity={0.7}
          />
        </mesh>,
      )

      // Add some horizontal connectors
      if (Math.random() > 0.8) {
        const width = 0.5 + Math.random() * 1.5
        lines.push(
          <mesh key={`h-${x}-${z}`} position={[x + width / 2, yPos, z]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[thickness, height * 0.2, width]} />
            <meshStandardMaterial
              color="#14b8a6"
              emissive="#14b8a6"
              emissiveIntensity={0.5}
              transparent
              opacity={0.5}
            />
          </mesh>,
        )
      }
    }
  }

  // Add some floating particles
  const particles = []
  for (let i = 0; i < 100; i++) {
    const x = (Math.random() - 0.5) * 30
    const y = (Math.random() - 0.5) * 20
    const z = (Math.random() - 0.5) * 30

    particles.push(
      <mesh key={`p-${i}`} position={[x, y, z]}>
        <sphereGeometry args={[0.05 + Math.random() * 0.1, 8, 8]} />
        <meshStandardMaterial
          color={Math.random() > 0.7 ? "#14b8a6" : "#f0f0f0"}
          emissive={Math.random() > 0.7 ? "#14b8a6" : "#f0f0f0"}
          emissiveIntensity={0.5}
          transparent
          opacity={0.7}
        />
      </mesh>,
    )
  }

  return (
    <group ref={groupRef}>
      {lines}
      {particles}
    </group>
  )
}
