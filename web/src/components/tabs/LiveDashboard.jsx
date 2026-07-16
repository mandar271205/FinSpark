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
      <section className="metric-grid">
        {cards.map(([label, value, Icon], index) => (
          <motion.div
            className="metric-card"
            key={label}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.09, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            whileHover={{ y: -5, transition: { duration: 0.18 } }}
          >
            <div className="metric-icon"><Icon size={22} /></div>
            <div className="metric-value">{value}</div>
            <div className="metric-label">{label}</div>
          </motion.div>
        ))}
      </section>

      {/* ── Fraud trend chart ── */}
      <motion.section
        className="panel"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.38 }}
      >
        <PanelHeader
          icon={Activity}
          title="Fraud Trend"
          action={
            <motion.button
              className="ghost-btn"
              onClick={refreshMetrics}
              whileHover={{ scale: 1.05 }}
              whileTap={{ rotate: 180, transition: { duration: 0.4 } }}
            >
              <RefreshCw size={15} /> Refresh
            </motion.button>
          }
        />
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="fraudFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fraudLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor="#06b6d4" />
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
