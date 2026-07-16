import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Gauge,
  HelpCircle,
  Lock,
  Shield,
  Zap,
} from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { LiveDashboard } from './components/tabs/LiveDashboard'
import { AttackSimulation } from './components/tabs/AttackSimulation'
import { QuantumVault } from './components/tabs/QuantumVault'
import { RealWorldValidation } from './components/tabs/RealWorldValidation'
import { TransactionTesting } from './components/tabs/TransactionTesting'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import './styles.css'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://finspark-production-72a1.up.railway.app'
).replace(/\/$/, '')

const tabs = [
  { id: 'dashboard', label: 'Live Dashboard', icon: Gauge },
  { id: 'simulation', label: 'Attack Simulation', icon: Activity },
  { id: 'vault', label: 'Quantum Vault', icon: Lock },
  { id: 'validation', label: 'Real-World Validation', icon: BadgeCheck },
  { id: 'api', label: 'Transaction Testing', icon: Zap },
]

const initialForm = {
  amount: 15000,
  velocity_24h: 2,
  hour_of_transaction: 14,
  time_since_last_txn: 120,
  is_beneficiary_new: 1,
  device_mismatch: 0,
}

const fallbackMetrics = {
  total_analyzed: 124592,
  alerts_triggered: 3142,
  model_auc: 0.981,
  detection_rate: 0.924,
  fraud_trend_data: Array.from({ length: 12 }, (_, i) => ({
    timestamp: `${String(i * 2).padStart(2, '0')}:00`,
    count: Math.round(2 + Math.sin(i / 1.8) * 3 + i / 2),
  })),
}

function WelcomeModal() {
  return null
}

function FloatingHelp() {
  return (
    <ShadcnTooltip>
      <TooltipTrigger asChild>
        <button className="fixed bottom-6 right-6 z-40 bg-slate-800 hover:bg-slate-700 text-cyan-400 p-4 rounded-full shadow-lg border border-slate-700 transition-all hover:scale-105 active:scale-95 group">
          <HelpCircle size={24} className="group-hover:rotate-12 transition-transform" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="bg-slate-900 border-slate-700 text-white font-medium">
        Need assistance? Check the contextual tooltips!
      </TooltipContent>
    </ShadcnTooltip>
  )
}

