"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Canvas, useFrame } from "@react-three/fiber"
import { Environment, Float, Text3D, Html } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart2, ChevronDown, Code, Cpu, Filter, GitBranch, Play, Plus, Save, Settings, Sliders } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { AiAssistant } from "@/components/ai-assistant"

export default function StudioPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("builder")

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
              Strategy Studio
              <meshStandardMaterial color="#14b8a6" metalness={0.8} roughness={0.2} />
            </Text3D>
          </Float>

          <StudioScene activeTab={activeTab} />
        </Canvas>
      </div>

      <Navigation />
      <AiAssistant />

      <div className="absolute inset-0 z-20 flex flex-col p-4 pointer-events-none">
        <div className="flex justify-between items-center mb-4 pointer-events-auto">
          <div className="flex items-center">
            <Button variant="outline" className="border-teal-500 text-teal-500 hover:bg-teal-900/20 mr-2">
              <Plus className="mr-2 h-4 w-4" />
              New Strategy
            </Button>
            <Button variant="outline" className="border-teal-500 text-teal-500 hover:bg-teal-900/20">
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
          <div className="flex items-center">
            <Button className="bg-teal-500 hover:bg-teal-600 text-black font-bold mr-2">
              <Play className="mr-2 h-4 w-4" />
              Run Backtest
            </Button>
            <Button variant="outline" className="border-teal-500 text-teal-500 hover:bg-teal-900/20">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 pointer-events-auto">
            <TabsTrigger value="builder" className="data-[state=active]:bg-teal-500 data-[state=active]:text-black">
              Strategy Builder
            </TabsTrigger>
            <TabsTrigger value="code" className="data-[state=active]:bg-teal-500 data-[state=active]:text-black">
              Code View
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-teal-500 data-[state=active]:text-black">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="flex-1 flex mt-4">
            <div className="w-64 bg-black/80 border-teal-500/30 backdrop-blur-md rounded-lg p-4 mr-4 pointer-events-auto">
              <h3 className="text-white font-medium mb-3">AlgoBlocks</h3>
              <div className="space-y-3">
                <BlockCategory title="Indicators" icon={<BarChart2 className="h-4 w-4 text-teal-500" />}>
                  <DraggableBlock title="Moving Average" color="#0d9488" />
                  <DraggableBlock title="RSI" color="#0d9488" />
                  <DraggableBlock title="MACD" color="#0d9488" />
                  <DraggableBlock title="Bollinger Bands" color="#0d9488" />
                </BlockCategory>

                <BlockCategory title="Conditions" icon={<Filter className="h-4 w-4 text-teal-500" />}>
                  <DraggableBlock title="Price Above" color="#0891b2" />
                  <DraggableBlock title="Price Below" color="#0891b2" />
                  <DraggableBlock title="Crossover" color="#0891b2" />
                  <DraggableBlock title="Percent Change" color="#0891b2" />
                </BlockCategory>

                <BlockCategory title="Actions" icon={<Sliders className="h-4 w-4 text-teal-500" />}>
                  <DraggableBlock title="Buy" color="#7c3aed" />
                  <DraggableBlock title="Sell" color="#7c3aed" />
                  <DraggableBlock title="Set Stop Loss" color="#7c3aed" />
                  <DraggableBlock title="Set Take Profit" color="#7c3aed" />
                </BlockCategory>

                <BlockCategory title="Risk Management" icon={<Cpu className="h-4 w-4 text-teal-500" />}>
                  <DraggableBlock title="Position Size" color="#db2777" />
                  <DraggableBlock title="Max Drawdown" color="#db2777" />
                  <DraggableBlock title="Portfolio Allocation" color="#db2777" />
                </BlockCategory>
              </div>
            </div>

            <div className="flex-1 bg-black/80 border-teal-500/30 backdrop-blur-md rounded-lg p-4 pointer-events-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium">Strategy Canvas</h3>
                <Button variant="outline" size="sm" className="border-teal-500 text-teal-500 hover:bg-teal-900/20">
                  <GitBranch className="mr-2 h-4 w-4" />
                  Add Branch
                </Button>
              </div>

              <div className="h-[calc(100%-40px)] bg-gray-900/50 rounded-lg border border-gray-800 flex items-center justify-center">
                <div className="text-gray-400 text-center">
                  <p>Drag and drop AlgoBlocks here to build your strategy</p>
                  <p className="text-sm mt-2">or</p>
                  <Button variant="outline" className="mt-2 border-teal-500 text-teal-500 hover:bg-teal-900/20">
                    <Plus className="mr-2 h-4 w-4" />
                    Start from Template
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="code" className="flex-1 mt-4">
            <div className="bg-black/80 border-teal-500/30 backdrop-blur-md rounded-lg p-4 h-full pointer-events-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium">Generated Code</h3>
                <Button variant="outline" size="sm" className="border-teal-500 text-teal-500 hover:bg-teal-900/20">
                  <Code className="mr-2 h-4 w-4" />
                  Copy Code
                </Button>
              </div>

              <div className="h-[calc(100%-40px)] bg-gray-900/50 rounded-lg border border-gray-800 p-4 font-mono text-sm text-gray-300 overflow-auto">
                <pre>{`
// AlgoSensei Generated Strategy
// Golden Cross with RSI Filter

function initialize() {
  // Define indicators
  const fastMA = SMA(14);
  const slowMA = SMA(50);
  const rsi = RSI(14);
  
  // Set up risk management
  setPositionSize(0.1); // 10% of portfolio per trade
  setMaxDrawdown(0.15); // 15% maximum drawdown
}

function onBar(bar) {
  // Get indicator values
  const fastValue = fastMA.getValue();
  const slowValue = slowMA.getValue();
  const rsiValue = rsi.getValue();
  
  // Golden Cross (fast MA crosses above slow MA)
  if (crossOver(fastValue, slowValue) && rsiValue < 70) {
    // Entry condition met
    buy();
    setStopLoss(bar.low * 0.95); // 5% below current low
    setTakeProfit(bar.close * 1.15); // 15% above entry
  }
  
  // Death Cross (fast MA crosses below slow MA)
  if (crossUnder(fastValue, slowValue) || rsiValue > 80) {
    // Exit condition met
    sell();
  }
}

function onExit() {
  // Clean up any resources
  log("Strategy execution completed");
}
                `}</pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 mt-4">
            <div className="bg-black/80 border-teal-500/30 backdrop-blur-md rounded-lg p-4 h-full pointer-events-auto">
              <h3 className="text-white font-medium mb-4">Strategy Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">Strategy Name</label>
                    <input
                      type="text"
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-md px-3 py-2 text-white"
                      value="Golden Cross with RSI Filter"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">Market</label>
                    <div className="relative">
                      <select className="w-full bg-gray-900/50 border border-gray-700 rounded-md px-3 py-2 text-white appearance-none">
                        <option>Crypto</option>
                        <option>Stocks</option>
                        <option>Forex</option>
                        <option>Futures</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">Timeframe</label>
                    <div className="relative">
                      <select className="w-full bg-gray-900/50 border border-gray-700 rounded-md px-3 py-2 text-white appearance-none">
                        <option>1 Hour</option>
                        <option>4 Hours</option>
                        <option>1 Day</option>
                        <option>1 Week</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">Initial Capital</label>
                    <input
                      type="text"
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-md px-3 py-2 text-white"
                      value="$10,000"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">Backtest Period</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-md px-3 py-2 text-white"
                        value="Jan 1, 2023"
                      />
                      <input
                        type="text"
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-md px-3 py-2 text-white"
                        value="Dec 31, 2023"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">Commission</label>
                    <input
                      type="text"
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-md px-3 py-2 text-white"
                      value="0.1%"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button className="bg-teal-500 hover:bg-teal-600 text-black font-bold">Save Settings</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function BlockCategory({ title, icon, children }) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div>
      <button
        className="w-full flex items-center justify-between text-white text-sm font-medium p-2 hover:bg-gray-800 rounded"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && <div className="pl-4 mt-1 space-y-1">{children}</div>}
    </div>
  )
}

