import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity } from 'lucide-react'
import { SmallMetric, Spinner } from '../shared/UI'
import { DataTable, ExplainPanel } from '../shared/DataTables'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.5, ease: 'easeOut' },
}

export function AttackSimulation({
  busy,
  simulation,
  runSimulation,
  explainTx,
  setExplainTx,
  explanation,
  explainTransaction,
  explaining,
}) {
  const rows = simulation?.transactions || []
  const flagged = rows.filter((row) => row.is_fraud_predicted).length
  const actual = rows.filter((row) => row.is_fraud_actual).length
  const avgQuantum = rows.length
    ? rows.reduce((sum, row) => sum + Number(row.quantum_risk_score || 0), 0) / rows.length
    : 0

  return (
    <div className="space-y-6">
      <motion.section className="section-heading flex items-center justify-between" {...fadeUp}>
        <h1 className="text-2xl font-bold text-white tracking-tight">Live Attack Simulation</h1>
        <motion.button
          className="primary-btn danger bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 hover:text-red-300 px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
          onClick={runSimulation}
          disabled={busy}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {busy ? <Spinner /> : <Activity size={18} />} {busy ? 'Running...' : 'Simulate Attack'}
        </motion.button>
      </motion.section>

      <AnimatePresence mode="wait">
        {busy ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-slate-800/50 rounded-xl border border-slate-700/30 animate-pulse flex flex-col justify-center px-4">
                  <div className="w-16 h-4 bg-slate-700 rounded mb-2" />
                  <div className="w-24 h-6 bg-slate-700/50 rounded" />
                </div>
              ))}
            </div>
            <div className="h-[400px] bg-slate-800/50 rounded-xl border border-slate-700/30 animate-pulse" />
          </motion.div>
        ) : simulation ? (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <section className="metric-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ['Total Transactions', rows.length || 100],
                ['Actual Fraud Injected', actual],
                ['Detected by Model', flagged],
                ['Avg Quantum Risk', avgQuantum.toFixed(2)],
              ].map(([label, value], i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}
                  className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 backdrop-blur-md"
                >
                  <SmallMetric label={label} value={value} />
                </motion.div>
              ))}
            </section>
            
            <DataTable
              title="Transaction Table"
              rows={rows.slice(0, 18)}
              columns={['transaction_id', 'simulated_pattern', 'risk_score', 'quantum_risk_score', 'data_exfil_volume_gb', 'is_fraud_actual', 'is_fraud_predicted']}
            />
            
            <ExplainPanel
              txIds={rows.map((row) => row.transaction_id)}
              explainTx={explainTx}
              setExplainTx={setExplainTx}
              explanation={explanation}
              explainTransaction={explainTransaction}
              explaining={explaining}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
