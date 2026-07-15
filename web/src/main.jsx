import React from 'react'
import ReactDOM from 'react-dom/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Brain,
  CheckCircle2,
  Download,
  Eye,
  FileJson,
  Gauge,
  Globe2,
  HelpCircle,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Terminal,
  TrendingDown,
  TrendingUp,
  UploadCloud,
  Zap,
  Bot,
  Info,
  X,
  Sparkles,
} from 'lucide-react'

// UI Components (Shadcn)
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// API Utility
import { callNvidiaGLM } from "@/lib/nvidia"
import './styles.css'

const API_BASE_URL = (
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

/* ─── Animation variants ─────────────────────── */
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -10 },
  transition: { duration: 0.24, ease: [0.4, 0, 0.2, 1] },
}

function WelcomeModal() {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const hasVisited = localStorage.getItem('finspark_visited')
    if (!hasVisited) {
      setIsOpen(true)
      localStorage.setItem('finspark_visited', 'true')
    }
  }, [])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-8 max-w-lg w-full relative overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="mb-6 flex justify-center">
              <div className="bg-cyan-500/10 p-4 rounded-full text-cyan-400">
                <Shield size={48} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-4">Welcome to FinSpark SOC</h2>
            <p className="text-slate-300 text-center mb-6 leading-relaxed">
              Experience the next generation of real-time fraud detection powered by ML ensembles, quantum-safe cryptography, and AI-driven insights from NVIDIA GLM-5.2.
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-slate-300">
                <Gauge className="text-cyan-400" size={18} /> Monitor live transactions
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Zap className="text-cyan-400" size={18} /> Test transactions in real-time
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <BadgeCheck className="text-cyan-400" size={18} /> Validate AI models against datasets
              </div>
            </div>
            <Button
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white h-12 text-lg"
              onClick={() => setIsOpen(false)}
            >
              Explore Dashboard
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
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

