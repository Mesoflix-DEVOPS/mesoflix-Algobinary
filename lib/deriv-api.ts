// Deriv API Integration
// App ID: 114779

const DERIV_APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || "114779"
const DERIV_API_URL = "wss://ws.derivws.com/websockets/v3"

interface DerivMessage {
  authorize?: string
  active_symbols?: string
  ticks_history?: {
    symbol: string
    granularity?: number
    start?: number
    end?: number
    count?: number
    style?: string
  }
  buy?: {
    contract_type: string
    currency: string
    parameters: {
      amount: number
      basis: string
      duration: number
      duration_unit: string
      symbol: string
      trading_period_start?: number
    }
  }
}

class DerivAPI {
  private ws: WebSocket | null = null
  private messageId = 0
  private responseHandlers: Map<number, (data: any) => void> = new Map()
  private isConnected = false

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(DERIV_API_URL)

        this.ws.onopen = () => {
          console.log("[v0] Connected to Deriv API")
          this.isConnected = true
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            const reqId = data.req_id

            if (reqId && this.responseHandlers.has(reqId)) {
              const handler = this.responseHandlers.get(reqId)
              handler?.(data)
              this.responseHandlers.delete(reqId)
            }

            // Handle subscription messages
            if (data.tick || data.candles) {
              console.log("[v0] Market data received:", data)
            }
          } catch (err) {
            console.error("[v0] Error parsing Deriv message:", err)
          }
        }

        this.ws.onerror = (error) => {
          console.error("[v0] WebSocket error:", error)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log("[v0] Disconnected from Deriv API")
          this.isConnected = false
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  private send(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || !this.isConnected) {
        reject(new Error("WebSocket not connected"))
        return
      }

      this.messageId++
      const msgId = this.messageId
      const payload = { ...message, req_id: msgId }

      this.responseHandlers.set(msgId, resolve)

      try {
        this.ws.send(JSON.stringify(payload))

        // Timeout after 30 seconds
        setTimeout(() => {
          if (this.responseHandlers.has(msgId)) {
            this.responseHandlers.delete(msgId)
            reject(new Error("Request timeout"))
          }
        }, 30000)
      } catch (err) {
        this.responseHandlers.delete(msgId)
        reject(err)
      }
    })
  }

  async authorize(token: string): Promise<any> {
    return this.send({ authorize: token })
  }

  async getActiveSymbols(): Promise<any> {
    return this.send({ active_symbols: "brief" })
  }

  async getTicks(symbol: string, count: number = 100): Promise<any> {
    return this.send({
      ticks_history: {
        symbol,
        count,
        style: "candles",
        granularity: 300, // 5-minute candles
      },
    })
  }

  async buyContract(params: {
    contractType: string
    currency: string
    amount: number
    duration: number
    symbol: string
  }): Promise<any> {
    return this.send({
      buy: {
        contract_type: params.contractType,
        currency: params.currency,
        parameters: {
          amount: params.amount,
          basis: "stake",
          duration: params.duration,
          duration_unit: "m",
          symbol: params.symbol,
        },
      },
    })
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.isConnected = false
    }
  }
}

export const derivAPI = new DerivAPI()
