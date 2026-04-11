'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings2, Coins, Target, Octagon, Zap, Repeat, ArrowRightLeft, ShieldCheck } from "lucide-react"

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
    <Card className="bg-black/40 border-white/5 backdrop-blur-xl h-full flex flex-col">
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="w-5 h-5 text-teal-400" />
          Bot Configuration
        </CardTitle>
        <CardDescription>Setup your session risk and pacing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
        {/* Trade Mode Switcher */}
        <div className="space-y-3">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ArrowRightLeft className="w-3 h-3" />
                Execution System
            </Label>
            <Tabs 
                value={settings.tradeMode} 
                onValueChange={(v) => update('tradeMode', v)}
                className="w-full"
            >
                <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 h-10 p-1">
                    <TabsTrigger 
                        value="TOUCH" 
                        disabled={disabled}
                        className="data-[state=active]:bg-teal-500 data-[state=active]:text-black font-black text-[10px] tracking-widest uppercase transition-all"
                    >
                        Touch
                    </TabsTrigger>
                    <TabsTrigger 
                        value="NO_TOUCH" 
                        disabled={disabled}
                        className="data-[state=active]:bg-teal-500 data-[state=active]:text-black font-black text-[10px] tracking-widest uppercase transition-all"
                    >
                        No Touch
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-muted-foreground" />
              Stake (USD)
            </Label>
            <Input
              disabled={disabled}
              type="number"
              value={settings.stake}
              onChange={(e) => update('stake', Number(e.target.value))}
              className="bg-white/5 border-white/10 w-24 h-8 text-right font-bold text-teal-400"
            />
          </div>
          <Slider
            disabled={disabled}
            value={[settings.stake]}
            min={0.35}
            max={100}
            step={0.05}
            onValueChange={([v]) => update('stake', v)}
            className="py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground">
              <Target className="w-3 h-3 text-green-400" />
              Take Profit
            </Label>
            <Input
              disabled={disabled}
              type="number"
              value={settings.takeProfit}
              onChange={(e) => update('takeProfit', Number(e.target.value))}
              className="bg-white/5 border-white/10 font-mono text-center"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground">
              <Octagon className="w-3 h-3 text-red-400" />
              Stop Loss
            </Label>
            <Input
              disabled={disabled}
              type="number"
              value={settings.stopLoss}
              onChange={(e) => update('stopLoss', Number(e.target.value))}
              className="bg-white/5 border-white/10 font-mono text-center"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-2">
            Market Selection
          </Label>
          <Select disabled={disabled} value={settings.market} onValueChange={(v) => update('market', v)}>
            <SelectTrigger className="bg-white/5 border-white/10 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MARKETS.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Barrier Offset
            </Label>
            <Input
              disabled={disabled}
              type="number"
              step="0.1"
              value={settings.barrierOffset}
              onChange={(e) => update('barrierOffset', Number(e.target.value))}
              className="bg-white/5 border-white/10 w-20 h-8 text-center font-mono"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs flex items-center gap-2">
                <Repeat className="w-3 h-3 text-teal-400" />
                Auto Market Switch
              </Label>
              <p className="text-[10px] text-muted-foreground">Cycle markets after loss</p>
            </div>
            <Switch
              disabled={disabled}
              checked={settings.autoSwitch}
              onCheckedChange={(v) => update('autoSwitch', v)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <Label className="flex items-center gap-2 uppercase tracking-tighter">
                <Zap className="w-3 h-3 text-yellow-400" />
                Max Trades: {settings.maxTrades}
              </Label>
            </div>
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
