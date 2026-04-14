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

  private isV2Token(token: string): boolean {
    // V2 tokens are typically long JWTs or opaque strings (> 128 chars) containing dots or complex characters
    return token.length > 128 || token.includes(".")
  }

  async connect(customWsUrl?: string, skipAuthorize: boolean = false): Promise<void> {
    if (!this.intentionalDisconnect && this.connectionPromise && (this.ws?.readyState === WebSocket.CONNECTING || this.ws?.readyState === WebSocket.OPEN)) {
        return this.connectionPromise
    }

    this.intentionalDisconnect = false

    if (this.pingInterval) clearInterval(this.pingInterval)
    
    // Default flow detection from localStorage
    if (typeof window !== "undefined") {
        this.currentAuthFlow = (localStorage.getItem("derivex_auth_flow") as any) || "legacy"
    }
    
    // Choose endpoint based on known state or custom URL
    const token = typeof window !== "undefined" ? localStorage.getItem("derivex_token") : null
    let wsUrl = customWsUrl
    
    if (!wsUrl) {
        if (token && this.isV2Token(token)) {
            // V2 Tokens MUST use the v2 endpoint
            wsUrl = "wss://api.derivws.com/trading/v1/options/ws/public"
            this.currentAuthFlow = "new_v2"
        } else {
            // Legacy / Public use the stable legacy endpoint
            wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${derivConfig.LEGACY_APP_ID}`
        }
    }
    
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log(`[DerivAPI] Connecting (Flow: ${this.currentAuthFlow}):`, wsUrl)
        this.ws = new WebSocket(wsUrl!)

        this.ws.onopen = async () => {
          console.log("[DerivAPI] Connection established")
          this.isConnected = true
          this.startHeartbeat()
          
          // CRITICAL: Prevent infinite authorization loop
          // If skipAuthorize is true OR the URL already contains an OTP, the socket is already authorized.
          const isOTPUrl = wsUrl?.includes("otp=")
          if (token && !skipAuthorize && !isOTPUrl) {
              try {
                await this.authorize(token)
              } catch (e) {
                console.warn("[DerivAPI] Background authorization failed:", e)
              }
          } else if (isOTPUrl) {
              console.log("[DerivAPI] Authenticated V2 session active via OTP.")
          }

          this.resubscribeAll()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            // Handle V2 vs Legacy Heartbeats
            if (data.msg_type === "ping" || data.ping) return
            
            if (data.error?.code === 'AlreadySubscribed') {
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
          
          if (!this.intentionalDisconnect) {
            setTimeout(() => this.connect(customWsUrl), 3000)
          }
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
    console.log(`[DerivAPI] Restoring ${this.subscriptionRegistry.size} subscriptions...`)
    this.subscriptionRegistry.forEach((sub) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ ...sub.request, req_id: sub.id }))
        }
    })
  }

  private async waitForConnection(): Promise<void> {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) return
    await this.connect()
  }

  private startHeartbeat() {
    this.pingInterval = setInterval(() => {
        if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
            // Standard Deriv heartbeat format
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
        reject(new Error("No connection"))
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
    if (this.isV2Token(token)) {
        // --- V2 OTP Flow (Backend Proxy) ---
        // Browser fetch to api.derivws.com is blocked by CORS.
        // We use our local backend route to fetch the authenticated OTP URL.
        const activeAcct = typeof window !== "undefined" ? localStorage.getItem("derivex_acct") : null
        if (!activeAcct) throw new Error("No active account for V2 authorization.")
        
        console.log("[DerivAPI] V2: Initiating OTP swap via backend proxy...")
        try {
            const res = await fetch(`/api/auth/deriv/otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accountId: activeAcct, token })
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error || "OTP swap failed.")
            }
            
            const data = await res.json()
            const authenticatedWsUrl = data.ws_url
            if (!authenticatedWsUrl) throw new Error("No authenticated WebSocket URL returned.")
            
            // Swap to the authenticated WebSocket session
            console.log("[DerivAPI] V2: OTP Swap successful. Migrating connection...")
            this.intentionalDisconnect = true
            this.ws?.close() 
            await this.connect(authenticatedWsUrl, true)
            return { authorize: { loginid: activeAcct } }
        } catch (e: any) {
            console.error("[DerivAPI] V2 Auth Failed:", e)
            return { error: { message: e.message } }
        }
    } else {
        // --- Legacy Path ---
        return this.send({ authorize: token })
    }
  }

  async getAccountSettings(): Promise<any> {
    return this.send({ get_settings: 1 })
  }

  async getAccountList(token?: string): Promise<any> {
    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("derivex_token") : null)
    if (activeToken && this.isV2Token(activeToken)) {
        try {
            console.log("[DerivAPI] Fetching V2 account list via proxy...")
            const res = await fetch("/api/auth/deriv/accounts", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${activeToken}`
                }
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                return { error: { message: errData.error || "List Failed" } }
            }
            const data = await res.json()
            const accounts = data.data || []
            return {
                account_list: accounts.map((acct: any) => ({
                    loginid: acct.account_id || acct.id || acct.loginid,
                    is_virtual: acct.account_type === "demo" ? 1 : 0,
                    currency: acct.currency || "USD",
                    token: activeToken,
                    // Map balance for the syncBalances efficiency
                    balance: acct.balance || 0
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
    const resp = await this.send({ active_symbols: "brief" })
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
