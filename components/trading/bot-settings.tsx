'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings2, Coins, Target, Octagon, Zap, Repeat } from "lucide-react"

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
    <Card className="bg-black/40 border-white/5 backdrop-blur-xl h-full">
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="w-5 h-5 text-teal-400" />
          Bot Configuration
        </CardTitle>
        <CardDescription>Setup your session risk and pacing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-muted-foreground" />
              Stake (USD)
            </Label>
            <span className="text-sm font-mono text-teal-400 font-bold">${settings.stake}</span>
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
            <Label className="flex items-center gap-2 text-xs">
              <Target className="w-3 h-3 text-green-400" />
              Take Profit
            </Label>
            <Input
              disabled={disabled}
              type="number"
              value={settings.takeProfit}
              onChange={(e) => update('takeProfit', Number(e.target.value))}
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs">
              <Octagon className="w-3 h-3 text-red-400" />
              Stop Loss
            </Label>
            <Input
              disabled={disabled}
              type="number"
              value={settings.stopLoss}
              onChange={(e) => update('stopLoss', Number(e.target.value))}
              className="bg-white/5 border-white/10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-xs">
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
              <Label className="flex items-center gap-2">
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
