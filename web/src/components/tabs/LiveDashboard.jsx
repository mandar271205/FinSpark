import React from 'react'
import { motion } from 'framer-motion'
import { Globe2, ShieldAlert, Brain, Zap, RefreshCw, Activity } from 'lucide-react'
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from 'recharts'
import { formatNumber } from '../../lib/formatters'
import { PanelHeader, ChartTooltip } from '../shared/UI'

const fallbackMetrics = {
  fraud_trend_data: [
    { time: '10:00', count: 0 },
    { time: '10:05', count: 1 },
    { time: '10:10', count: 0 },
    { time: '10:15', count: 3 },
    { time: '10:20', count: 1 },
    { time: '10:25', count: 5 },
    { time: '10:30', count: 2 },
    { time: '10:35', count: 0 },
  ]
}

export function LiveDashboard({ metrics = {}, refreshMetrics }) {
  const cards = [
    ['Total Analyzed', formatNumber(metrics.total_analyzed ?? 0), Globe2],
    ['Alerts Triggered', formatNumber(metrics.alerts_triggered ?? 0), ShieldAlert],
    ['Model AUC', metrics.model_auc ?? '0.981', Brain],
    ['Detection Rate', `${Math.round((metrics.detection_rate || 0) * 1000) / 10}%`, Zap],
  ]

  const apiTrend = (metrics.fraud_trend_data || []).map((point, index) => ({
    time: String(point.timestamp || point.time || index).slice(-5),
    fraud: Number(point.count || point.fraud || 0),
  }))
  
  const trend = apiTrend.length >= 8 ? apiTrend : fallbackMetrics.fraud_trend_data.map((point) => ({
    time: String(point.time).slice(-5),
    fraud: Number(point.count || 0),
  }))

  return (
    <>
      {/* ── Metric cards with stagger ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map(([label, value, Icon], index) => {
          // Add custom colors based on index to differentiate the cards beautifully
          const colors = [
            'from-cyan-400 to-blue-500', 
            'from-rose-400 to-orange-500', 
            'from-violet-400 to-fuchsia-500', 
            'from-emerald-400 to-teal-500'
          ];
          const bgColors = [
            'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20',
            'bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20',
            'bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20',
            'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20'
          ];
          return (
            <motion.div
              className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:border-slate-700 transition-all duration-300 group"
              key={label}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.09, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              whileHover={{ y: -5, transition: { duration: 0.18 } }}
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl mb-4 transition-transform duration-300 group-hover:scale-110 ${bgColors[index]}`}>
                <Icon size={24} />
              </div>
              <div className={`text-3xl font-bold tracking-tight mb-1 bg-clip-text text-transparent bg-gradient-to-br ${colors[index]}`}>
                {value}
              </div>
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {label}
              </div>
              
              {/* Subtle top glow effect */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${colors[index]} opacity-50`} />
            </motion.div>
          )
        })}
      </section>

      {/* ── Fraud trend chart ── */}
      <motion.section
        className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-lg mb-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.38 }}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
              <Activity size={20} />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Fraud Trend Analysis</h2>
          </div>
          <motion.button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg transition-colors"
            onClick={refreshMetrics}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
              <RefreshCw size={14} />
            </motion.div>
            Live Refresh
          </motion.button>
        </div>
        <div className="chart-box h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="fraudFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
                  <stop offset="50%" stopColor="#7c5cff" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#7c5cff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fraudLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#7c5cff" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#4a6580" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontFamily: 'Space Grotesk' }} />
              <YAxis stroke="#4a6580" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontFamily: 'Space Grotesk' }} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="fraud"
                name="Fraud alerts"
                stroke="url(#fraudLine)"
                fill="url(#fraudFill)"
                strokeWidth={2.5}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* ── Causal graph ── */}
      <motion.section
        className="panel causal-panel"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <PanelHeader icon={Brain} title="Causal Inference: Cyber Events → Fraud" />
        <div className="causal-graph-frame">
          <img src="/causal_graph.png" alt="Causal graph showing cyber events influencing fraud probability" />
        </div>
        <p>
          DoWhy causal DAG: network anomalies caused by cyber events such as port scans,
          DDoS, and malware can increase fraud probability. This keeps causal context
          visible beside live alert metrics for analyst triage.
        </p>
      </motion.section>
    </>
  )
}
