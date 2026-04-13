import { derivConfig } from "./deriv-config"

// Deriv API Integration

class DerivAPI {
  private ws: WebSocket | null = null
  private messageId = 0
  private responseHandlers: Map<number, { resolve: (data: any) => void, reject: (err: any) => void }> = new Map()
  private subscriptionHandlers: Map<number, (data: any) => void> = new Map()
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
    
    // Determine which app ID to use based on the saved auth flow
    if (typeof window !== "undefined") {
        this.currentAuthFlow = (localStorage.getItem("derivex_auth_flow") as any) || "new_v2"
    }
    
    // V2 flow uses the public V2 WebSocket for market data (no app_id needed).
    // Legacy flow continues using ws.derivws.com with the numeric legacy app_id.
    // When authorize() is called under V2, the socket is swapped to an OTP-authenticated private socket.
    const defaultWsUrl = this.currentAuthFlow === "new_v2"
        ? "wss://api.derivws.com/trading/v1/options/ws/public"
        : `wss://ws.derivws.com/websockets/v3?app_id=${derivConfig.LEGACY_APP_ID}`
    const wsUrl = customWsUrl || defaultWsUrl
    
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log(`[DerivAPI] Connecting to dynamically resolved endpoint (Flow: ${this.currentAuthFlow}):`, wsUrl)
        this.ws = new WebSocket(wsUrl)

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
            if (!this.intentionalDisconnect) {
                console.log("[DerivAPI] Attempting auto-reconnect...")
                this.connect(customWsUrl)
            }
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

  disconnect() {
      console.log("[DerivAPI] Intentionally disconnecting active WebSocket socket layer...")
      this.intentionalDisconnect = true
      if (this.pingInterval) clearInterval(this.pingInterval)
      if (this.ws) {
          this.ws.onclose = null 
          this.ws.close()
          this.ws = null
      }
      this.isConnected = false
      this.connectionPromise = null
      this.responseHandlers.forEach(h => h.reject(new Error("Socket swapped.")))
      this.responseHandlers.clear()
      // We do not clear subscriptionHandlers to allow them to recover post-swap!
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
    if (this.currentAuthFlow === "new_v2") {
        console.log("[DerivAPI] Intercepting authorize request for V2 Flow architecture...")
        let activeAcct = typeof window !== "undefined" ? localStorage.getItem("derivex_acct") : null
        
        // Self-heal: If activeAcct is missing (e.g. during very first login callback), fetch it!
        if (!activeAcct) {
            console.log("[DerivAPI] activeAcct missing during V2 Auth. Self-healing via REST account list...")
            const listData = await this.getAccountList(token)
            if (listData?.account_list?.length > 0) {
                // Prefer real account if available, otherwise fallback to demo
                const primary = listData.account_list.find((a: any) => a.is_virtual === 0) || listData.account_list[0]
                activeAcct = primary.loginid
                if (typeof window !== "undefined" && activeAcct) {
                    localStorage.setItem("derivex_acct", activeAcct)
                }
            }
        }

        if (!activeAcct) {
            console.warn("[DerivAPI] activeAcct is strictly missing for V2 OTP fetching.")
            return { error: { message: "No active account selected/found for V2 Auth." } }
        }
        
        try {
            console.log("[DerivAPI] Requesting OTP from https://api.derivws.com/trading/v1/options/accounts/" + activeAcct + "/otp")
            const res = await fetch(`https://api.derivws.com/trading/v1/options/accounts/${activeAcct}/otp`, {
                method: "POST",
                headers: {
                    "Deriv-App-ID": derivConfig.CLIENT_ID,
                    "Authorization": `Bearer ${token}`
                }
            })
            if (!res.ok) {
                const text = await res.json()
                const errSnippet = text?.errors?.[0]?.message || "OTP HTTP REST Failed"
                console.error("[DerivAPI] OTP Fetch Failed:", text)
                return { error: { message: errSnippet } }
            }
            const data = await res.json()
            const otpUrl = data.data?.url
            if (!otpUrl) return { error: { message: "No OTP URL returned from endpoint" } }

            // Safely swap sockets inline
            this.disconnect()
            await this.connect(otpUrl)
            
            console.log("[DerivAPI] V2 Authorized Socket established seamlessly!")
            
            // Falsify older format `authorize` response to ensure backward UI structural compatibility
            return { authorize: { 
                loginid: activeAcct, 
                email: `${activeAcct.toLowerCase()}@v2-session.deriv.local`, 
                balance: 0, 
                currency: "USD",
                fullname: `Trader ${activeAcct}`
            } }
        } catch (e: any) {
            console.error("[DerivAPI] V2 REST Exception:", e)
            return { error: { message: e.message } }
        }
    } else {
        return this.send({ authorize: token })
    }
  }

