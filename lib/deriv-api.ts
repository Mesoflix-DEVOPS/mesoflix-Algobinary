import { derivConfig } from "./deriv-config"

// Deriv API Integration - V2 Hardened

interface Subscription {
    id: number;
    request: any;
    callbacks: Set<(data: any) => void>;
}

class DerivAPI {
  private ws: WebSocket | null = null
  private publicWs: WebSocket | null = null
  private messageId = 0
  private responseHandlers: Map<number, { resolve: (data: any) => void, reject: (err: any) => void }> = new Map()
  private subscriptionRegistry: Map<string, Subscription> = new Map()
  private idToSubKey: Map<number, string> = new Map()
  private serverSubIdToSubKey: Map<string, string> = new Map()
  private isConnected = false
  private pingInterval: any = null
  private connectionPromise: Promise<void> | null = null
  public currentAuthFlow: "legacy" | "new_v2" = "new_v2"
  private intentionalDisconnect = false

  private isV2Token(token: string): boolean {
    return token.length > 128 || token.includes(".")
  }

  async connect(customWsUrl?: string, skipAuthorize: boolean = false): Promise<void> {
    const isOTPUrl = customWsUrl?.includes("otp=")
    
    // If we are connecting to a private URL (OTP), we keep the public one alive for market data
    if (isOTPUrl) {
        return this.connectPrivate(customWsUrl!)
    }

    if (!this.intentionalDisconnect && this.connectionPromise && (this.publicWs?.readyState === WebSocket.CONNECTING || this.publicWs?.readyState === WebSocket.OPEN)) {
        return this.connectionPromise
    }
    
    this.intentionalDisconnect = false
    if (this.pingInterval) clearInterval(this.pingInterval)

    const wsUrl = customWsUrl || "wss://api.derivws.com/trading/v1/options/ws/public"
    
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log(`[DerivAPI] Connecting Public:`, wsUrl)
        this.publicWs = new WebSocket(wsUrl)

        this.publicWs.onopen = async () => {
          console.log("[DerivAPI] Public Connection established")
          this.isConnected = true
          this.startHeartbeat()
          
          const token = typeof window !== "undefined" ? localStorage.getItem("derivex_token") : null
          if (token && !skipAuthorize) {
              try {
                await this.authorize(token)
              } catch (e) {
                console.warn("[DerivAPI] Background authorization failed:", e)
              }
          }

          this.resubscribeAll()
          resolve()
        }

        this.publicWs.onmessage = (event) => this.handleMessage(event, true)
        this.publicWs.onclose = () => {
          this.isConnected = false
          this.connectionPromise = null
          console.log("[DerivAPI] Public Connection closed")
          if (!this.intentionalDisconnect) {
            setTimeout(() => this.connect(), 3000)
          }
        }
      } catch (err) {
        reject(err)
      }
    })

    return this.connectionPromise
  }

  private async connectPrivate(wsUrl: string): Promise<void> {
    return new Promise((resolve) => {
        console.log(`[DerivAPI] Connecting Private:`, wsUrl)
        if (this.ws) {
            this.ws.onclose = null
            this.ws.close()
        }
        this.ws = new WebSocket(wsUrl)
        this.ws.onopen = () => {
            console.log("[DerivAPI] Private Connection established")
            resolve()
        }
        this.ws.onmessage = (event) => this.handleMessage(event, false)
        this.ws.onclose = () => {
            console.log("[DerivAPI] Private Connection closed. Falling back to public for auth...")
            this.ws = null
        }
    })
  }

  private handleMessage(event: MessageEvent, isPublic: boolean) {
    try {
      const data = JSON.parse(event.data)
      if (data.msg_type === "ping" || data.ping) return
      
      if (data.error) {
          console.error(`[DerivAPI] ${isPublic ? 'Public' : 'Private'} Error:`, data.error)
      }

      const reqId = data.req_id
      const serverSubId = data.subscription?.id || data.tick?.id || data.balance?.id || data.proposal_open_contract?.id
      
      let subKey = reqId ? this.idToSubKey.get(reqId) : null
      
      // If no req_id, try to find subKey via server-side subscription ID
      if (!subKey && serverSubId) {
          subKey = this.serverSubIdToSubKey.get(serverSubId)
      }

      if (subKey) {
          const sub = this.subscriptionRegistry.get(subKey)
          if (sub && serverSubId && !this.serverSubIdToSubKey.has(serverSubId)) {
              this.serverSubIdToSubKey.set(serverSubId, subKey)
              ;(sub as any).serverSubId = serverSubId
          }
          sub?.callbacks.forEach(cb => cb(data))
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

  private resubscribeAll() {
    if (this.subscriptionRegistry.size === 0) return
    console.log(`[DerivAPI] Restoring ${this.subscriptionRegistry.size} subscriptions...`)
    this.subscriptionRegistry.forEach((sub) => {
        const isPublicReq = !sub.request.buy && !sub.request.sell && !sub.request.proposal_open_contract && !sub.request.balance
        const socket = isPublicReq ? this.publicWs : (this.ws || this.publicWs)
        
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ ...sub.request, req_id: sub.id }))
        }
    })
  }

  private async waitForConnection(): Promise<void> {
    if (this.isConnected && this.publicWs?.readyState === WebSocket.OPEN) return
    await this.connect()
  }

  private startHeartbeat() {
    this.pingInterval = setInterval(() => {
        if (this.isConnected && this.publicWs?.readyState === WebSocket.OPEN) {
            this.publicWs.send(JSON.stringify({ ping: 1 }))
        }
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ ping: 1 }))
        }
    }, 30000)
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

  private async send(message: any, forcePublic: boolean = false): Promise<any> {
    await this.waitForConnection()

    return new Promise((resolve, reject) => {
      const socket = (forcePublic || !this.ws) ? this.publicWs : this.ws
      
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        reject(new Error("No connection"))
        return
      }
      this.messageId++
      const msgId = this.messageId
      const payload = { ...message, req_id: msgId }
      this.responseHandlers.set(msgId, { resolve, reject })
      try {
        socket.send(JSON.stringify(payload))
      } catch (error) {
        this.responseHandlers.delete(msgId)
        reject(error)
      }
    })
  }

  async authorize(token: string): Promise<any> {
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
        const authenticatedWsUrl = data.data?.url || data.data?.ws_url || data.url || data.ws_url
        if (!authenticatedWsUrl) {
            console.error("[DerivAPI] Invalid OTP response structure:", data)
            throw new Error("No authenticated WebSocket URL returned.")
        }

        console.log("[DerivAPI] V2: OTP Swap successful. Migrating connection...")
        
        if (this.ws) {
            this.ws.onopen = null
            this.ws.onclose = null
            this.ws.onerror = null
        }
        
        this.intentionalDisconnect = true
        this.ws?.close() 
        return this.connect(authenticatedWsUrl, true)
    } catch (e: any) {
        console.error("[DerivAPI] V2 Auth Failed:", e)
        return { error: { message: e.message } }
    }
  }


  async getAccountSettings(): Promise<any> {
    return this.send({ get_settings: 1 })
  }

  async getAccountList(token?: string): Promise<any> {
    const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("derivex_token") : null)
    if (!activeToken) return { error: { message: "No token available" } }
    
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
                balance: acct.balance || 0
            }))
        }
    } catch (e: any) {
        return { error: { message: e.message } }
    }
  }


  async getActiveSymbols(category: string = "synthetic_index"): Promise<any[]> {
    const resp = await this.send({ active_symbols: "full" }, true)
    if (resp.error) throw new Error(resp.error.message)
    let symbols = resp.active_symbols || []
    if (category) {
        symbols = symbols.filter((s: any) => (s.market === category || s.submarket === category) && s.exchange_is_open === 1)
    }
    return symbols
  }

  async subscribeToTicks(symbol: string, onTick: (data: any) => void): Promise<number | null> {
    if (!symbol) {
        console.warn("[DerivAPI] subscribeToTicks called without symbol")
        return null
    }
    const request = { ticks: symbol, subscribe: 1 }
    return this.createMultiplexedSub(request, (data) => {
        if (data.tick) onTick(data.tick)
    })
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
      price: params.amount, 
      parameters
    })
  }

  private async createMultiplexedSub(request: any, onUpdate: (data: any) => void): Promise<number | null> {
    await this.waitForConnection()
    
    const keys = Object.keys(request).filter(k => k !== 'subscribe' && k !== 'req_id')
    if (keys.length === 0) {
        console.error("[DerivAPI] Malformed subscription request (no command key):", request)
        return null
    }

    const subKey = JSON.stringify(request)
    const existing = this.subscriptionRegistry.get(subKey)

    const isPublicReq = !request.buy && !request.sell && !request.proposal_open_contract && !request.balance

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
    
    const socket = isPublicReq ? this.publicWs : (this.ws || this.publicWs)
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log(`[DerivAPI] Sending Sub (${isPublicReq ? 'Public' : 'Private'}):`, JSON.stringify({ ...request, req_id: msgId }))
        socket.send(JSON.stringify({ ...request, req_id: msgId }))
    }
    return msgId
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
    if (sub) {
        const serverSubId = (sub as any).serverSubId
        if (serverSubId) {
            const isPublicReq = !sub.request.buy && !sub.request.sell && !sub.request.proposal_open_contract && !sub.request.balance
            const socket = isPublicReq ? this.publicWs : (this.ws || this.publicWs)
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ forget: serverSubId }))
            }
        }
        this.idToSubKey.delete(reqId)
    }
  }

  async subscribeToOpenContract(contractId: string, onUpdate: (data: any) => void): Promise<void> {
    const request = { proposal_open_contract: 1, contract_id: contractId, subscribe: 1 }
    await this.createMultiplexedSub(request, (data) => {
        if (data.proposal_open_contract) onUpdate(data.proposal_open_contract)
    })
  }
}

export const derivAPI = new DerivAPI()
