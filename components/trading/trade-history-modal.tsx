'use client'

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Target, 
  Clock,
  ExternalLink,
  History
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Trade } from "@/contexts/bot-context"

interface TradeHistoryModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  history: Trade[]
}

export function TradeHistoryModal({ isOpen, onOpenChange, history }: TradeHistoryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-zinc-950 border-white/10 text-white p-0 overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-500" />
        
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
               <History className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                Session Audit Log
                <Badge variant="outline" className="text-[10px] font-black uppercase text-gray-500 border-white/10 px-2 h-5">
                  Institutional Grade
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-0.5">
                Detailed execution metrics for current {history.length} trades
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="grid grid-cols-5 text-[10px] font-black uppercase tracking-widest text-gray-500 pb-2 border-b border-white/5">
            <div className="col-span-2">Execution Details / ID</div>
            <div className="text-center">Barrier / Mode</div>
            <div className="text-center">Entry/Exit Spot</div>
            <div className="text-right">Net Return</div>
          </div>

          <ScrollArea className="h-[60vh] pr-4 -mr-4">
            <div className="space-y-2 mt-4">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center space-y-4">
                   <Clock className="w-12 h-12" />
                   <p className="text-sm font-bold uppercase tracking-[0.3em]">No executions recorded</p>
                </div>
              ) : (
                history.map((trade) => (
                  <div 
                    key={trade.id} 
                    className="group bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl p-4 transition-all duration-300 grid grid-cols-5 items-center gap-4 relative overflow-hidden"
                  >
                    <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-1 transition-all",
                        trade.result === 'WIN' ? "bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)]" : "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                    )} />

                    {/* Trade Info */}
                    <div className="col-span-2 flex flex-col gap-1">
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{trade.symbol}</span>
                          <span className="text-[9px] text-gray-600 font-mono italic">#{trade.id}</span>
                       </div>
                       <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                          <Calendar className="w-3 h-3" />
                          {new Date(trade.timestamp).toLocaleTimeString()}
                       </div>
                    </div>

                    {/* Barrier / Mode */}
                    <div className="flex flex-col items-center gap-1">
                       <Badge variant="outline" className="text-[9px] font-black border-white/10 uppercase bg-black/40">
                          {trade.type}
                       </Badge>
                       <span className="text-[11px] font-black text-white font-mono">{trade.barrier}</span>
                    </div>

                    {/* Prices */}
                    <div className="flex flex-col items-center gap-0.5">
                       <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400">
                          <span className="opacity-50 text-[8px]">IN</span>
                          {trade.entryPrice.toFixed(2)}
                       </div>
                       <div className="flex items-center gap-1 text-[11px] font-bold text-white">
                          <span className="opacity-50 text-[8px]">OUT</span>
                          {trade.exitPrice.toFixed(2)}
                       </div>
                    </div>

                    {/* Result */}
                    <div className="flex flex-col items-end">
                       <div className={cn(
                          "flex items-center gap-1 text-base font-black font-mono",
                          trade.result === 'WIN' ? "text-teal-400" : "text-red-400"
                       )}>
                          {trade.result === 'WIN' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          {trade.result === 'WIN' ? '+' : ''}${trade.profit.toFixed(2)}
                       </div>
                       <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                          Stake: ${trade.stake}
                       </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="bg-white/5 p-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              Broker ID: Deriv Institutional • 2026-04-12
            </p>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-teal-500 hover:text-teal-400 cursor-pointer transition-colors">
               Export Session (PDF)
               <ExternalLink className="w-3 h-3" />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
