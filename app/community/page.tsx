"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"
import { Canvas, useFrame } from "@react-three/fiber"
import { Environment, Float, Text3D } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Award, Share2, Star } from "lucide-react"
import { Navigation } from "@/components/navigation"

export default function CommunityPage() {
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
              Community Hub
              <meshStandardMaterial color="#14b8a6" metalness={0.8} roughness={0.2} />
            </Text3D>
          </Float>

          <CommunityNetwork />
        </Canvas>
      </div>

      <Navigation />

      <div className="absolute inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-black/80 border-teal-500/30 backdrop-blur-md pointer-events-auto md:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center">
                  <Share2 className="mr-2 h-5 w-5 text-teal-500" />
                  Strategy Marketplace
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Discover and share trading strategies with the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <StrategyCard
                    title="Golden Cross ETF Rotator"
                    author="Sarah K."
                    rating={4.8}
                    downloads={1240}
                    tags={["Trend Following", "ETFs"]}
                  />
                  <StrategyCard
                    title="Crypto Volatility Harvester"
                    author="Michael T."
                    rating={4.6}
                    downloads={980}
                    tags={["Crypto", "Volatility"]}
                  />
                  <StrategyCard
                    title="Mean Reversion Scanner"
                    author="David L."
                    rating={4.5}
                    downloads={750}
                    tags={["Mean Reversion", "Stocks"]}
                  />
                </div>
                <Button
                  className="mt-4 bg-teal-500 hover:bg-teal-600 text-black font-bold"
                  onClick={() => router.push("/studio")}
                >
                  Browse All Strategies
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/80 border-teal-500/30 backdrop-blur-md pointer-events-auto">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center">
                  <Award className="mr-2 h-5 w-5 text-teal-500" />
                  Leaderboard
                </CardTitle>
                <CardDescription className="text-gray-400">Top performing traders this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <LeaderboardRow rank={1} name="Alex T." avatar="A" performance="+42.8%" />
                  <LeaderboardRow rank={2} name="Maria S." avatar="M" performance="+38.5%" />
                  <LeaderboardRow rank={3} name="John D." avatar="J" performance="+35.2%" />
                  <LeaderboardRow rank={4} name="Lisa K." avatar="L" performance="+31.7%" />
                  <LeaderboardRow rank={5} name="Robert M." avatar="R" performance="+28.9%" />
                </div>
                <Button variant="outline" className="mt-4 w-full border-teal-500 text-teal-500 hover:bg-teal-900/20">
                  View Full Leaderboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

function StrategyCard({ title, author, rating, downloads, tags }) {
  return (
    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-white font-medium">{title}</h3>
        <div className="flex items-center">
          <Star className="h-4 w-4 text-yellow-500 mr-1" />
          <span className="text-white text-sm">{rating}</span>
        </div>
      </div>
      <div className="flex items-center text-sm text-gray-400 mb-3">
        <span>By {author}</span>
        <span className="mx-2">•</span>
        <span>{downloads} downloads</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="outline" className="bg-teal-900/30 text-teal-400 border-teal-800">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  )
}

function LeaderboardRow({ rank, name, avatar, performance }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 text-sm font-bold ${
            rank === 1
              ? "bg-yellow-500 text-black"
              : rank === 2
                ? "bg-gray-400 text-black"
                : rank === 3
                  ? "bg-amber-700 text-white"
                  : "bg-gray-700 text-white"
          }`}
        >
          {rank}
        </div>
        <Avatar className="h-8 w-8 mr-2">
          <AvatarFallback className="bg-teal-900 text-teal-400">{avatar}</AvatarFallback>
        </Avatar>
        <span className="text-white">{name}</span>
      </div>
      <span className="text-green-500 font-medium">{performance}</span>
    </div>
  )
}

function CommunityNetwork() {
  const networkRef = useRef()

  useFrame(({ clock }) => {
    if (networkRef.current) {
      networkRef.current.rotation.y = clock.getElapsedTime() * 0.1
    }
  })

  // Create a network of nodes representing community members
  const nodes = []
  const connections = []
  const nodeCount = 30

  for (let i = 0; i < nodeCount; i++) {
    // Create a spherical distribution of nodes
    const phi = Math.acos(-1 + (2 * i) / nodeCount)
    const theta = Math.sqrt(nodeCount * Math.PI) * phi

    const x = 8 * Math.sin(phi) * Math.cos(theta)
    const y = 8 * Math.sin(phi) * Math.sin(theta)
    const z = 8 * Math.cos(phi)

    const size = 0.2 + Math.random() * 0.3
    const color = Math.random() > 0.8 ? "#14b8a6" : "#f0f0f0"

    nodes.push(
      <mesh key={`node-${i}`} position={[x, y, z]}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>,
    )

    // Create connections between some nodes
    if (i > 0 && Math.random() > 0.7) {
      const targetIndex = Math.floor(Math.random() * i)
      const targetPhi = Math.acos(-1 + (2 * targetIndex) / nodeCount)
      const targetTheta = Math.sqrt(nodeCount * Math.PI) * targetPhi

      const targetX = 8 * Math.sin(targetPhi) * Math.cos(targetTheta)
      const targetY = 8 * Math.sin(targetPhi) * Math.sin(targetTheta)
      const targetZ = 8 * Math.cos(targetPhi)

      connections.push(
        <mesh key={`connection-${i}-${targetIndex}`}>
          <cylinderGeometry
            args={[
              0.03,
              0.03,
              Math.sqrt(Math.pow(x - targetX, 2) + Math.pow(y - targetY, 2) + Math.pow(z - targetZ, 2)),
              8,
            ]}
            position={[(x + targetX) / 2, (y + targetY) / 2, (z + targetZ) / 2]}
            rotation={[
              Math.atan2(Math.sqrt(Math.pow(x - targetX, 2) + Math.pow(z - targetZ, 2)), y - targetY),
              Math.atan2(z - targetZ, x - targetX),
              0,
            ]}
          />
          <meshStandardMaterial color="#14b8a6" emissive="#14b8a6" emissiveIntensity={0.5} transparent opacity={0.3} />
        </mesh>,
      )
    }
  }

  return (
    <group ref={networkRef}>
      {nodes}
      {connections}
    </group>
  )
}
