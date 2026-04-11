"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Canvas, useFrame } from "@react-three/fiber"
import { Environment, Float, Text3D, Html } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { MarketDataWidget } from "@/components/market-data"

export default function BacktestPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("performance")

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
              Backtesting Engine
              <meshStandardMaterial color="#14b8a6" metalness={0.8} roughness={0.2} />
            </Text3D>
          </Float>

          <BacktestChart activeTab={activeTab} />
        </Canvas>
      </div>

      <Navigation />

      <div className="absolute inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-black/80 border-teal-500/30 backdrop-blur-md pointer-events-auto md:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center">
                  <LineChart className="mr-2 h-5 w-5 text-teal-500" />
                  Advanced Backtesting
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Test your strategies against historical data with precision
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-gray-900/50">
                    <TabsTrigger
                      value="performance"
                      className="data-[state=active]:bg-teal-500 data-[state=active]:text-black"
                    >
                      Performance
                    </TabsTrigger>
                    <TabsTrigger
                      value="trades"
                      className="data-[state=active]:bg-teal-500 data-[state=active]:text-black"
                    >
                      Trades
                    </TabsTrigger>
                    <TabsTrigger
                      value="metrics"
                      className="data-[state=active]:bg-teal-500 data-[state=active]:text-black"
                    >
                      Metrics
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="performance" className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <MetricCard title="Net Profit" value="+$12,450" positive={true} />
                      <MetricCard title="Win Rate" value="68%" positive={true} />
                      <MetricCard title="Drawdown" value="14%" positive={false} />
                      <MetricCard title="Sharpe Ratio" value="1.8" positive={true} />
                    </div>
                    <p className="text-gray-300 mb-4">
                      The performance tab shows the overall results of your strategy backtest. Analyze key metrics to
                      understand how your strategy would have performed historically.
                    </p>
                    <Button
                      className="bg-teal-500 hover:bg-teal-600 text-black font-bold"
                      onClick={() => router.push("/studio")}
                    >
                      Optimize Strategy
                    </Button>
                  </TabsContent>

                  <TabsContent value="trades" className="mt-4">
                    <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                      <div className="space-y-3">
                        <TradeRow
                          date="2023-04-15"
                          symbol="BTC/USD"
                          type="BUY"
                          price="$28,450"
                          result="+$1,240"
                          positive={true}
                        />
                        <TradeRow
                          date="2023-04-18"
                          symbol="ETH/USD"
                          type="SELL"
                          price="$1,950"
                          result="+$320"
                          positive={true}
                        />
                        <TradeRow
                          date="2023-04-22"
                          symbol="AAPL"
                          type="BUY"
                          price="$175.20"
                          result="-$420"
                          positive={false}
                        />
                        <TradeRow
                          date="2023-04-25"
                          symbol="TSLA"
                          type="SELL"
                          price="$185.40"
                          result="+$850"
                          positive={true}
                        />
                      </div>
                    </div>
                    <Button variant="outline" className="border-teal-500 text-teal-500 hover:bg-teal-900/20">
                      Export Trade History
                    </Button>
                  </TabsContent>

                  <TabsContent value="metrics" className="mt-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <h3 className="text-white font-medium mb-2">Risk Metrics</h3>
                        <ul className="space-y-2 text-gray-300 text-sm">
                          <li className="flex justify-between">
                            <span>Max Drawdown</span>
                            <span>14%</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Volatility</span>
                            <span>18%</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Sortino Ratio</span>
                            <span>1.6</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Calmar Ratio</span>
                            <span>2.1</span>
                          </li>
                        </ul>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <h3 className="text-white font-medium mb-2">Performance Metrics</h3>
                        <ul className="space-y-2 text-gray-300 text-sm">
                          <li className="flex justify-between">
                            <span>Total Trades</span>
                            <span>124</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Win/Loss Ratio</span>
                            <span>2.1</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Avg. Holding Time</span>
                            <span>3.2 days</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Profit Factor</span>
                            <span>1.8</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <Button
                      className="bg-teal-500 hover:bg-teal-600 text-black font-bold"
                      onClick={() => router.push("/community")}
                    >
                      Compare with Community
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <MarketDataWidget />
          </div>
        </div>
      </div>
    </main>
  )
}

