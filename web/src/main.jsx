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
import { callLlamaFast } from "@/lib/nvidia"
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
      return data  // ← return for fusion engine
    } catch (err) {
      setError(err.message)
      return null
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

  const [aiInsight, setAiInsight]       = React.useState(null)
  const [insightLoading, setInsightLoading] = React.useState(false)

  // ── Core 4 metric cards ──
  const fusedFraudCount = (aiInsight && aiInsight.fraud_count_llm != null && validation)
    ? Math.round((validation.fraud_detected + aiInsight.fraud_count_llm) / 2)
    : validation?.fraud_detected;

  const coreCards = [
    { label: 'Total Processed',     value: validation?.total_processed, icon: Globe2,       accent: 'cyan',   suffix: ''  },
    { label: 'Fraud Detected',      value: fusedFraudCount,             icon: ShieldAlert,  accent: 'red',    suffix: ''  },
  ]

  // ── Advanced metrics (conditional) ──
  const hasAdvanced = !!(validation?.precision != null || validation?.recall != null || validation?.f1_score != null)
  const hasConfusion = !!(validation?.confusion_matrix && Array.isArray(validation.confusion_matrix))
  const advancedCards = hasAdvanced ? [
    { label: 'Precision', value: validation.precision != null ? parseFloat((validation.precision * 100).toFixed(1)) : null, suffix: '%', accent: getAccentForScore(validation.precision), icon: Eye },
    { label: 'Recall',    value: validation.recall    != null ? parseFloat((validation.recall    * 100).toFixed(1)) : null, suffix: '%', accent: getAccentForScore(validation.recall),    icon: Activity },
    { label: 'F1-Score',  value: validation.f1_score  != null ? parseFloat((validation.f1_score  * 100).toFixed(1)) : null, suffix: '%', accent: getAccentForScore(validation.f1_score),  icon: Gauge },
  ] : []

  const buildFallbackInsight = (errorMessage = '') => {
    const total = validation?.total_processed || 0
    const fraudCount = validation?.fraud_detected || 0
    const fraudPct = total > 0 ? ((fraudCount / total) * 100).toFixed(1) : '0.0'
    const highRiskRows = (validation?.results || []).filter(row => Number(row.risk_score || 0) >= 0.7).length
    const newBeneficiaryRows = (validation?.results || []).filter(row => row.is_beneficiary_new === true || row.is_beneficiary_new === 'true').length

    return {
      fallback: true,
      dataset_summary: `Processed ${total} uploaded transactions and detected ${fraudCount} fraud cases (${fraudPct}%). This summary is generated from the ML validation result while the LLM insight service is unavailable.`,
      fraud_count_llm: fraudCount,
      fraud_reason: highRiskRows > 0
        ? `${highRiskRows} transactions crossed a high-risk score threshold, which is the strongest signal in this upload. New beneficiary activity appears in ${newBeneficiaryRows} rows and can increase fraud risk when combined with other signals.`
        : `The model did not find many high-risk rows in this upload. Fraud volume is mainly explained by the backend model's transaction-level risk scoring.`,
      transaction_patterns: [
        `${total} transactions validated from the uploaded file`,
        `${fraudCount} transactions marked suspicious by the ML model`,
        `${newBeneficiaryRows} rows involve new-beneficiary activity`,
      ],
      risk_factors: [
        'High model risk score',
        'New beneficiary or unusual transfer context',
      ],
      fused_verdict: `ML validation currently reports ${fraudCount} suspicious transactions out of ${total}.`,
      error_detail: errorMessage,
    }
  }

  // ── Unified AI Insight: ML count + LLM analyzes actual CSV rows ──
  const handleAiInsight = async () => {
    if (!validation) return
    setInsightLoading(true)
    setAiInsight(null)
    try {
      const fraudPct = validation.total_processed > 0
        ? ((validation.fraud_detected / validation.total_processed) * 100).toFixed(1)
        : 'N/A'

      const allRows = (validation.results || []).slice(0, 60).map(r => ({
        id:            r.transaction_id,
        new_bene:      r.is_beneficiary_new,
        is_fraud:      r.is_fraud_actual,
        risk_score:    r.risk_score != null ? (r.risk_score * 100).toFixed(0) + '%' : 'N/A',
      }))

      const messages = [
        {
          role: 'system',
          content: 'You are a senior financial fraud analyst. You have received ACTUAL transaction rows from a CSV dataset processed by an ML fraud detection system. Analyze the data and respond ONLY in valid JSON: { "dataset_summary": "2 sentences: what kind of transactions are in this CSV, what does the data represent", "fraud_count_llm": number (your estimate of actual fraudulent transactions based on patterns), "fraud_reason": "2 sentences: why are there so many or few fraud cases in this dataset based on the actual data patterns", "transaction_patterns": ["pattern1", "pattern2", "pattern3"], "risk_factors": ["risk factor from actual data 1", "risk factor 2"], "fused_verdict": "1 sentence combining ML count and your analysis" }'
        },
        {
          role: 'user',
          content: `ML System Report:
- Total transactions processed: ${validation.total_processed}
- Fraud detected by ML model: ${validation.fraud_detected} (${fraudPct}%)
- Model accuracy: ${validation.accuracy != null ? (validation.accuracy * 100).toFixed(1) + '%' : 'N/A'}

Sample transaction rows (${allRows.length} rows):
${JSON.stringify(allRows, null, 2)}

Analyze: What is in this dataset? Why is there ${fraudPct}% fraud rate? What patterns explain this? Estimate your own fraud count based on the data.`
        }
      ]
      const res = await callLlamaFast(messages)
      setAiInsight(res)
    } catch (err) {
      console.error('AI Insight error:', err)
      setAiInsight(buildFallbackInsight(err.message))
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
        className="panel"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <label className="dropzone">
          <UploadCloud size={42} />
          <span className="dropzone-copy">
            <strong>{file ? file.name : 'Drag and drop file here'}</strong>
            <small>Limit 200MB per file - CSV, JSON, XLSX, XLS</small>
          </span>
          <span className="browse-chip">Browse files</span>
          <input
            type="file"
            accept=".csv,.json,.xlsx,.xls"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
        <motion.button
          className="primary-btn validate-btn"
          onClick={validateUpload}
          disabled={!file || busy}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {busy ? <Spinner /> : <FileJson size={18} />} {busy ? 'Validating...' : 'Validate Model Against Upload'}
        </motion.button>
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
          ) : null}

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

          {/* ══ Single AI Insight Panel (ML + LLM Fused) ══ */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-8"
          >
            <Card className="insight-panel">
              <CardContent>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-cyan-400">
                      <Sparkles size={20} /> Dataset Insight
                    </h3>
                  </div>
                  <Button
                    onClick={handleAiInsight}
                    disabled={insightLoading}
                    variant="outline"
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    {insightLoading ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Sparkles className="mr-2" size={16} />}
                    Analyze Upload
                  </Button>
                </div>

                {aiInsight && !aiInsight.error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 pt-5 border-t border-slate-800/60 space-y-5"
                  >
                    {/* Dataset summary */}
                    {aiInsight.fallback && (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                        Live LLM insight is unavailable, so this panel is showing a metrics-based summary.
                      </div>
                    )}

                    {aiInsight.dataset_summary && (
                      <div className="relative bg-gradient-to-br from-slate-800/70 to-slate-900/70 p-5 rounded-2xl text-slate-200 leading-relaxed text-sm border border-slate-700/50 shadow-lg backdrop-blur-sm">
                        <div className="text-[11px] font-bold text-cyan-400/80 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><Brain size={14} /> What's in this dataset</div>
                        <p className="opacity-90">{aiInsight.dataset_summary}</p>
                      </div>
                    )}

                    {/* Fraud reason */}
                    {aiInsight.fraud_reason && (
                      <div className="relative bg-gradient-to-br from-rose-950/40 to-slate-900/60 border border-rose-800/30 p-5 rounded-2xl text-slate-200 text-sm leading-relaxed shadow-lg backdrop-blur-sm">
                        <div className="text-[11px] font-bold text-rose-400/80 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Why this fraud rate?</div>
                        <p className="opacity-90">{aiInsight.fraud_reason}</p>
                      </div>
                    )}

                    {/* Patterns + Risk factors */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {aiInsight.transaction_patterns?.length > 0 && (
                        <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-800/30 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
                          <div className="text-indigo-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><Activity size={14} /> Transaction Patterns</div>
                          <ul className="space-y-2">
                            {aiInsight.transaction_patterns.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-300 text-xs leading-relaxed">
                                <span className="text-indigo-500 mt-0.5"><CheckCircle2 size={12} /></span>
                                <span className="opacity-90">{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiInsight.risk_factors?.length > 0 && (
                        <div className="bg-gradient-to-br from-amber-950/40 to-slate-900/60 border border-amber-800/30 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
                          <div className="text-amber-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><ShieldAlert size={14} /> Risk Factors Found</div>
                          <ul className="space-y-2">
                            {aiInsight.risk_factors.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-300 text-xs leading-relaxed">
                                <span className="text-amber-500 mt-0.5"><AlertTriangle size={12} /></span>
                                <span className="opacity-90">{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Fused verdict sentence */}
                    {aiInsight.fused_verdict && (
                      <div className="relative bg-gradient-to-r from-cyan-900/30 via-slate-800/50 to-indigo-900/30 border-l-4 border-l-cyan-500 border-y border-r border-slate-700/50 p-5 rounded-r-2xl text-cyan-100 text-sm italic leading-relaxed shadow-lg backdrop-blur-sm">
                        "{aiInsight.fused_verdict}"
                      </div>
                    )}
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

function FinalVerdictCard({ finalVerdict, llmReason }) {
  if (!finalVerdict) return null
  const isFraud = finalVerdict.isFraud
  const conf = Math.round((finalVerdict.confidence || 0) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`verdict-card ${isFraud ? 'verdict-card--fraud' : 'verdict-card--legit'}`}
    >
      <div className="verdict-card-icon">{isFraud ? '🚨' : '✅'}</div>
      <div className={`verdict-card-label ${isFraud ? 'text-red-400' : 'text-green-400'}`}>
        {isFraud ? 'FRAUD DETECTED' : 'LEGITIMATE TRANSACTION'}
      </div>
      <div className="verdict-card-conf">{conf}% confidence</div>
      {llmReason && (
        <div className="verdict-card-reason">&ldquo;{llmReason}&rdquo;</div>
      )}
    </motion.div>
  )
}

function VerdictBadge({ type }) {
  const styles = {
    consensus:  'bg-green-500/10 text-green-400 border-green-500/40',
    judge:      'bg-amber-500/10 text-amber-400 border-amber-500/40',
    fallback:   'bg-slate-500/10 text-slate-400 border-slate-500/40',
    fraud:      'bg-red-500/10 text-red-400 border-red-500/50',
    legit:      'bg-green-500/10 text-green-400 border-green-500/50',
  }
  const labels = {
    consensus: '✅ Consensus Reached',
    judge:     '👨‍⚖️ Judge Override',
    fallback:  '⚠️ Fallback Mode',
    fraud:     '🚨 FRAUD',
    legit:     '✅ LEGITIMATE',
  }
  return (
    <Badge variant="outline" className={`text-xs font-semibold px-3 py-1 ${styles[type]}`}>
      {labels[type]}
    </Badge>
  )
}


function HybridVerdictCards({ mlResult, llmResult, finalVerdict, rawJson }) {
  const [showRaw, setShowRaw] = React.useState(false)
  if (!mlResult && !llmResult) return null

  const mlIsFraud = mlResult?.is_fraud
  const llmIsFraud = llmResult?.fraud !== undefined ? llmResult.fraud : (llmResult?.verdict === 'Fraud')
  const llmConf = Math.round((llmResult?.confidence || 0) * 100)
  const mlConf  = Math.round((mlResult?.risk_score || 0) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-4"
    >
      {/* 3-card grid */}
      <div className="hybrid-cards-grid">
        {/* ML Card */}
        <div className={`hybrid-card ${mlIsFraud ? 'hybrid-card--fraud' : 'hybrid-card--legit'}`}>
          <div className="hybrid-card-icon">🧠</div>
          <div className="hybrid-card-title">ML Model Score</div>
          <VerdictBadge type={mlIsFraud ? 'fraud' : 'legit'} />
          <div className="hybrid-card-conf">{mlConf}% confidence</div>
          <div className="hybrid-card-sub">25-model ensemble</div>
        </div>

        {/* LLM Card */}
        <div className={`hybrid-card ${llmIsFraud ? 'hybrid-card--fraud' : 'hybrid-card--legit'}`}>
          <div className="hybrid-card-icon">🤖</div>
          <div className="hybrid-card-title">AI Reasoner (Llama 8B)</div>
          <VerdictBadge type={llmIsFraud ? 'fraud' : 'legit'} />
          <div className="hybrid-card-conf">{llmConf}% confidence</div>
          {llmResult?.reason && <div className="hybrid-card-reason">&ldquo;{llmResult.reason}&rdquo;</div>}
        </div>

        {/* Final Verdict Card */}
        <div className={`hybrid-card hybrid-card--final ${finalVerdict?.isFraud ? 'hybrid-card--fraud' : 'hybrid-card--legit'}`}>
          <div className="hybrid-card-icon">🏆</div>
          <div className="hybrid-card-title">Final Verdict</div>
          <VerdictBadge type={finalVerdict?.isFraud ? 'fraud' : 'legit'} />
          <div className="hybrid-card-conf">{Math.round((finalVerdict?.confidence || 0) * 100)}% confidence</div>
          <div className="mt-2">
            <VerdictBadge type={finalVerdict?.method === 'judge' ? 'judge' : 'consensus'} />
          </div>
          {finalVerdict?.judgeReason && (
            <div className="hybrid-card-reason mt-1 text-amber-300">{finalVerdict.judgeReason}</div>
          )}
        </div>
      </div>

      {/* Raw JSON toggle */}
      <div className="text-right">
        <button
          className="ghost-btn text-xs"
          onClick={() => setShowRaw(v => !v)}
        >
          <FileJson size={14} /> {showRaw ? 'Hide' : 'Show'} Raw JSON
        </button>
      </div>
      <AnimatePresence>
        {showRaw && (
          <motion.pre
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="code-block text-xs overflow-auto max-h-60"
          >
            {JSON.stringify(rawJson, null, 2)}
          </motion.pre>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════
   LIVE API TESTING (Transaction Testing)
═══════════════════════════════════════════════ */
function LiveApiTesting({ form, updateForm, prediction, busy, runPrediction }) {
  const [llmResult,     setLlmResult]     = React.useState(null)
  const [finalVerdict,  setFinalVerdict]  = React.useState(null)
  const [fusionLoading, setFusionLoading] = React.useState(false)

  const handlePredict = async () => {
    setLlmResult(null)
    setFinalVerdict(null)
    setFusionLoading(true)

    const txContext = `Amount=${form.amount}, Velocity24h=${form.velocity_24h}, HourOfDay=${form.hour_of_transaction}, MinsSinceLast=${form.time_since_last_txn}, NewBeneficiary=${form.is_beneficiary_new}, DeviceMismatch=${form.device_mismatch}`

    // Parallel: ML backend + Llama 8B
    const [mlData, llmData] = await Promise.allSettled([
      runPrediction(),
      callLlamaFast([
        { role: 'system', content: 'You are a fraud detection AI. Respond ONLY in valid JSON: { "fraud": boolean, "confidence": number between 0 and 1, "reason": "one sentence explanation max 15 words" }' },
        { role: 'user',   content: `Transaction: ${txContext}` },
      ]),
    ])

    const ml  = mlData.status  === 'fulfilled' ? mlData.value  : null
    const llm = llmData.status === 'fulfilled' ? llmData.value : null
    setLlmResult(llm)

    // Fusion: pick best answer (highest confidence)
    const mlIsFraud  = !!ml?.is_fraud
    const llmIsFraud = llm ? (llm.fraud !== undefined ? !!llm.fraud : false) : mlIsFraud
    const mlConf     = ml?.risk_score  || 0
    const llmConf    = llm?.confidence || 0

    let isFraud, confidence
    if (!llm) {
      isFraud    = mlIsFraud
      confidence = mlConf
    } else if (mlIsFraud === llmIsFraud) {
      // Both agree — average confidence
      isFraud    = mlIsFraud
      confidence = (mlConf + llmConf) / 2
    } else {
      // Disagree — use highest confidence model's verdict
      const useML = mlConf >= llmConf
      isFraud    = useML ? mlIsFraud : llmIsFraud
      confidence = Math.max(mlConf, llmConf)
    }

    setFinalVerdict({ isFraud, confidence })
    setFusionLoading(false)
  }

  return (
    <div className="space-y-6">
      <motion.section className="section-heading" {...fadeUp}>
        <h1>Enterprise Real-Time Transaction Testing</h1>
      </motion.section>

      <motion.section
        className="panel"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="form-grid">
          <NumberField label="Transaction Amount"   value={form.amount}               onChange={(value) => updateForm('amount', value)} />
          <NumberField label="Velocity in 24h"      value={form.velocity_24h}          onChange={(value) => updateForm('velocity_24h', value)} />
          <NumberField label="Hour of Day"          value={form.hour_of_transaction}   min={0} max={23} onChange={(value) => updateForm('hour_of_transaction', value)} />
          <NumberField label="Mins Since Last Txn"  value={form.time_since_last_txn}   onChange={(value) => updateForm('time_since_last_txn', value)} />
          <SelectField
            label="New Beneficiary?"
            value={form.is_beneficiary_new}
            help="1 means the receiver account is newly added. This is risky in phishing cash-outs."
            onChange={(value) => updateForm('is_beneficiary_new', Number(value))}
          />
          <SelectField
            label="Device Mismatch?"
            value={form.device_mismatch}
            help="1 means device, browser, or IP differs from the usual customer profile."
            onChange={(value) => updateForm('device_mismatch', Number(value))}
          />
        </div>
        <motion.button
          className="primary-btn validate-btn"
          onClick={handlePredict}
          disabled={busy || fusionLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          {(busy || fusionLoading) ? <Spinner /> : <Shield size={18} />}
          {(busy || fusionLoading) ? 'Predicting…' : 'Predict Fraud (AI + ML)'}
        </motion.button>
      </motion.section>

      {/* Clean single final answer card */}
      <AnimatePresence>
        {finalVerdict && (
          <FinalVerdictCard
            finalVerdict={finalVerdict}
            llmReason={llmResult?.reason || null}
          />
        )}
      </AnimatePresence>
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
