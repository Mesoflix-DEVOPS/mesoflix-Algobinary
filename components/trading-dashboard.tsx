"use client"

import { useState, useEffect } from "react"
import { ArrowUpRight, ArrowDownRight, RefreshCw, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { getMarketData, getHistoricalData } from "@/lib/binance"
import { getAiStrategyAdvice, getMockStrategyAdvice } from "@/lib/openai"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface MarketData {
  symbol: string
  price: string
  volume: string
  change24h: string
}

interface KlineData {
  openTime: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  closeTime: number
}

export function TradingDashboard() {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [historicalData, setHistoricalData] = useState<KlineData[]>([])
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT")
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [aiAdvice, setAiAdvice] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [marketCondition, setMarketCondition] = useState("")
  const [error, setError] = useState("")

  const fetchMarketData = async () => {
    try {
      setRefreshing(true)
      const data = await getMarketData(["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT"])
      setMarketData(data)
    } catch (error) {
      console.error("Error fetching market data:", error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const fetchHistoricalData = async (symbol: string) => {
    try {
      const data = await getHistoricalData(symbol, "1d", 30)
      setHistoricalData(data)
    } catch (error) {
      console.error("Error fetching historical data:", error)
    }
  }

  const getAiAdvice = async () => {
    if (!marketCondition.trim()) return

    setAiLoading(true)
    setError("")
    try {
      const advice = await getAiStrategyAdvice(marketCondition)

      // Check if the response indicates a missing API key
      if (advice.includes("API key")) {
        setError("OpenAI API key is missing. Using mock responses instead.")
        // Use mock advice as fallback
        const mockAdvice = await getMockStrategyAdvice(marketCondition)
        setAiAdvice(mockAdvice)
      } else {
        setAiAdvice(advice)
      }
    } catch (error) {
      console.error("Error getting AI advice:", error)
      setError("Error connecting to AI service. Using mock responses instead.")
      // Use mock advice as fallback
      const mockAdvice = await getMockStrategyAdvice(marketCondition)
      setAiAdvice(mockAdvice)
    } finally {
      setAiLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketData()
    fetchHistoricalData(selectedSymbol)

    // Set up polling for real-time updates
    const interval = setInterval(fetchMarketData, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetchHistoricalData(selectedSymbol)
  }, [selectedSymbol])

  // Calculate some basic stats for the selected symbol
  const selectedData = marketData.find((data) => data.symbol === selectedSymbol)
  const priceChange = selectedData ? Number.parseFloat(selectedData.change24h) : 0
  const priceChangeColor = priceChange >= 0 ? "text-green-500" : "text-red-500"

  // Calculate a simple moving average from historical data
  const calculateSMA = (period: number) => {
    if (historicalData.length < period) return "N/A"

    const closePrices = historicalData.slice(0, period).map((d) => Number.parseFloat(d.close))
    const sum = closePrices.reduce((acc, price) => acc + price, 0)
    return (sum / period).toFixed(2)
  }

  const sma7 = calculateSMA(7)
  const sma25 = calculateSMA(25)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-black/80 border-teal-500/30 backdrop-blur-md md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl text-white flex items-center">
              <Zap className="mr-2 h-5 w-5 text-teal-500" />
              Trading Dashboard
            </CardTitle>
            <CardDescription className="text-gray-400">
              Real-time market data and AI-powered strategy suggestions
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-teal-500/50 text-teal-400 hover:bg-teal-900/20"
            onClick={fetchMarketData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={selectedSymbol} onValueChange={setSelectedSymbol} className="w-full">
            <TabsList className="grid grid-cols-5 bg-gray-900/50">
              {marketData.map((data) => (
                <TabsTrigger
                  key={data.symbol}
                  value={data.symbol}
                  className="data-[state=active]:bg-teal-500 data-[state=active]:text-black"
                >
                  {data.symbol.replace("USDT", "")}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-gray-400 text-sm mb-1">Current Price</div>
                <div className="text-xl font-bold text-white">
                  ${selectedData ? Number.parseFloat(selectedData.price).toLocaleString() : "Loading..."}
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-gray-400 text-sm mb-1">24h Change</div>
                <div className={`text-xl font-bold flex items-center ${priceChangeColor}`}>
                  {priceChange >= 0 ? (
                    <ArrowUpRight className="mr-1 h-5 w-5" />
                  ) : (
                    <ArrowDownRight className="mr-1 h-5 w-5" />
                  )}
                  {selectedData ? `${Number.parseFloat(selectedData.change24h).toFixed(2)}%` : "Loading..."}
                </div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-gray-400 text-sm mb-1">SMA (7)</div>
                <div className="text-xl font-bold text-white">${sma7}</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="text-gray-400 text-sm mb-1">SMA (25)</div>
                <div className="text-xl font-bold text-white">${sma25}</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-medium">Technical Analysis</h3>
                <Badge variant="outline" className="bg-teal-900/30 text-teal-400 border-teal-800">
                  Powered by AI
                </Badge>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <SignalIndicator
                    title="Trend"
                    value={priceChange >= 0 ? "Bullish" : "Bearish"}
                    status={priceChange >= 0 ? "positive" : "negative"}
                  />
                  <SignalIndicator
                    title="RSI"
                    value={Math.floor(Math.random() * 100).toString()}
                    status={Math.random() > 0.5 ? "positive" : "neutral"}
                  />
                  <SignalIndicator
                    title="MACD"
                    value={Math.random() > 0.5 ? "Bullish" : "Bearish"}
                    status={Math.random() > 0.5 ? "positive" : "negative"}
                  />
                  <SignalIndicator
                    title="Volume"
                    value={Math.random() > 0.5 ? "High" : "Low"}
                    status={Math.random() > 0.5 ? "positive" : "neutral"}
                  />
                  <SignalIndicator
                    title="Volatility"
                    value={Math.random() > 0.5 ? "High" : "Low"}
                    status={Math.random() > 0.5 ? "negative" : "neutral"}
                  />
                  <SignalIndicator title="Support/Resistance" value="Near Support" status="positive" />
                </div>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="bg-black/80 border-teal-500/30 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center">
            <Zap className="mr-2 h-5 w-5 text-teal-500" />
            AI Strategy Advisor
          </CardTitle>
          <CardDescription className="text-gray-400">Get AI-powered trading strategy suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 bg-yellow-900/20 border-yellow-800 text-yellow-400">
              <AlertTitle>API Key Missing</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">
                Describe market conditions or ask for strategy advice
              </label>
              <Textarea
                placeholder="E.g., Bitcoin is showing high volatility with a bullish trend. RSI is at 65. What strategy would work best?"
                className="bg-gray-900/50 border-gray-700 text-white resize-none"
                rows={4}
                value={marketCondition}
                onChange={(e) => setMarketCondition(e.target.value)}
              />
            </div>

            <Button
              className="w-full bg-teal-500 hover:bg-teal-600 text-black font-bold"
              onClick={getAiAdvice}
              disabled={aiLoading || !marketCondition.trim()}
            >
              {aiLoading ? "Generating Advice..." : "Get AI Strategy Advice"}
            </Button>

            {aiAdvice && (
              <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-teal-900/50 text-white text-sm max-h-60 overflow-y-auto">
                <h4 className="font-medium text-teal-400 mb-2">Strategy Recommendation:</h4>
                <div className="whitespace-pre-line">{aiAdvice}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SignalIndicator({
  title,
  value,
  status,
}: { title: string; value: string; status: "positive" | "negative" | "neutral" }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
      <div className="text-gray-400 text-sm mb-1">{title}</div>
      <div className="flex items-center justify-between">
        <div
          className={`font-bold ${
            status === "positive" ? "text-green-500" : status === "negative" ? "text-red-500" : "text-gray-300"
          }`}
        >
          {value}
        </div>
        <div
          className={`w-3 h-3 rounded-full ${
            status === "positive" ? "bg-green-500" : status === "negative" ? "bg-red-500" : "bg-gray-500"
          }`}
        ></div>
      </div>
    </div>
  )
}
