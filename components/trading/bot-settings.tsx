"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Coins, Zap, ArrowRightLeft, Cpu, SlidersHorizontal, Loader2 
} from "lucide-react"
import { derivAPI } from "@/lib/deriv-api"
import * as React from "react"

interface BotSettingsProps {
  toolName?: string
  settings: any
  setSettings: (settings: any) => void
  disabled?: boolean
}

export function BotSettings({ toolName, settings, setSettings, disabled }: BotSettingsProps) {
  const [activeMarkets, setActiveMarkets] = React.useState<any[]>([])
  const [isLoadingMarkets, setIsLoadingMarkets] = React.useState(true)

  React.useEffect(() => {
    async function loadMarkets() {
      try {
        const markets = await derivAPI.getSyntheticMarkets()
        const formatted = markets.map(m => ({
          value: m.symbol,
          label: m.display_name
        }))
        setActiveMarkets(formatted)
        
        // Ensure current setting is valid; if not, prefer Volatility 100 Index (R_100) or pick the first one
        if (formatted.length > 0 && (!settings.market || !formatted.find((f: any) => f.value === settings.market))) {
            const defaultMarket = formatted.find((f: any) => f.value === 'R_100') || formatted[0]
            setSettings((prev: any) => ({ ...prev, market: defaultMarket.value }))
        }
      } catch (e) {
        console.error("Failed to load markets:", e)
      } finally {
        setIsLoadingMarkets(false)
      }
    }
    loadMarkets()
  }, [])
  const update = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value })
  }

  const isOverUnder = toolName?.toLowerCase().includes('over') || toolName?.toLowerCase().includes('under') || settings.tradeMode === 'OVER_UNDER'

  return (
    <Card className="bg-black/40 border-white/5 backdrop-blur-xl flex flex-col min-h-fit">
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Cpu className="w-5 h-5 text-teal-400" />
          Strategy Parameters
        </CardTitle>
        <CardDescription>Algorithmic sensitivity & Risk limits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Market Venue */}
        <div className="space-y-1.5 pt-2">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Market Venue</Label>
            <Select disabled={disabled} value={settings.market} onValueChange={(v) => update('market', v)}>
                <SelectTrigger className="bg-white/5 border-white/10 h-9 font-bold">
                    <div className="flex items-center gap-2">
                        {isLoadingMarkets && <Loader2 className="w-3 h-3 animate-spin text-teal-500" />}
                        <SelectValue placeholder="Select Market" />
                    </div>
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10">
                {activeMarkets.map(m => (
                    <SelectItem key={m.value} value={m.value} className="text-white hover:bg-white/5">{m.label}</SelectItem>
                ))}
                </SelectContent>
            </Select>
        </div>

        {isOverUnder ? (
          // ─── OVER/UNDER Configuration ────────────────────────────────
          <>
            <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="space-y-3">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2 font-black">
                        <ArrowRightLeft className="w-3 h-3" />
                        Trading Side
                    </Label>
                    <Tabs 
                        value={settings.ouSide || 'OVER'} 
                        onValueChange={(v) => {
                            update('ouSide', v)
                            update('ouTarget', v === 'OVER' ? 1 : 8)
                        }}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 h-10 p-1">
                            <TabsTrigger 
                                value="OVER" 
                                disabled={disabled}
                                className="data-[state=active]:bg-teal-500 data-[state=active]:text-black font-black text-[9px] tracking-widest uppercase"
                            >
                                Over
                            </TabsTrigger>
                            <TabsTrigger 
                                value="UNDER" 
                                disabled={disabled}
                                className="data-[state=active]:bg-teal-500 data-[state=active]:text-black font-black text-[9px] tracking-widest uppercase"
                            >
                                Under
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Prediction Target</Label>
                    <Select 
                      disabled={disabled} 
                      value={String(settings.ouTarget || (settings.ouSide === 'UNDER' ? 8 : 1))} 
                      onValueChange={(v) => update('ouTarget', Number(v))}
                    >
                        <SelectTrigger className="bg-white/5 border-white/10 h-9 font-bold">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           {settings.ouSide === 'UNDER' ? (
                               // UNDER SIDE OPTIONS
                               <>
                                 <SelectItem value="8">Under 8</SelectItem>
                                 <SelectItem value="7">Under 7</SelectItem>
                               </>
                           ) : (
                               // OVER SIDE OPTIONS
                               <>
                                 <SelectItem value="1">Over 1</SelectItem>
                                 <SelectItem value="2">Over 2</SelectItem>
                                 <SelectItem value="3">Over 3</SelectItem>
                               </>
                           )}
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </>
        ) : (
          // ─── STANDARD Configuration ────────────────────────────────
          <>
            <div className="space-y-3 pt-4 border-t border-white/5">
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2 font-black">
                    <ArrowRightLeft className="w-3 h-3" />
                    Execution Mode
                </Label>
                <Tabs 
                    value={settings.tradeMode !== 'OVER_UNDER' ? settings.tradeMode : 'NO_TOUCH'} 
                    onValueChange={(v) => update('tradeMode', v)}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 h-10 p-1">
                        <TabsTrigger 
                            value="NO_TOUCH" 
                            disabled={disabled}
                            className="data-[state=active]:bg-teal-500 data-[state=active]:text-black font-black text-[9px] tracking-widest uppercase"
                        >
                            No Touch
                        </TabsTrigger>
                        <TabsTrigger 
                            value="TOUCH" 
                            disabled={disabled}
                            className="data-[state=active]:bg-teal-500 data-[state=active]:text-black font-black text-[9px] tracking-widest uppercase"
                        >
                            Touch
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/10 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">Statistical Engine</span>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">K-Multiplier</Label>
                        <span className="text-xs font-mono font-bold text-teal-400">{settings.kMultiplier}x</span>
                    </div>
                    <Slider
                        disabled={disabled}
                        value={[settings.kMultiplier]}
                        min={6}
                        max={20}
                        step={1}
                        onValueChange={([v]) => update('kMultiplier', v)}
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Vol-Threshold</Label>
                        <span className="text-xs font-mono font-bold text-teal-400">{settings.volatilityThreshold}</span>
                    </div>
                    <Slider
                        disabled={disabled}
                        value={[settings.volatilityThreshold]}
                        min={0.1}
                        max={2.0}
                        step={0.1}
                        onValueChange={([v]) => update('volatilityThreshold', v)}
                    />
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="grid grid-cols-2 gap-3 pb-2">
                <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground">Take Profit</Label>
                    <Input
                        disabled={disabled}
                        type="number"
                        value={settings.takeProfit}
                        onChange={(e) => update('takeProfit', Number(e.target.value))}
                        className="bg-white/5 border-white/10 h-8 font-mono text-center text-xs"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase font-bold text-muted-foreground">Stop Loss</Label>
                    <Input
                        disabled={disabled}
                        type="number"
                        value={settings.stopLoss}
                        onChange={(e) => update('stopLoss', Number(e.target.value))}
                        className="bg-white/5 border-white/10 h-8 font-mono text-center text-xs"
                    />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Universal Settings: Stake & Martingale */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter text-muted-foreground">
              <Coins className="w-4 h-4" />
              Stake (USD)
            </Label>
            <Input
              disabled={disabled}
              type="number"
              value={settings.stake}
              onChange={(e) => update('stake', Number(e.target.value))}
              className="bg-white/5 border-white/10 w-24 h-8 text-right font-black text-teal-400"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            Martingale System
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground">Multiplier</Label>
              <Input
                disabled={disabled}
                type="number"
                value={settings.martingaleMultiplier}
                onChange={(e) => update('martingaleMultiplier', Number(e.target.value))}
                step="0.1"
                className="bg-white/5 border-white/10 h-8 font-mono text-center text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-muted-foreground">Max Steps</Label>
              <Input
                disabled={disabled}
                type="number"
                value={settings.martingaleLevel}
                onChange={(e) => update('martingaleLevel', Number(e.target.value))}
                className="bg-white/5 border-white/10 h-8 font-mono text-center text-xs"
              />
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