export function App() {
  const [activeTab, setActiveTab] = React.useState('dashboard')
  const [health, setHealth] = React.useState('checking')
  const [metrics, setMetrics] = React.useState(fallbackMetrics)
  const [busy, setBusy] = React.useState('')
  const [simulation, setSimulation] = React.useState(null)
  const [vault, setVault] = React.useState(null)
  const [validation, setValidation] = React.useState(null)
  const [validationFile, setValidationFile] = React.useState(null)
  const [preview, setPreview] = React.useState([])
  const [form, setForm] = React.useState(initialForm)
  const [prediction, setPrediction] = React.useState(null)
  const [explainTx, setExplainTx] = React.useState('')
  const [explanation, setExplanation] = React.useState(null)

  const refreshHealth = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`)
      if (!res.ok) throw new Error('Backend offline')
      setHealth('online')
    } catch {
      setHealth('offline')
    }
  }, [])

  const refreshMetrics = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/metrics`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || 'Metrics unavailable')
      setMetrics({ ...fallbackMetrics, ...data })
    } catch {
      setMetrics(fallbackMetrics)
    }
  }, [])

  React.useEffect(() => {
    refreshHealth()
    refreshMetrics()
    const id = window.setInterval(refreshMetrics, 5000)
    return () => window.clearInterval(id)
  }, [refreshHealth, refreshMetrics])

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function runSimulation() {
    setBusy('simulation')
    try {
      const res = await fetch(`${API_BASE_URL}/demo/simulate_attack`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || 'Simulation failed')
      setSimulation(data)
      setExplainTx(data.transactions?.[0]?.transaction_id || '')
      toast.success('Simulation completed successfully')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy('')
    }
  }

  async function testVault() {
    setBusy('vault')
    setVault(null)
    try {
      const res = await fetch(`${API_BASE_URL}/demo/secure_predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo_mode: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || 'Vault request failed')
      setVault(data)
      toast.success('Quantum vault access granted')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy('')
    }
  }

  async function runPrediction(formData = form) {
    setBusy('api')
    setPrediction(null)
    try {
      const payload = {
        transaction_id: `live-${Date.now()}`,
        features: {
          amount: Number(formData.amount),
          velocity_24h: Number(formData.velocity_24h),
          hour_of_transaction: Number(formData.hour_of_transaction),
          time_since_last_txn: Number(formData.time_since_last_txn),
          is_beneficiary_new: Number(formData.is_beneficiary_new),
          device_mismatch: Number(formData.device_mismatch),
        },
      }
      const res = await fetch(`${API_BASE_URL}/predict/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || 'Prediction failed')
      setPrediction(data)
      setExplainTx(data.transaction_id)
      refreshMetrics()
      toast.success('Live prediction generated')
      return data
    } catch (err) {
      toast.error(err.message)
      return null
    } finally {
      setBusy('')
    }
  }

  async function explainTransaction(txId = explainTx) {
    if (!txId) return
    setBusy('explain')
    try {
      const res = await fetch(`${API_BASE_URL}/demo/explain_transaction/${encodeURIComponent(txId)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || 'Explain request failed')
      setExplanation(data)
      toast.success('Explanation generated')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy('')
    }
  }

  async function handleFile(file) {
    setValidationFile(file)
    setValidation(null)
    setPreview([])
    if (!file || !file.name.toLowerCase().endsWith('.csv')) return
    const text = await file.text()
    const [header, ...rows] = text.trim().split(/\r?\n/)
    if (!header) return
    const cols = header.split(',').map((col) => col.trim())
    setPreview(rows.slice(0, 5).map((row) => {
      const values = row.split(',')
      return Object.fromEntries(cols.map((col, i) => [col, values[i] ?? '']))
    }))
  }

  async function validateUpload() {
    if (!validationFile) return
    setBusy('validation')
    try {
      const body = new FormData()
      body.append('file', validationFile)
      const res = await fetch(`${API_BASE_URL}/demo/validate_real_fraud`, {
        method: 'POST',
        body,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || 'Validation failed')
      setValidation(data)
      setExplainTx(data.results?.[0]?.transaction_id || '')
      refreshMetrics()
      toast.success('Validation completed successfully')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy('')
    }
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  return (
    <TooltipProvider>
      <Toaster theme="dark" position="top-right" richColors />
      <div className="app-shell relative">
        <WelcomeModal />
        <FloatingHelp />
        {/* ── Header ───────────────────────────── */}
        <motion.header
        className="soc-header"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="soc-title"><Shield size={30} /> FinSpark SOC Dashboard</div>
        <div className="soc-status">
          <span className={`status-dot ${health}`} />
          {health === 'online' ? 'System Online' : health === 'offline' ? 'System Offline' : 'Checking System'}
          <span className="status-time">| {now} UTC</span>
        </div>
      </motion.header>

      {/* ── Tab bar ──────────────────────────── */}
      <motion.nav
        className="tab-grid"
        aria-label="FinSpark dashboard sections"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`tab-button ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </motion.nav>

      {/* ── Tab content ──────────────────────── */}
      <ErrorBoundary>
        <AnimatePresence mode="wait">
          <motion.main
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            {activeTab === 'dashboard' && (
              <LiveDashboard metrics={metrics} refreshMetrics={refreshMetrics} />
            )}
            {activeTab === 'simulation' && (
              <AttackSimulation
                busy={busy === 'simulation'}
                simulation={simulation}
                runSimulation={runSimulation}
                explainTx={explainTx}
                setExplainTx={setExplainTx}
                explanation={explanation}
                explainTransaction={explainTransaction}
                explaining={busy === 'explain'}
              />
            )}
            {activeTab === 'vault' && (
              <QuantumVault vault={vault} busy={busy === 'vault'} testVault={testVault} />
            )}
            {activeTab === 'validation' && (
              <RealWorldValidation
                file={validationFile}
                preview={preview}
                validation={validation}
                busy={busy === 'validation'}
                handleFile={handleFile}
                validateUpload={validateUpload}
                explainTx={explainTx}
                setExplainTx={setExplainTx}
                explanation={explanation}
                explainTransaction={explainTransaction}
                explaining={busy === 'explain'}
              />
            )}
            {activeTab === 'api' && (
              <TransactionTesting
                form={form}
                busy={busy === 'api'}
                runPrediction={runPrediction}
              />
            )}
          </motion.main>
        </AnimatePresence>
      </ErrorBoundary>
      </div>
    </TooltipProvider>
  )
}
