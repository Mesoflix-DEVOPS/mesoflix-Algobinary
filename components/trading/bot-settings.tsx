'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Settings2, Coins, Target, Octagon, Zap,
  ArrowRightLeft, Cpu, SlidersHorizontal 
} from "lucide-react"

interface BotSettingsProps {
  settings: any
  setSettings: (settings: any) => void
  disabled?: boolean
}

const MARKETS = [
  { value: "R_10", label: "Volatility 10 Index" },
  { value: "R_25", label: "Volatility 25 Index" },
  { value: "R_50", label: "Volatility 50 Index" },
  { value: "R_75", label: "Volatility 75 Index" },
  { value: "R_100", label: "Volatility 100 Index" },
]

export function BotSettings({ settings, setSettings, disabled }: BotSettingsProps) {
  const update = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value })
  }

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
        {/* Mode Switcher */}
        <div className="space-y-3">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2 font-black">
                <ArrowRightLeft className="w-3 h-3" />
                Execution Mode
            </Label>
            <Tabs 
                value={settings.tradeMode} 
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

        {/* Strategic Tuning */}
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

        {/* Stake & Risk */}
        <div className="space-y-4">
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

        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Market Venue</Label>
            <Select disabled={disabled} value={settings.market} onValueChange={(v) => update('market', v)}>
                <SelectTrigger className="bg-white/5 border-white/10 h-9 font-bold">
                <SelectValue />
                </SelectTrigger>
                <SelectContent>
                {MARKETS.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
                </SelectContent>
            </Select>
            {/* Over/Under Barriers */}
            <div className="mt-4 space-y-3">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Over Barrier</Label>
              <Input
                disabled={disabled}
                type="number"
                value={settings.overBarrier}
                onChange={(e) => update('overBarrier', Number(e.target.value))}
                className="bg-white/5 border-white/10 h-8"
              />
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Under Barrier</Label>
              <Input
                disabled={disabled}
                type="number"
                value={settings.underBarrier}
                onChange={(e) => update('underBarrier', Number(e.target.value))}
                className="bg-white/5 border-white/10 h-8"
              />
            </div>
            {/* Recovery Strategy */}
            <div className="mt-4 space-y-3">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Recovery Strategy</Label>
              <Select disabled={disabled} value={settings.recoveryStrategy} onValueChange={(v) => update('recoveryStrategy', v)}>
                <SelectTrigger className="bg-white/5 border-white/10 h-9 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="martingale">Martingale</SelectItem>
                  <SelectItem value="fixed">Fixed Step</SelectItem>
                </SelectContent>
              </Select>
              {settings.recoveryStrategy === 'fixed' && (
                <>
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Recovery Step (USD)</Label>
                  <Input
                    disabled={disabled}
                    type="number"
                    value={settings.recoveryStep}
                    onChange={(e) => update('recoveryStep', Number(e.target.value))}
                    className="bg-white/5 border-white/10 h-8"
                  />
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground">
                <Zap className="w-3 h-3 text-yellow-500" />
                Session Trade Limit: {settings.maxTrades}
            </Label>
            <Slider
              disabled={disabled}
              value={[settings.maxTrades]}
              min={1}
              max={50}
              step={1}
              onValueChange={([v]) => update('maxTrades', v)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
