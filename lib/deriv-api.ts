// Deriv API Integration
// App ID: 114779

const DERIV_APP_ID = process.env.NEXT_PUBLIC_DERIV_APP_ID || "114779"
const DERIV_API_URL = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`

class DerivAPI {
  private ws: WebSocket | null = null
  private messageId = 0
  private responseHandlers: Map<number, { resolve: (data: any) => void, reject: (err: any) => void }> = new Map()
  private subscriptionHandlers: Map<number, (data: any) => void> = new Map()
  private isConnected = false
  private pingInterval: any = null
  private connectionPromise: Promise<void> | null = null

  async connect(): Promise<void> {
    if (this.connectionPromise && (this.ws?.readyState === WebSocket.CONNECTING || this.ws?.readyState === WebSocket.OPEN)) {
        return this.connectionPromise
    }

    if (this.pingInterval) clearInterval(this.pingInterval)
    
    this.connectionPromise = new Promise((resolve, reject) => {
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
            if (data.msg_type === "ping") return
            
            const reqId = data.req_id
            
            // 1. Check persistent subscriptions first
            if (reqId && this.subscriptionHandlers.has(reqId)) {
                const handler = this.subscriptionHandlers.get(reqId)
                handler?.(data)
                return // DO NOT DELETE persistent handlers
            }

            // 2. Check one-off responses
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
          this.connectionPromise = null
          reject(error)
        }

        this.ws.onclose = () => {
          this.isConnected = false
          this.connectionPromise = null
          console.log("[DerivAPI] Connection closed")
          
          this.responseHandlers.forEach((handler) => {
              handler.reject(new Error("Connection closed during request"))
          })
          this.responseHandlers.clear()
          this.subscriptionHandlers.clear()
          this.messageId = 0

          setTimeout(() => {
            console.log("[DerivAPI] Attempting auto-reconnect...")
            this.connect()
          }, 3000)
        }
      } catch (err) {
        this.isConnected = false
        this.connectionPromise = null
        reject(err)
      }
    })

    return this.connectionPromise
  }

  private async waitForConnection(): Promise<void> {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) return
    if (!this.connectionPromise) await this.connect()
    else await this.connectionPromise
  }

  private startHeartbeat() {
    this.pingInterval = setInterval(() => {
        if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ ping: 1 }))
        }
    }, 30000)
  }

  private async send(message: any): Promise<any> {
    await this.waitForConnection()

    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected after waiting"))
        return
      }

      this.messageId++
      const msgId = this.messageId
      const payload = { ...message, req_id: msgId }

      this.responseHandlers.set(msgId, { resolve, reject })

      try {
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
    barrier?: string
  }): Promise<any> {
    const payload: any = {
      buy: 1,
      parameters: {
        amount: params.amount,
        basis: "stake",
        contract_type: params.contractType,
        currency: params.currency,
        duration: params.duration,
        duration_unit: "m",
        symbol: params.symbol,
      },
      price: params.amount 
    }
    if (params.barrier) payload.parameters.barrier = params.barrier
    return this.send(payload)
  }

  async subscribeToTicks(symbol: string, onTick: (data: any) => void): Promise<number | null> {
    await this.waitForConnection()
    
    const msgId = ++this.messageId
    this.subscriptionHandlers.set(msgId, (data) => {
        if (data.tick) onTick(data.tick)
    })

    this.ws?.send(JSON.stringify({
        ticks: symbol,
        subscribe: 1,
        req_id: msgId
    }))
    return msgId
  }

  async unsubscribe(reqId: number): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify({ forget: reqId }))
    this.subscriptionHandlers.delete(reqId)
  }

  async subscribeToOpenContract(contractId: string, onUpdate: (data: any) => void): Promise<void> {
    await this.waitForConnection()
    
    const msgId = ++this.messageId
    this.subscriptionHandlers.set(msgId, (data) => {
        if (data.proposal_open_contract) {
          onUpdate(data.proposal_open_contract)
          if (data.proposal_open_contract.is_sold) {
            this.subscriptionHandlers.delete(msgId)
          }
        }
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
      this.connectionPromise = null
    }
  }
}

export const derivAPI = new DerivAPI()