  async getAccountList(token?: string): Promise<any> {
    if (this.currentAuthFlow === "new_v2") {
        const activeToken = token || (typeof window !== "undefined" ? localStorage.getItem("derivex_token") : null)
        if (!activeToken) return { error: { message: "No API token found to fetch account list." } }
        
        try {
            const res = await fetch("https://api.derivws.com/trading/v1/options/accounts", {
                method: "GET",
                headers: {
                    "Deriv-App-ID": derivConfig.CLIENT_ID,
                    "Authorization": `Bearer ${activeToken}`
                }
            })
            const data = await res.json()

            // LOG the raw shape so we can see exactly what the API returns
            console.log("[DerivAPI] Raw V2 /accounts response:", JSON.stringify(data))

            if (!res.ok) {
                const errSnippet = data?.errors?.[0]?.message || "Account List Fetch Failed"
                return { error: { message: errSnippet } }
            }

            const accounts = data.data || data.accounts || data.account_list || []
            return {
                account_list: accounts.map((acct: any) => {
                    // Try every known field name Deriv might use for account ID
                    const loginid = acct.account_id || acct.accountId || acct.id || acct.loginid || acct.login
                    console.log("[DerivAPI] Mapping account:", acct, "→ loginid:", loginid)
                    return {
                        loginid,
                        // V2 REST API uses account_type: "demo"/"real" instead of is_virtual
                        is_virtual: acct.account_type === "demo" || acct.is_virtual === true || acct.is_virtual === 1 ? 1 : 0,
                        account_type: acct.account_type,
                        currency: acct.currency || acct.account_currency || "USD",
                        balance: acct.balance,
                        token: activeToken
                    }
                })
            }
        } catch (e: any) {
            return { error: { message: e.message } }
        }
    } else {
        return this.send({ account_list: 1 })
    }
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

  async fetchTicks(symbol: string, count: number = 100): Promise<any> {
    return this.send({
      ticks_history: symbol,
      count,
      end: "latest",
      style: "tick",
    })
  }

  async buyContract(params: {
    contractType: string
    currency: string
    amount: number
    duration: number
    duration_unit: "m" | "h" | "d"
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
    }
    
    // In V2, 'symbol' parameter is renamed to 'underlying_symbol', 
    // but the `ticks` endpoint and `buy: parameters` might differ.
    // For safety, pass both if we are unsure, but the v2 explicitly demands underlying_symbol.
    if (this.currentAuthFlow === "new_v2") {
        parameters.underlying_symbol = params.symbol
    } else {
        parameters.symbol = params.symbol
    }

    if (params.barrier) parameters.barrier = params.barrier

    const payload: any = {
      buy: 1,
      price: params.amount,
      parameters
    }
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

  async subscribeToBalance(onBalance: (data: any) => void): Promise<number | null> {
    await this.waitForConnection()
    
    const msgId = ++this.messageId
    this.subscriptionHandlers.set(msgId, (data) => {
        if (data.balance) onBalance(data.balance)
    })
    
    this.ws?.send(JSON.stringify({
        balance: 1,
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

// Original disconnect removed to prevent duplicate signature with V2 refactored disconnect
}

export const derivAPI = new DerivAPI()
