"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"
import { Canvas, useFrame } from "@react-three/fiber"
import { Environment, Float, Text3D, Html } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BarChart2, Cpu, Filter, GitBranch, Layers, Sliders } from "lucide-react"
import { Navigation } from "@/components/navigation"

export default function StrategyPage() {
  const router = useRouter()

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 z-10">
        <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
          <color attach="background" args={["#050505"]} />
          <Environment preset="city" />

          <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5} position={[0, 3, 0]}>
            <Text3D
              font="/fonts/Geist_Bold.json"
              size={1.2}
              height={0.2}
              curveSegments={12}
              bevelEnabled
              bevelThickness={0.02}
              bevelSize={0.02}
              bevelOffset={0}
              bevelSegments={5}
            >
              AlgoBlocks Studio
              <meshStandardMaterial color="#14b8a6" metalness={0.8} roughness={0.2} />
            </Text3D>
          </Float>

          <StrategyBlocks />
        </Canvas>
      </div>

      <Navigation />

      <div className="absolute inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-black/80 border-teal-500/30 backdrop-blur-md pointer-events-auto">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center">
                  <Layers className="mr-2 h-5 w-5 text-teal-500" />
                  No-Code Strategy Builder
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Build complex trading strategies without writing a single line of code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <div className="mr-2 mt-1 h-4 w-4 rounded-full bg-teal-500 flex-shrink-0"></div>
                    <span>Drag-and-drop interface for creating trading algorithms</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1 h-4 w-4 rounded-full bg-teal-500 flex-shrink-0"></div>
                    <span>Visual flow builder with pre-built components</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1 h-4 w-4 rounded-full bg-teal-500 flex-shrink-0"></div>
                    <span>Real-time validation and error checking</span>
                  </li>
                </ul>
                <Button
                  className="mt-4 bg-teal-500 hover:bg-teal-600 text-black font-bold"
                  onClick={() => router.push("/studio")}
                >
                  Try the Builder
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/80 border-teal-500/30 backdrop-blur-md pointer-events-auto">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center">
                  <GitBranch className="mr-2 h-5 w-5 text-teal-500" />
                  AlgoBlocks Components
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Powerful building blocks for your trading strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <BlockCard icon={<BarChart2 className="h-5 w-5 text-teal-500" />} title="Indicators" />
                  <BlockCard icon={<Filter className="h-5 w-5 text-teal-500" />} title="Conditions" />
                  <BlockCard icon={<Sliders className="h-5 w-5 text-teal-500" />} title="Actions" />
                  <BlockCard icon={<Cpu className="h-5 w-5 text-teal-500" />} title="Risk Management" />
                </div>
                <Button
                  variant="outline"
                  className="mt-4 w-full border-teal-500 text-teal-500 hover:bg-teal-900/20"
                  onClick={() => router.push("/backtest")}
                >
                  Learn About Backtesting
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

function BlockCard({ icon, title }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 flex items-center">
      {icon}
      <span className="ml-2 text-white">{title}</span>
    </div>
  )
}

function StrategyBlocks() {
  const groupRef = useRef()

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.2
    }
  })

  // Create floating blocks representing strategy components
  const blocks = []
  const blockTypes = [
    { color: "#0d9488", name: "Indicator" },
    { color: "#0891b2", name: "Condition" },
    { color: "#7c3aed", name: "Action" },
    { color: "#db2777", name: "Risk" },
  ]

  for (let i = 0; i < 20; i++) {
    const blockType = blockTypes[Math.floor(Math.random() * blockTypes.length)]
    const position = [(Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8]

    blocks.push(
      <group key={`block-${i}`} position={position}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={blockType.color}
            emissive={blockType.color}
            emissiveIntensity={0.3}
            transparent
            opacity={0.8}
          />
        </mesh>
        <Html position={[0, 0, 0.51]} transform occlude>
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">{blockType.name}</div>
        </Html>
      </group>,
    )

    // Add some connecting lines between blocks
    if (i > 0) {
      const prevPosition = [(Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8]

      blocks.push(
        <mesh key={`line-${i}`}>
          <cylinderGeometry
            args={[
              0.05,
              0.05,
              Math.sqrt(
                Math.pow(position[0] - prevPosition[0], 2) +
                  Math.pow(position[1] - prevPosition[1], 2) +
                  Math.pow(position[2] - prevPosition[2], 2),
              ),
              8,
            ]}
            position={[
              (position[0] + prevPosition[0]) / 2,
              (position[1] + prevPosition[1]) / 2,
              (position[2] + prevPosition[2]) / 2,
            ]}
            rotation={[
              Math.atan2(
                position[2] - prevPosition[2],
                Math.sqrt(Math.pow(position[0] - prevPosition[0], 2) + Math.pow(position[1] - prevPosition[1], 2)),
              ),
              0,
              Math.atan2(position[1] - prevPosition[1], position[0] - prevPosition[0]),
            ]}
          />
          <meshStandardMaterial color="#14b8a6" emissive="#14b8a6" emissiveIntensity={0.5} transparent opacity={0.5} />
        </mesh>,
      )
    }
  }

  return <group ref={groupRef}>{blocks}</group>
}