function MetricCard({ title, value, positive }) {
  return (
    <div className="bg-gray-900/50 rounded-lg p-3">
      <div className="text-gray-400 text-sm mb-1">{title}</div>
      <div className={`text-lg font-bold ${positive ? "text-green-500" : "text-red-500"}`}>{value}</div>
    </div>
  )
}

function TradeRow({ date, symbol, type, price, result, positive }) {
  return (
    <div className="flex items-center justify-between text-sm border-b border-gray-800 pb-2">
      <div className="text-gray-400">{date}</div>
      <div className="text-white font-medium">{symbol}</div>
      <div className={`font-medium ${type === "BUY" ? "text-green-500" : "text-red-500"}`}>{type}</div>
      <div className="text-white">{price}</div>
      <div className={`font-medium ${positive ? "text-green-500" : "text-red-500"}`}>{result}</div>
    </div>
  )
}

function BacktestChart({ activeTab }) {
  const chartRef = useRef()

  useFrame(({ clock }) => {
    if (chartRef.current) {
      chartRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.1
    }
  })

  // Create a 3D chart visualization
  const chartData = []
  const dataPoints = 20

  for (let i = 0; i < dataPoints; i++) {
    let height

    if (activeTab === "performance") {
      // Create an upward trending chart with some volatility
      height = 0.5 + (i / dataPoints) * 3 + (Math.random() - 0.3) * 0.8
    } else if (activeTab === "trades") {
      // Create a more volatile chart with individual spikes
      height = 1 + Math.random() * 2 + (i % 3 === 0 ? 1 : 0)
    } else {
      // Create a smoother chart for metrics
      height = 1 + Math.sin(i * 0.5) * 1.5 + i / dataPoints
    }

    const x = (i - dataPoints / 2) * 0.8

    chartData.push(
      <group key={`bar-${i}`} position={[x, height / 2, 0]}>
        <mesh>
          <boxGeometry args={[0.3, height, 0.3]} />
          <meshStandardMaterial
            color={height > 1.5 ? "#14b8a6" : "#0d9488"}
            emissive={height > 1.5 ? "#14b8a6" : "#0d9488"}
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>,
    )

    // Add connecting line to next point if not the last point
    if (i < dataPoints - 1) {
      const nextHeight = 0.5 + ((i + 1) / dataPoints) * 3 + (Math.random() - 0.3) * 0.8
      const nextX = (i + 1 - dataPoints / 2) * 0.8

      chartData.push(
        <mesh key={`line-${i}`}>
          <cylinderGeometry
            args={[0.05, 0.05, Math.sqrt(Math.pow(nextX - x, 2) + Math.pow(nextHeight - height, 2)), 8]}
            position={[(x + nextX) / 2, (height + nextHeight) / 2, 0]}
            rotation={[0, 0, Math.atan2(nextHeight - height, nextX - x)]}
          />
          <meshStandardMaterial color="#14b8a6" emissive="#14b8a6" emissiveIntensity={0.5} transparent opacity={0.7} />
        </mesh>,
      )
    }
  }

  return (
    <group ref={chartRef} position={[0, -1, 0]}>
      {/* Base platform */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.5} />
      </mesh>

      {/* Chart data */}
      {chartData}

      {/* Chart labels */}
      <Html position={[-8, -0.5, 0]} transform>
        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Start Date</div>
      </Html>
      <Html position={[8, -0.5, 0]} transform>
        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">End Date</div>
      </Html>
      <Html position={[-9, 4, 0]} transform>
        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Performance</div>
      </Html>
    </group>
  )
}