function DraggableBlock({ title, color }) {
  return (
    <div className="flex items-center p-2 rounded cursor-move hover:bg-gray-800 text-sm text-white" draggable>
      <div className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: color }}></div>
      {title}
    </div>
  )
}

function StudioScene({ activeTab }) {
  const sceneRef = useRef()

  useFrame(({ clock }) => {
    if (sceneRef.current) {
      sceneRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.1
    }
  })

  // Create 3D blocks representing the strategy components
  const blocks = []

  if (activeTab === "builder") {
    // Create a flow of connected blocks for the builder view
    const blockData = [
      { type: "indicator", label: "SMA(50)", position: [-4, 1, 0], color: "#0d9488" },
      { type: "indicator", label: "SMA(200)", position: [-4, -1, 0], color: "#0d9488" },
      { type: "condition", label: "Crossover", position: [0, 0, 0], color: "#0891b2" },
      { type: "action", label: "Buy", position: [4, 1, 0], color: "#7c3aed" },
      { type: "risk", label: "Stop Loss", position: [4, -1, 0], color: "#db2777" },
    ]

    // Add blocks
    blockData.forEach((block, index) => {
      blocks.push(
        <group key={`block-${index}`} position={block.position}>
          <mesh>
            <boxGeometry args={[2, 1, 0.5]} />
            <meshStandardMaterial
              color={block.color}
              emissive={block.color}
              emissiveIntensity={0.3}
              transparent
              opacity={0.8}
            />
          </mesh>
          <Html position={[0, 0, 0.26]} transform occlude>
            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">{block.label}</div>
          </Html>
        </group>,
      )

      // Add connections
      if (index < blockData.length - 1 && (index === 0 || index === 1 || index === 2)) {
        const nextBlock = blockData[index === 0 || index === 1 ? 2 : 3]

        blocks.push(
          <mesh key={`connection-${index}`}>
            <cylinderGeometry
              args={[
                0.05,
                0.05,
                Math.sqrt(
                  Math.pow(nextBlock.position[0] - block.position[0], 2) +
                    Math.pow(nextBlock.position[1] - block.position[1], 2),
                ),
                8,
              ]}
              position={[
                (block.position[0] + nextBlock.position[0]) / 2,
                (block.position[1] + nextBlock.position[1]) / 2,
                0,
              ]}
              rotation={[
                0,
                0,
                Math.atan2(nextBlock.position[1] - block.position[1], nextBlock.position[0] - block.position[0]),
              ]}
            />
            <meshStandardMaterial
              color="#14b8a6"
              emissive="#14b8a6"
              emissiveIntensity={0.5}
              transparent
              opacity={0.7}
            />
          </mesh>,
        )
      }

      // Add connection from condition to risk management
      if (index === 2) {
        const riskBlock = blockData[4]

        blocks.push(
          <mesh key="connection-to-risk">
            <cylinderGeometry
              args={[
                0.05,
                0.05,
                Math.sqrt(
                  Math.pow(riskBlock.position[0] - block.position[0], 2) +
                    Math.pow(riskBlock.position[1] - block.position[1], 2),
                ),
                8,
              ]}
              position={[
                (block.position[0] + riskBlock.position[0]) / 2,
                (block.position[1] + riskBlock.position[1]) / 2,
                0,
              ]}
              rotation={[
                0,
                0,
                Math.atan2(riskBlock.position[1] - block.position[1], riskBlock.position[0] - block.position[0]),
              ]}
            />
            <meshStandardMaterial
              color="#14b8a6"
              emissive="#14b8a6"
              emissiveIntensity={0.5}
              transparent
              opacity={0.7}
            />
          </mesh>,
        )
      }
    })
  } else if (activeTab === "code") {
    // Create floating code blocks for the code view
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * 15
      const y = (Math.random() - 0.5) * 10
      const z = (Math.random() - 0.5) * 5

      blocks.push(
        <mesh key={`code-block-${i}`} position={[x, y, z]}>
          <boxGeometry args={[2, 0.5, 0.1]} />
          <meshStandardMaterial color="#14b8a6" emissive="#14b8a6" emissiveIntensity={0.3} transparent opacity={0.6} />
        </mesh>,
      )
    }
  } else if (activeTab === "settings") {
    // Create a gear-like structure for settings
    const gearPoints = 8
    const innerRadius = 2
    const outerRadius = 4

    for (let i = 0; i < gearPoints; i++) {
      const angle = (i / gearPoints) * Math.PI * 2
      const x1 = Math.cos(angle) * innerRadius
      const y1 = Math.sin(angle) * innerRadius
      const x2 = Math.cos(angle) * outerRadius
      const y2 = Math.sin(angle) * outerRadius

      blocks.push(
        <mesh key={`gear-inner-${i}`} position={[x1, y1, 0]}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color="#14b8a6" emissive="#14b8a6" emissiveIntensity={0.5} />
        </mesh>,
      )

      blocks.push(
        <mesh key={`gear-outer-${i}`} position={[x2, y2, 0]}>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshStandardMaterial color="#0d9488" emissive="#0d9488" emissiveIntensity={0.5} />
        </mesh>,
      )

      blocks.push(
        <mesh key={`gear-connection-${i}`}>
          <cylinderGeometry
            args={[0.2, 0.2, Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)), 8]}
            position={[(x1 + x2) / 2, (y1 + y2) / 2, 0]}
            rotation={[0, 0, Math.atan2(y2 - y1, x2 - x1)]}
          />
          <meshStandardMaterial color="#14b8a6" emissive="#14b8a6" emissiveIntensity={0.3} transparent opacity={0.7} />
        </mesh>,
      )
    }
  }

  return (
    <group ref={sceneRef} position={[0, -1, 0]}>
      {blocks}
    </group>
  )
}
