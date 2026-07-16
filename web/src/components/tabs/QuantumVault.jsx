import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, CheckCircle2 } from 'lucide-react'
import { SmallMetric, Spinner, PanelHeader } from '../shared/UI'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
}

export function QuantumVault({ vault, busy, testVault }) {
  return (
    <div className="space-y-6">
      <motion.section className="section-heading flex items-center justify-between" {...fadeUp}>
        <h1 className="text-2xl font-bold text-white tracking-tight">ML-KEM Post-Quantum Encryption Vault</h1>
      </motion.section>

      <motion.section
        className="vault-grid grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="vault-card danger bg-slate-900/50 border-2 border-red-500/20 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-red-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Without Quantum Vault
          </h3>
          <p className="text-slate-400 text-sm mb-4 relative z-10">Standard payloads can be stored now and decrypted later by quantum-capable attackers.</p>
          <code className="block bg-black/40 text-red-300 p-3 rounded font-mono text-xs border border-red-900/50 whitespace-pre-wrap relative z-10">
            {'> Payload: {"risk_score": 0.87, "is_fraud": true}\n> SNDL attack: readable'}
          </code>
          <strong className="block mt-4 text-red-500 text-sm relative z-10">Data compromised</strong>
        </div>
        
        <div className="vault-card safe bg-slate-900/50 border-2 border-emerald-500/20 p-6 rounded-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          <h3 className="text-emerald-400 font-semibold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            With ML-KEM Quantum Vault
          </h3>
          <p className="text-slate-400 text-sm mb-4 relative z-10">Predictions are wrapped in post-quantum encryption with an encrypted payload preview.</p>
          <code className="block bg-black/40 text-emerald-300 p-3 rounded font-mono text-xs border border-emerald-900/50 whitespace-pre-wrap relative z-10">
            {'> Payload: 0x9a7f3c9b2d...\n> SNDL attack: decryption failed'}
          </code>
          <strong className="block mt-4 text-emerald-500 text-sm relative z-10">Data secured</strong>
        </div>
      </motion.section>

      <section className="center-action flex justify-center py-6">
        <motion.button
          className="primary-btn bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
          onClick={testVault}
          disabled={busy}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          {busy ? <Spinner /> : <Lock size={18} />} {busy ? 'Establishing Tunnel...' : 'Encrypt Prediction with ML-KEM'}
        </motion.button>
      </section>

      <AnimatePresence mode="wait">
        {busy ? (
          <motion.section
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="panel bg-slate-800/40 p-6 rounded-xl border border-slate-700/30"
          >
            <div className="h-6 w-48 bg-slate-700/50 rounded mb-4 animate-pulse" />
            <div className="grid grid-cols-2 gap-4 my-4">
              <div className="h-20 bg-slate-700/30 rounded-lg animate-pulse" />
              <div className="h-20 bg-slate-700/30 rounded-lg animate-pulse" />
            </div>
            <div className="h-32 bg-slate-700/30 rounded-lg animate-pulse mt-4" />
          </motion.section>
        ) : vault ? (
          <motion.section
            key="content"
            className="panel bg-slate-800/40 p-6 rounded-xl border border-cyan-500/30 backdrop-blur-md relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
            <PanelHeader icon={CheckCircle2} title="Quantum-Safe Prediction Received" />
            <div className="metric-grid two grid grid-cols-2 gap-4 my-4">
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                <SmallMetric label="Original Risk Score" value={vault.decrypted_result?.risk_score ?? 'N/A'} />
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                <SmallMetric label="Latency" value={`${vault.latency_ms ?? 0} ms`} />
              </div>
            </div>
            <pre className="code-block bg-black/60 p-4 rounded-lg text-cyan-100 font-mono text-xs overflow-auto border border-slate-700/50 shadow-inner">
              {JSON.stringify(vault, null, 2)}
            </pre>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