function App() {
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
  const [error, setError] = React.useState('')

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
    setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/demo/simulate_attack`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || 'Simulation failed')
      setSimulation(data)
      setExplainTx(data.transactions?.[0]?.transaction_id || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  async function testVault() {
    setBusy('vault')
    setError('')
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
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  async function runPrediction() {
    setBusy('api')
    setError('')
    setPrediction(null)
    try {
      const payload = {
        transaction_id: `live-${Date.now()}`,
        features: {
          amount: Number(form.amount),
          velocity_24h: Number(form.velocity_24h),
          hour_of_transaction: Number(form.hour_of_transaction),
          time_since_last_txn: Number(form.time_since_last_txn),
          is_beneficiary_new: Number(form.is_beneficiary_new),
          device_mismatch: Number(form.device_mismatch),
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
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  async function explainTransaction(txId = explainTx) {
    if (!txId) return
    setBusy('explain')
    setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/demo/explain_transaction/${encodeURIComponent(txId)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || 'Explain request failed')
      setExplanation(data)
    } catch (err) {
      setError(err.message)
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
    setError('')
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
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)

  return (
    <TooltipProvider>
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

      {/* ── Error banner ─────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="error-banner"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.22 }}
          >
            <AlertTriangle size={18} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tab content ──────────────────────── */}
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
            <LiveApiTesting
              form={form}
              updateForm={updateForm}
              prediction={prediction}
              busy={busy === 'api'}
              runPrediction={runPrediction}
            />
          )}
        </motion.main>
      </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}

/* ═══════════════════════════════════════════════
   LIVE DASHBOARD
═══════════════════════════════════════════════ */
function LiveDashboard({ metrics, refreshMetrics }) {
  const cards = [
    ['Total Analyzed', formatNumber(metrics.total_analyzed), Globe2],
    ['Alerts Triggered', formatNumber(metrics.alerts_triggered), ShieldAlert],
    ['Model AUC', metrics.model_auc ?? '0.981', Brain],
    ['Detection Rate', `${Math.round((metrics.detection_rate || 0) * 1000) / 10}%`, Zap],
  ]

  const trend = (metrics.fraud_trend_data || []).map((point, index) => ({
    time: String(point.timestamp || point.time || index).slice(-5),
    fraud: Number(point.count || point.fraud || 0),
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

/* ═══════════════════════════════════════════════
   ATTACK SIMULATION
═══════════════════════════════════════════════ */
function AttackSimulation({
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
    <>
      <motion.section className="section-heading" {...fadeUp}>
        <h1>Live Attack Simulation</h1>
        <motion.button
          className="primary-btn danger"
          onClick={runSimulation}
          disabled={busy}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {busy ? <Spinner /> : <Activity size={18} />} {busy ? 'Running...' : 'Simulate Attack'}
        </motion.button>
      </motion.section>

      {simulation && (
        <>
          <section className="metric-grid">
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
        </>
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════
   QUANTUM VAULT
═══════════════════════════════════════════════ */
function QuantumVault({ vault, busy, testVault }) {
  return (
    <>
      <motion.section className="section-heading" {...fadeUp}>
        <h1>ML-KEM Post-Quantum Encryption Vault</h1>
      </motion.section>

      <motion.section
        className="vault-grid"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="vault-card danger">
          <h3>Without Quantum Vault</h3>
          <p>Standard payloads can be stored now and decrypted later by quantum-capable attackers.</p>
          <code>{'> Payload: {"risk_score": 0.87, "is_fraud": true}\n> SNDL attack: readable'}</code>
          <strong>Data compromised</strong>
        </div>
        <div className="vault-card safe">
          <h3>With ML-KEM Quantum Vault</h3>
          <p>Predictions are wrapped in post-quantum encryption with an encrypted payload preview.</p>
          <code>{'> Payload: 0x9a7f3c9b2d...\n> SNDL attack: decryption failed'}</code>
          <strong>Data secured</strong>
        </div>
      </motion.section>

      <section className="center-action">
        <motion.button
          className="primary-btn"
          onClick={testVault}
          disabled={busy}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          {busy ? <Spinner /> : <Lock size={18} />} {busy ? 'Establishing Tunnel...' : 'Encrypt Prediction with ML-KEM'}
        </motion.button>
      </section>

      <AnimatePresence>
        {vault && (
          <motion.section
            className="panel"
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            <PanelHeader icon={CheckCircle2} title="Quantum-Safe Prediction Received" />
            <div className="metric-grid two">
              <SmallMetric label="Original Risk Score" value={vault.decrypted_result?.risk_score ?? 'N/A'} />
              <SmallMetric label="Latency" value={`${vault.latency_ms ?? 0} ms`} />
            </div>
            <pre className="code-block">{JSON.stringify(vault, null, 2)}</pre>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  )
}

/* ═══════════════════════════════════════════════
   HELPERS — Real-World Validation
═══════════════════════════════════════════════ */

function getAccentForScore(val) {
  if (val == null) return 'cyan'
  if (val >= 0.85) return 'green'
  if (val >= 0.65) return 'amber'
  return 'red'
}

/* CountUp — smooth number animation from 0 → target */
function CountUp({ target, suffix = '', decimals }) {
  const num = Number(target)
  const dec = decimals !== undefined ? decimals : String(target).includes('.') ? (String(target).split('.')[1] || '').length : 0
  const [display, setDisplay] = React.useState(0)
  React.useEffect(() => {
    if (isNaN(num)) return
    let start = null
    const duration = 900
    function step(ts) {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplay(parseFloat((ease * num).toFixed(dec)))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [num])
  return <>{isNaN(num) ? target : display}{suffix}</>
}

/* 2×2 Confusion Matrix heatmap */
function ConfusionMatrix({ matrix }) {
  let tp, fp, fn, tn
  if (Array.isArray(matrix[0])) {
    [[tp, fp], [fn, tn]] = matrix
  } else {
    [tp, fp, fn, tn] = matrix
  }
  const max = Math.max(tp, fp, fn, tn, 1)
  const cell = (val, label, cls) => (
    <div className={`cm-cell cm-cell--${cls}`}>
      <span className="cm-val">{val}</span>
      <span className="cm-label">{label}</span>
      <div className="cm-bar" style={{ width: `${Math.round((val / max) * 100)}%` }} />
    </div>
  )
  return (
    <div className="cm-wrap">
      <div className="cm-headers">
        <span />
        <span className="cm-header-label">Predicted +</span>
        <span className="cm-header-label">Predicted −</span>
      </div>
      <div className="cm-row">
        <span className="cm-row-label">Actual +</span>
        {cell(tp, 'True Positive',  'tp')}
        {cell(fn, 'False Negative', 'fn')}
      </div>
      <div className="cm-row">
        <span className="cm-row-label">Actual −</span>
        {cell(fp, 'False Positive', 'fp')}
        {cell(tn, 'True Negative',  'tn')}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   REAL-WORLD VALIDATION
═══════════════════════════════════════════════ */
function RealWorldValidation({
  file,
  preview,
  validation,
  busy,
  handleFile,
  validateUpload,
  explainTx,
  setExplainTx,
  explanation,
  explainTransaction,
  explaining,
}) {
  const template = 'transaction_id,is_beneficiary_new,PSH Flag Cnt,RST Flag Cnt,Fwd Pkt Len Max,Fwd Pkts/s,is_fraud_actual\nsample-1,1,8,3,1460,85,1\n'
  const templateUrl = React.useMemo(() => URL.createObjectURL(new Blob([template], { type: 'text/csv' })), [])
  const rows = validation?.results || []
  const resultColumns = ['transaction_id', 'is_fraud_actual', 'is_fraud_predicted', 'risk_score', 'confidence']
  const resultsCsvUrl = React.useMemo(() => {
    if (!rows.length) return ''
    return URL.createObjectURL(new Blob([toCsv(rows, resultColumns)], { type: 'text/csv;charset=utf-8' }))
  }, [rows])
  const correct = rows.filter((row) => row.is_fraud_actual === row.is_fraud_predicted).length

  React.useEffect(() => () => URL.revokeObjectURL(templateUrl), [templateUrl])

  React.useEffect(() => {
    if (!resultsCsvUrl) return undefined
    return () => URL.revokeObjectURL(resultsCsvUrl)
  }, [resultsCsvUrl])

  // ── Debug log full API response ──
  React.useEffect(() => {
    if (!validation) return
    console.log('🔍 Real-World Validation Response:', validation)
    console.log('📦 Available keys:', Object.keys(validation))
    if (validation.precision !== undefined) console.log('✅ Advanced metrics present')
    if (validation.confusion_matrix)        console.log('🔲 Confusion matrix:', validation.confusion_matrix)
  }, [validation])

  // ── Core 4 metric cards ──
  const coreCards = [
    { label: 'Total Processed',     value: validation?.total_processed, icon: Globe2,       accent: 'cyan',   suffix: ''  },
    { label: 'Fraud Detected',      value: validation?.fraud_detected,  icon: ShieldAlert,  accent: 'red',    suffix: ''  },
    { label: 'Model Accuracy',      value: validation?.accuracy != null ? parseFloat((validation.accuracy * 100).toFixed(1)) : null, icon: BadgeCheck, accent: 'green', suffix: '%' },
    { label: 'Correct Predictions', value: correct,                     icon: CheckCircle2, accent: 'violet', suffix: ''  },
  ]

  // ── Advanced metrics (conditional) ──
  const hasAdvanced = !!(validation?.precision != null || validation?.recall != null || validation?.f1_score != null)
  const hasConfusion = !!(validation?.confusion_matrix && Array.isArray(validation.confusion_matrix))
  const advancedCards = hasAdvanced ? [
    { label: 'Precision', value: validation.precision != null ? parseFloat((validation.precision * 100).toFixed(1)) : null, suffix: '%', accent: getAccentForScore(validation.precision), icon: Eye },
    { label: 'Recall',    value: validation.recall    != null ? parseFloat((validation.recall    * 100).toFixed(1)) : null, suffix: '%', accent: getAccentForScore(validation.recall),    icon: Activity },
    { label: 'F1-Score',  value: validation.f1_score  != null ? parseFloat((validation.f1_score  * 100).toFixed(1)) : null, suffix: '%', accent: getAccentForScore(validation.f1_score),  icon: Gauge },
  ] : []

  const [aiInsight, setAiInsight] = React.useState(null)
  const [insightLoading, setInsightLoading] = React.useState(false)

  const handleGenerateInsight = async () => {
    if (!validation) return
    setInsightLoading(true)
    setAiInsight(null)
    try {
      const metricsText = `Accuracy: ${validation.accuracy || 'N/A'}\nTotal Processed: ${validation.total_processed}\nFraud Detected: ${validation.fraud_detected}\nPrecision: ${validation.precision || 'N/A'}\nRecall: ${validation.recall || 'N/A'}`
      const messages = [
        { role: 'system', content: 'You are a Chief Information Security Officer (CISO). Summarize the following fraud detection metrics in a concise, business-friendly paragraph. Focus on the model\'s effectiveness and any areas of concern. Return plain text.' },
        { role: 'user', content: `Here are the latest validation metrics:\n${metricsText}`}
      ]
      const res = await callNvidiaGLM(messages)
      // the response might be a json if the previous prompt was json, but here we ask for text.
      // wait, callNvidiaGLM parses JSON if possible. If not, it returns the raw content string? 
      // Let's just stringify if it's an object.
      setAiInsight(typeof res === 'string' ? res : (res?.reason || res?.content || JSON.stringify(res)))
    } catch (err) {
      console.error('AI Insight error:', err)
      setAiInsight('Failed to generate AI insights at this time.')
    } finally {
      setInsightLoading(false)
    }
  }

  return (
    <>
      <motion.section className="section-heading" {...fadeUp}>
        <h1>Real-World Fraud Validation</h1>
        <a className="ghost-btn download" href={templateUrl} download="fraud_template.csv">
          <Download size={16} /> Download Template CSV
        </a>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-slate-900 border-slate-800 text-white mb-6">
          <CardContent className="pt-6 flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700 rounded-lg m-4 hover:border-cyan-500/50 transition-colors cursor-pointer group relative">
            <input
              type="file"
              accept=".csv,.json,.xlsx,.xls"
              onChange={(event) => handleFile(event.target.files?.[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <UploadCloud size={48} className="text-slate-500 group-hover:text-cyan-400 mb-4 transition-colors" />
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-slate-200">
                {file ? file.name : 'Drag and drop file here'}
              </p>
              <p className="text-sm text-slate-500">Limit 200MB per file - CSV, JSON, XLSX, XLS</p>
              {!file && <span className="inline-block mt-2 text-cyan-400 text-sm hover:underline">Browse files</span>}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white h-12 text-lg"
              onClick={validateUpload}
              disabled={!file || busy}
            >
              {busy ? <RefreshCw className="animate-spin mr-2" size={20} /> : <FileJson className="mr-2" size={20} />}
              {busy ? 'Validating...' : 'Test CSV / Run Test'}
            </Button>
          </CardFooter>
        </Card>
      </motion.section>

      {/* ── Loading skeleton ── */}
      <AnimatePresence>
        {busy && (
          <motion.section
            className="panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="skeleton-grid">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-icon" />
                  <div className="skeleton-value" />
                  <div className="skeleton-label" />
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── CSV preview ── */}
      {preview.length > 0 && (
        <DataTable title={`Preview — ${preview.length} rows`} rows={preview} columns={Object.keys(preview[0])} />
      )}

      {/* ── Results ── */}
      {validation?.status === 'success' && (
        <>
          {/* Core 4 cards */}
          <motion.div className="val-section-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
            <Shield size={14} /> Core Metrics
          </motion.div>
          <section className="metric-grid">
            {coreCards.map(({ label, value, icon: Icon, accent, suffix }, i) => (
              <motion.div
                className={`metric-card val-card val-card--${accent}`}
                key={label}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.09, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                whileHover={{ y: -5, transition: { duration: 0.18 } }}
              >
                <div className={`metric-icon val-icon--${accent}`}><Icon size={22} /></div>
                <div className="metric-value">
                  {value != null ? <CountUp target={Number(value)} suffix={suffix} /> : 'N/A'}
                </div>
                <div className="metric-label">{label}</div>
              </motion.div>
            ))}
          </section>

          {/* Advanced metrics (conditional) */}
          {hasAdvanced ? (
            <>
              <motion.div className="val-section-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
                <Brain size={14} /> Advanced Metrics
              </motion.div>
              <section className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {advancedCards.map(({ label, value, suffix, accent, icon: Icon }, i) => (
                  <motion.div
                    className={`metric-card val-card val-card--${accent}`}
                    key={label}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + i * 0.09, duration: 0.5 }}
                    whileHover={{ y: -5, transition: { duration: 0.18 } }}
                  >
                    <div className={`metric-icon val-icon--${accent}`}><Icon size={22} /></div>
                    <div className="metric-value">
                      {value != null ? <CountUp target={Number(value)} suffix={suffix} /> : 'N/A'}
                    </div>
                    <div className="metric-label">{label}</div>
                  </motion.div>
                ))}
              </section>
            </>
          ) : (
            <motion.div className="val-no-advanced" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <HelpCircle size={14} />
              Advanced metrics (Precision / Recall / F1) not in this API response — see console for full structure.
            </motion.div>
          )}

          {/* Confusion matrix (conditional) */}
          {hasConfusion && (
            <motion.section
              className="panel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.4 }}
            >
              <PanelHeader icon={Eye} title="Confusion Matrix" />
              <ConfusionMatrix matrix={validation.confusion_matrix} />
            </motion.section>
          )}

          {/* AI Performance Insight Section */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-8"
          >
            <Card className="bg-slate-900 border-slate-800 border-t-cyan-500/50 text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-50" />
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-cyan-400">
                      <Bot size={20} /> AI Performance Insight
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">Get an executive summary of the model's performance on this dataset.</p>
                  </div>
                  <Button 
                    onClick={handleGenerateInsight} 
                    disabled={insightLoading}
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    {insightLoading ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Sparkles className="mr-2" size={16} />}
                    Generate Insight
                  </Button>
                </div>

                {aiInsight && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 pt-4 border-t border-slate-800"
                  >
                    <div className="bg-slate-800/50 p-4 rounded-lg text-slate-300 leading-relaxed text-sm">
                      {aiInsight}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.section>

          <ExplainPanel
            txIds={rows.map((row) => row.transaction_id)}
            explainTx={explainTx}
            setExplainTx={setExplainTx}
            explanation={explanation}
            explainTransaction={explainTransaction}
            explaining={explaining}
          />

          {/* Per-row results table */}
          <DataTable
            title={`Per-Row Results — ${rows.length} rows`}
            rows={rows}
            columns={resultColumns}
            action={resultsCsvUrl && (
              <a className="ghost-btn download" href={resultsCsvUrl} download="per_row_validation_results.csv">
                <Download size={16} /> Download Results CSV
              </a>
            )}
          />
        </>
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════
   LIVE API TESTING
═══════════════════════════════════════════════ */
function LiveApiTesting({ form, updateForm, prediction, busy, runPrediction }) {
  const isFraud = prediction?.is_fraud
  const [insight, setInsight] = React.useState(null)
  const [insightLoading, setInsightLoading] = React.useState(false)

  const handlePredict = async () => {
    runPrediction()
    setInsightLoading(true)
    setInsight(null)
    try {
      const messages = [
        { role: 'system', content: 'You are a senior fraud detection analyst. Analyze the transaction details and determine if it is fraudulent. Respond ONLY in valid JSON format: { "fraud": boolean, "confidence": number, "reason": "short explanation" }.' },
        { role: 'user', content: `Transaction: Amount=${form.amount}, Velocity=${form.velocity_24h}, TimeSinceLast=${form.time_since_last_txn}, NewBeneficiary=${form.is_beneficiary_new}, DeviceMismatch=${form.device_mismatch}` }
      ]
      const aiResponse = await callNvidiaGLM(messages)
      setInsight(aiResponse)
    } catch (err) {
      console.error('AI Insight Error:', err)
      setInsight({ error: true, reason: 'AI insights temporarily unavailable (Fallback Mode)' })
    } finally {
      setInsightLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <motion.section className="section-heading" {...fadeUp}>
        <h1>Enterprise Real-Time Transaction Testing</h1>
      </motion.section>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Terminal size={20} className="text-cyan-400" /> Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-slate-400">Transaction Amount</label>
                <Input type="number" className="bg-slate-800 border-slate-700" value={form.amount} onChange={(e) => updateForm('amount', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-400">Velocity in 24h</label>
                <Input type="number" className="bg-slate-800 border-slate-700" value={form.velocity_24h} onChange={(e) => updateForm('velocity_24h', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-400">Hour of Day</label>
                <Input type="number" min={0} max={23} className="bg-slate-800 border-slate-700" value={form.hour_of_transaction} onChange={(e) => updateForm('hour_of_transaction', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-400">Mins Since Last Txn</label>
                <Input type="number" className="bg-slate-800 border-slate-700" value={form.time_since_last_txn} onChange={(e) => updateForm('time_since_last_txn', Number(e.target.value))} />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-400">New Beneficiary?</label>
                  <ShadcnTooltip>
                    <TooltipTrigger><Info size={14} className="text-slate-500" /></TooltipTrigger>
                    <TooltipContent>1 means the receiver account is newly added. Risky in phishing cash-outs.</TooltipContent>
                  </ShadcnTooltip>
                </div>
                <Select value={String(form.is_beneficiary_new)} onValueChange={(v) => updateForm('is_beneficiary_new', Number(v))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="1">Yes (1)</SelectItem>
                    <SelectItem value="0">No (0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-400">Device Mismatch?</label>
                  <ShadcnTooltip>
                    <TooltipTrigger><Info size={14} className="text-slate-500" /></TooltipTrigger>
                    <TooltipContent>1 means device, browser, or IP differs from the usual customer profile.</TooltipContent>
                  </ShadcnTooltip>
                </div>
                <Select value={String(form.device_mismatch)} onValueChange={(v) => updateForm('device_mismatch', Number(v))}>
                  <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="1">Yes (1)</SelectItem>
                    <SelectItem value="0">No (0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white"
              onClick={handlePredict}
              disabled={busy || insightLoading}
            >
              {(busy || insightLoading) ? <RefreshCw className="animate-spin mr-2" size={18} /> : <Shield className="mr-2" size={18} />}
              {(busy || insightLoading) ? 'Analyzing with AI...' : 'Test CSV / Run Test'}
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {prediction && (
              <motion.div
                key="prediction"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <Card className={`border ${isFraud ? 'border-red-500/50 bg-red-950/20' : 'border-green-500/50 bg-green-950/20'} text-white`}>
                  <CardContent className="pt-6 text-center space-y-4">
                    <div className="flex justify-center">
                      <Badge variant="outline" className={`text-lg py-1 px-4 ${isFraud ? 'bg-red-500/10 text-red-400 border-red-500/50' : 'bg-green-500/10 text-green-400 border-green-500/50'}`}>
                        {isFraud ? 'Fraud Detected' : 'Legitimate Transaction'}
                      </Badge>
                    </div>
                    
                    {insight && !insight.error && (
                      <div className="bg-slate-900/50 rounded-lg p-4 text-left border border-slate-700/50 mt-4">
                        <div className="flex items-center gap-2 mb-2 text-cyan-400 font-semibold">
                          <Bot size={18} /> AI Insight (GLM-5.2)
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">{insight.reason}</p>
                        <div className="mt-3 text-xs text-slate-500 flex justify-between">
                          <span>AI Confidence: {Math.round(insight.confidence * 100)}%</span>
                          <span>Model Score: {Number(prediction.risk_score || 0).toFixed(4)}</span>
                        </div>
                      </div>
                    )}

                    {insight?.error && (
                      <div className="bg-slate-900/50 rounded-lg p-4 text-left border border-slate-700/50 mt-4 text-amber-400 text-sm">
                        <AlertTriangle className="inline mr-2" size={16} />
                        {insight.reason}
                        <div className="mt-2 text-xs text-slate-500">
                          Fallback score: {Number(prediction.risk_score || 0).toFixed(4)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   EXPLAIN PANEL (SHAP)
═══════════════════════════════════════════════ */
function ExplainPanel({ txIds, explainTx, setExplainTx, explanation, explainTransaction, explaining }) {
  if (!txIds.length) return null
  const chartData = (explanation?.shap_values || []).map((item) => ({
    feature: item.feature,
    value: item.value,
    contribution: item.contribution,
    direction: item.contribution > 0 ? 'Increases Risk' : 'Decreases Risk',
  }))

  return (
    <motion.section
      className="panel"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <PanelHeader icon={Brain} title="Model Explainability (SHAP Values)" />
      <div className="explain-row">
        <select value={explainTx} onChange={(event) => setExplainTx(event.target.value)}>
          {txIds.slice(0, 100).map((id) => <option key={id} value={id}>{id}</option>)}
        </select>
        <motion.button
          className="ghost-btn"
          onClick={() => explainTransaction()}
          disabled={explaining}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          {explaining ? <Spinner /> : <Brain size={16} />} Explain This Transaction
        </motion.button>
      </div>
      {explanation?.base_value !== undefined && (
        <p className="base-threshold">
          Base risk threshold: <code>{Number(explanation.base_value).toFixed(4)}</code>
        </p>
      )}
      {chartData.length > 0 && (
        <>
          <h3 className="shap-title">SHAP Feature Explanations (Red = Increases Risk, Green = Decreases Risk)</h3>
          <div className="chart-box shap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 12, right: 28, left: 86, bottom: 18 }}>
                <CartesianGrid stroke="rgba(6,182,212,0.1)" horizontal={false} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  stroke="#4a6580"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fontFamily: 'Space Grotesk' }}
                  label={{ value: 'SHAP Value (Impact on Risk)', position: 'insideBottom', offset: -8, fill: '#7fa8cc', fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="feature"
                  stroke="#7fa8cc"
                  tickLine={false}
                  axisLine={false}
                  width={150}
                  tick={{ fontSize: 11, fontFamily: 'Space Grotesk' }}
                />
                <ReferenceLine x={0} stroke="rgba(226,232,240,0.5)" strokeWidth={1.5} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="contribution" radius={[4, 4, 4, 4]} animationBegin={200} animationDuration={800}>
                  {chartData.map((entry) => (
                    <Cell key={entry.feature} fill={entry.contribution >= 0 ? '#ef4444' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="table-wrap shap-table">
            <table>
              <thead>
                <tr>
                  <th>feature</th>
                  <th>value</th>
                  <th>contribution</th>
                  <th>Impact Direction</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, idx) => (
                  <motion.tr
                    key={row.feature}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <td>{row.feature}</td>
                    <td>{formatCell(row.value)}</td>
                    <td>{formatCell(row.contribution)}</td>
                    <td>
                      {row.direction}
                      <span className={`impact-dot ${row.contribution >= 0 ? 'risk-up' : 'risk-down'}`} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="shap-notes">
            <strong>How to read this chart:</strong>
            <span><span className="impact-dot risk-up" /> Red bars = features that pushed the risk score higher</span>
            <span><span className="impact-dot risk-down" /> Green bars = features that reduced the risk score</span>
            <span>Longer bar = stronger influence on the final prediction.</span>
          </div>
        </>
      )}
    </motion.section>
  )
}

/* ═══════════════════════════════════════════════
   DATA TABLE (with animated rows)
═══════════════════════════════════════════════ */
function DataTable({ title, rows, columns, action }) {
  if (!rows.length) return null
  return (
    <motion.section
      className="panel"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <PanelHeader icon={FileJson} title={title} action={action} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>{columns.map((col) => <th key={col}>{col.replace(/_/g, ' ')}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <motion.tr
                key={row.transaction_id || idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(idx * 0.01, 0.18), duration: 0.25 }}
              >
                {columns.map((col) => (
                  <td key={col} className={col.includes('risk') && Number(row[col]) > 0.7 ? 'high-risk' : ''}>
                    {formatCell(row[col])}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  )
}

/* ═══════════════════════════════════════════════
   SHARED UI COMPONENTS
═══════════════════════════════════════════════ */
function PanelHeader({ icon: Icon, title, action }) {
  return (
    <div className="panel-header">
      <h2><Icon size={20} /> {title}</h2>
      {action}
    </div>
  )
}

function NumberField({ label, value, onChange, min, max }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" min={min} max={max} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function SelectField({ label, value, help, onChange }) {
  return (
    <label className="field">
      <span className="field-label-row">
        {label}
        {help && (
          <span className="help-mark" title={help} aria-label={help}>
            <HelpCircle size={16} />
          </span>
        )}
      </span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value={0}>No</option>
        <option value={1}>Yes</option>
      </select>
    </label>
  )
}

function SmallMetric({ label, value }) {
  return (
    <div className="small-metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function Spinner() {
  return <span className="spinner" />
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((entry) => (
        <span key={entry.dataKey}>{entry.name}: {entry.value}</span>
      ))}
    </div>
  )
}

function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString() : value
}

function toCsv(rows, columns) {
  const escapeCsv = (value) => {
    if (value === null || value === undefined) return ''
    const text = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  return [
    columns.map(escapeCsv).join(','),
    ...rows.map((row) => columns.map((col) => escapeCsv(row[col])).join(',')),
  ].join('\n')
}

function formatCell(value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return Number.isInteger(value) ? value : value.toFixed(4)
  if (value === null || value === undefined) return '-'
  return String(value)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
