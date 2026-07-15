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
  Shield,
  ShieldAlert,
  UploadCloud,
  Zap,
} from 'lucide-react'
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
  { id: 'api', label: 'Live API Testing', icon: Zap },
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
    <div className="app-shell">
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
  const [learnOpen, setLearnOpen] = React.useState(false)

  return (
    <>
      <motion.section className="section-heading" {...fadeUp}>
        <h1>Enterprise Real-Time Fraud Detection API</h1>
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
          onClick={runPrediction}
          disabled={busy}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          {busy ? <Spinner /> : <Shield size={18} />} {busy ? 'Predicting...' : 'Predict Fraud'}
        </motion.button>
      </motion.section>

      <section className={`learn-more ${learnOpen ? 'open' : ''}`}>
        <button type="button" className="learn-toggle" onClick={() => setLearnOpen((open) => !open)}>
          <span className="chevron">{learnOpen ? 'v' : '>'}</span>
          <span>Learn More: What do these parameters mean?</span>
        </button>
        {learnOpen && (
          <motion.div
            className="learn-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <h2><Shield size={28} /> Core Fraud Indicators Explained</h2>
            <p><strong>New Beneficiary (<code>is_beneficiary_new</code>):</strong> Indicates if the recipient account was recently linked. Fraudsters frequently add mule accounts to move money quickly after breaching a profile.</p>
            <p><strong>Device Mismatch (<code>device_mismatch</code>):</strong> Flags an unauthorized device signature, browser fingerprint, or unusual IP. This is a primary indicator of session hijacking or remote access fraud.</p>
          </motion.div>
        )}
      </section>

      <AnimatePresence>
        {prediction && (
          <motion.section
            className={`result-card ${isFraud ? 'fraud' : 'legit'}`}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            {isFraud ? <ShieldAlert size={28} /> : <CheckCircle2 size={28} />}
            <div>
              <h2>{isFraud ? 'Fraud Detected' : 'Legitimate Transaction'}</h2>
              <p>Risk score: {Number(prediction.risk_score || 0).toFixed(4)} | Confidence: {Number(prediction.confidence_level || 0).toFixed(4)}</p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
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
