// Deriv API Integration
// App ID: 114779

const DERIV_APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || "114779"
const DERIV_API_URL = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`

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
  private responseHandlers: Map<number, { resolve: (data: any) => void, reject: (err: any) => void }> = new Map()
  private isConnected = false
  private pingInterval: any = null

  async connect(): Promise<void> {
    if (this.pingInterval) clearInterval(this.pingInterval)
    
    return new Promise((resolve, reject) => {
      try {
        console.log("[DerivAPI] Connecting to:", DERIV_API_URL)
        this.ws = new WebSocket(DERIV_API_URL)

        this.ws.onopen = () => {
          console.log("[DerivAPI] Connection established")
          this.isConnected = true
          this.startHeartbeat()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            // Handle Heartbeat Pong
            if (data.msg_type === "ping") return
            
            const reqId = data.req_id
            if (reqId && this.responseHandlers.has(reqId)) {
                const handler = this.responseHandlers.get(reqId)
                handler?.resolve(data)
                this.responseHandlers.delete(reqId)
            }
          } catch (err) {
            console.error("[DerivAPI] Error parsing message:", err)
          }
        }

        this.ws.onerror = (error) => {
          console.error("[DerivAPI] WebSocket error:", error)
          this.isConnected = false
          reject(error)
        }

        this.ws.onclose = () => {
          this.isConnected = false
          console.log("[DerivAPI] Connection closed")
          
          // Clear all pending handlers
          this.responseHandlers.forEach((handler) => {
              handler.reject(new Error("Connection closed during request"))
          })
          this.responseHandlers.clear()
          this.messageId = 0

          // Auto-reconnect after 3 seconds
          setTimeout(() => {
            console.log("[DerivAPI] Attempting auto-reconnect...")
            this.connect()
          }, 3000)
        }
      } catch (err) {
        this.isConnected = false
        reject(err)
      }
    })
  }

  private startHeartbeat() {
    this.pingInterval = setInterval(() => {
        if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ ping: 1 }))
        }
    }, 30000)
  }

  private send(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"))
        return
      }

      this.messageId++
      const msgId = this.messageId
      const payload = { ...message, req_id: msgId }

      this.responseHandlers.set(msgId, { resolve, reject })

      try {
        // Timeout after 30 seconds
        setTimeout(() => {
          if (this.responseHandlers.has(msgId)) {
            this.responseHandlers.delete(msgId)
            console.error(`[DerivAPI] Request ${msgId} timed out:`, message)
            reject(new Error("Request timeout"))
          }
        }, 30000)

        this.ws.send(JSON.stringify(payload))
      } catch (error) {
        console.error("[DerivAPI] Send error:", error)
        this.responseHandlers.delete(msgId)
        reject(error)
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
        granularity: 300,
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
          duration_unit: "t", // Use ticks for faster MVP testing if needed, or 'm' for 2-min
          symbol: params.symbol,
        },
      },
    })
  }

  async subscribeToOpenContract(contractId: string, onUpdate: (data: any) => void): Promise<void> {
    const msgId = ++this.messageId
    this.responseHandlers.set(msgId, {
      resolve: (data) => {
        if (data.proposal_open_contract) {
          onUpdate(data.proposal_open_contract)
          if (data.proposal_open_contract.is_sold) {
            this.responseHandlers.delete(msgId)
          }
        }
      },
      reject: (err) => console.error("[DerivAPI] Subscription error:", err)
    })

    this.ws?.send(JSON.stringify({
      proposal_open_contract: 1,
      contract_id: contractId,
      subscribe: 1,
      req_id: msgId
    }))
  }

  disconnect(): void {
    if (this.ws) {
      if (this.pingInterval) clearInterval(this.pingInterval)
      this.ws.close()
      this.isConnected = false
    }
  }
}

export const derivAPI = new DerivAPI()
