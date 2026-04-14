import { derivConfig } from "./deriv-config"

// Deriv API Integration - V2 Hardened

interface Subscription {
    id: number;
    request: any;
    callbacks: Set<(data: any) => void>;
}

class DerivAPI {
  private ws: WebSocket | null = null
  private messageId = 0
  private responseHandlers: Map<number, { resolve: (data: any) => void, reject: (err: any) => void }> = new Map()
  private subscriptionRegistry: Map<string, Subscription> = new Map()
  private idToSubKey: Map<number, string> = new Map()
  private isConnected = false
  private pingInterval: any = null
  private connectionPromise: Promise<void> | null = null
  public currentAuthFlow: "legacy" | "new_v2" = "new_v2"
  private intentionalDisconnect = false

  async connect(customWsUrl?: string): Promise<void> {
    if (!this.intentionalDisconnect && this.connectionPromise && (this.ws?.readyState === WebSocket.CONNECTING || this.ws?.readyState === WebSocket.OPEN)) {
        return this.connectionPromise
    }

    this.intentionalDisconnect = false

    if (this.pingInterval) clearInterval(this.pingInterval)
    
    if (typeof window !== "undefined") {
        this.currentAuthFlow = (localStorage.getItem("derivex_auth_flow") as any) || "new_v2"
    }
    
    const defaultWsUrl = this.currentAuthFlow === "new_v2"
        ? "wss://api.derivws.com/trading/v1/options/ws/public"
        : `wss://ws.derivws.com/websockets/v3?app_id=${derivConfig.LEGACY_APP_ID}`
    const wsUrl = customWsUrl || defaultWsUrl
    
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log(`[DerivAPI] Connecting (Flow: ${this.currentAuthFlow}):`, wsUrl)
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = async () => {
          console.log("[DerivAPI] Connection established")
          this.isConnected = true
          this.startHeartbeat()
          
          const token = typeof window !== "undefined" ? localStorage.getItem("derivex_token") : null
          const isPublicUrl = this.ws?.url.includes("/public")
          
          if (token) {
              if (this.currentAuthFlow === "new_v2" && isPublicUrl) {
                  console.log("[DerivAPI] V2: Initiating OTP swap...")
                  await this.authorize(token)
                  resolve()
                  return
              } else if (this.currentAuthFlow === "legacy") {
                  await this.authorize(token)
              }
          }

          this.resubscribeAll()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.msg_type === "ping") return
            
            if (data.error?.code === 'AlreadySubscribed') {
                console.log("[DerivAPI] Session inherited subscription:", data.error.message)
                return
            }

            if (data.error) {
                console.error("[DerivAPI] Server Error:", data.error)
            }

            const reqId = data.req_id
            const subKey = this.idToSubKey.get(reqId)
            if (subKey) {
                const sub = this.subscriptionRegistry.get(subKey)
                sub?.callbacks.forEach(cb => cb(data))
                return
            }

            if (reqId && this.responseHandlers.has(reqId)) {
                const handler = this.responseHandlers.get(reqId)
                handler?.resolve(data)
                this.responseHandlers.delete(reqId)
            }
          } catch (err) {
            console.error("[DerivAPI] Parse error:", err)
          }
        }

        this.ws.onclose = () => {
          this.isConnected = false
          this.connectionPromise = null
          this.messageId = 0
          console.log("[DerivAPI] Connection closed")
          this.responseHandlers.forEach(h => h.reject(new Error("Lost")))
          this.responseHandlers.clear()
          if (this.pingInterval) clearInterval(this.pingInterval)
          setTimeout(() => {
            if (!this.intentionalDisconnect) this.connect(customWsUrl)
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

  private resubscribeAll() {
    if (this.subscriptionRegistry.size === 0) return
    console.log(`[DerivAPI] Restoring ${this.subscriptionRegistry.size} multiplexed sources...`)
    this.subscriptionRegistry.forEach((sub) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ ...sub.request, req_id: sub.id }))
        }
    })
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
    }, 15000)
  }

  disconnect() {
      this.intentionalDisconnect = true
      if (this.pingInterval) clearInterval(this.pingInterval)
      if (this.ws) {
          this.ws.onclose = null 
          this.ws.close()
          this.ws = null
      }
      this.isConnected = false
      this.connectionPromise = null
  }

  private async send(message: any): Promise<any> {
    await this.waitForConnection()

    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("No socket"))
        return
      }
      this.messageId++
      const msgId = this.messageId
      const payload = { ...message, req_id: msgId }
      this.responseHandlers.set(msgId, { resolve, reject })
      try {
        this.ws.send(JSON.stringify(payload))
      } catch (error) {
        this.responseHandlers.delete(msgId)
        reject(error)
      }
    })
  }

  async authorize(token: string): Promise<any> {
    if (this.currentAuthFlow === "new_v2") {
        let activeAcct = typeof window !== "undefined" ? localStorage.getItem("derivex_acct") : null
        
        if (!activeAcct) {
            const listData = await this.getAccountList(token)
            if (listData?.account_list?.length > 0) {
                const primary = listData.account_list.find((a: any) => a.is_virtual === 0) || listData.account_list[0]
                activeAcct = primary.loginid
                if (typeof window !== "undefined" && activeAcct) {
                    localStorage.setItem("derivex_acct", activeAcct)
                }
            }
        }

        if (!activeAcct) return { error: { message: "No account." } }
        
        try {
            const res = await fetch(`https://api.derivws.com/trading/v1/options/accounts/${activeAcct}/otp`, {
                method: "POST",
                headers: {
                    "Deriv-App-ID": derivConfig.CLIENT_ID,
                    "Authorization": `Bearer ${token}`
                }
            })
            if (!res.ok) {
                const text = await res.json()
                return { error: { message: text?.errors?.[0]?.message || "OTP Error" } }
            }
            const data = await res.json()
            const otpUrl = data.data?.url
            if (!otpUrl) return { error: { message: "No OTP" } }

            this.disconnect()
            await this.connect(otpUrl)
            return { authorize: { loginid: activeAcct, balance: 0, currency: "USD" } }
        } catch (e: any) {
            return { error: { message: e.message } }
        }
    } else {
        return this.send({ authorize: token })
    }
  }

  async getAccountList(token?: string): Promise<any> {
    if (this.currentAuthFlow === "new_v2") {
        const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("derivex_token") : null)
        if (!activeToken) return { error: { message: "No token." } }
        
        try {
            const res = await fetch("https://api.derivws.com/trading/v1/options/accounts", {
                method: "GET",
                headers: {
                    "Deriv-App-ID": derivConfig.CLIENT_ID,
                    "Authorization": `Bearer ${activeToken}`
                }
            })
            if (!res.ok) return { error: { message: "List Failed" } }
            const data = await res.json()
            const accounts = data.data || data.accounts || data.account_list || []
            return {
                account_list: accounts.map((acct: any) => ({
                    loginid: acct.account_id || acct.id || acct.loginid,
                    is_virtual: acct.account_type === "demo" ? 1 : 0,
                    currency: acct.currency || "USD",
                    token: activeToken
                }))
            }
        } catch (e: any) {
            return { error: { message: e.message } }
        }
    } else {
        return this.send({ account_list: 1 })
    }
  }

  async getSyntheticMarkets(): Promise<any[]> {
    // V2 Unified active_symbols: product_type is often required for options symbols
    const request: any = { active_symbols: "brief" }
    if (this.currentAuthFlow === "new_v2") request.product_type = "options"
    
    const resp = await this.send(request)
    if (!resp.active_symbols) return []
    return resp.active_symbols.filter((s: any) => 
        (s.market === 'synthetic_index' || s.submarket === 'volatility_indices' || s.submarket === 'jump_indices') 
        && s.exchange_is_open === 1
    )
  }

  async buyContract(params: {
    contractType: string
    currency: string
    amount: number
    duration: number
    duration_unit: "t" | "m" | "h" | "d"
    symbol: string
    barrier?: string
  }): Promise<any> {
    const parameters: Record<string, any> = {
        amount: params.amount,
        basis: "stake",
        contract_type: params.contractType,
        currency: params.currency,
        duration: params.duration,
        duration_unit: params.duration_unit,
        symbol: params.symbol
    }
    
    if (params.barrier) parameters.barrier = String(params.barrier)

    return this.send({
      buy: 1,
      price: params.amount, // MUST match the stake amount for maximum purchase price
      parameters
    })
  }

  private async createMultiplexedSub(request: any, onUpdate: (data: any) => void): Promise<number> {
    await this.waitForConnection()
    const subKey = JSON.stringify(request)
    const existing = this.subscriptionRegistry.get(subKey)

    if (existing) {
        existing.callbacks.add(onUpdate)
        const mockId = Math.floor(Math.random() * 1000000)
        this.idToSubKey.set(mockId, subKey)
        return mockId
    }

    const msgId = ++this.messageId
    const newSub: Subscription = {
        id: msgId,
        request,
        callbacks: new Set([onUpdate])
    }
    this.subscriptionRegistry.set(subKey, newSub)
    this.idToSubKey.set(msgId, subKey)
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ ...request, req_id: msgId }))
    }
    return msgId
  }

  async subscribeToTicks(symbol: string, onTick: (data: any) => void): Promise<number | null> {
    const request = { ticks: symbol, subscribe: 1 }
    return this.createMultiplexedSub(request, (data) => {
        if (data.tick) onTick(data.tick)
    })
  }

  async fetchTicksHistoryWithSubscribe(symbol: string, count: number = 1000, onHistory: (data: any) => void, onTick: (data: any) => void): Promise<number | null> {
    const request = {
        ticks_history: symbol,
        end: "latest",
        count: count,
        style: "ticks",
        subscribe: 1
    }
    return this.createMultiplexedSub(request, (data) => {
        if (data.history) onHistory(data.history)
        if (data.tick) onTick(data.tick)
    })
  }

  async subscribeToBalance(onBalance: (data: any) => void): Promise<number | null> {
    return this.createMultiplexedSub({ balance: 1, subscribe: 1 }, (data) => {
        if (data.balance) onBalance(data.balance)
    })
  }

  async unsubscribe(reqId: number): Promise<void> {
    const subKey = this.idToSubKey.get(reqId)
    if (!subKey) return
    const sub = this.subscriptionRegistry.get(subKey)
    if (sub) this.idToSubKey.delete(reqId)
  }

  async subscribeToOpenContract(contractId: string, onUpdate: (data: any) => void): Promise<void> {
    const request = { proposal_open_contract: 1, contract_id: contractId, subscribe: 1 }
    await this.createMultiplexedSub(request, (data) => {
        if (data.proposal_open_contract) onUpdate(data.proposal_open_contract)
    })
  }
}

export const derivAPI = new DerivAPI()
