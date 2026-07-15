import React from 'react'
import ReactDOM from 'react-dom/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, RadarChart,
  Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import {
  Activity, AlertOctagon, AlertTriangle, BadgeCheck,
  Brain, ChevronRight, Cpu, Eye, Gauge, GitBranch,
  Globe, Lock, RefreshCw, Shield, ShieldAlert,
  ShieldCheck, Sparkles, TrendingUp, Zap,
} from 'lucide-react'
import './styles.css'

/* ── Config ───────────────────────────────────────────────────── */
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  'https://finspark-production-72a1.up.railway.app'
).replace(/\/$/, '')

const initialForm = {
  amount: 15000,
  velocity_24h: 2,
  hour_of_transaction: 14,
  time_since_last_txn: 120,
  is_beneficiary_new: 1,
  device_mismatch: 0,
}

/* ── Animation variants ───────────────────────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.4, 0, 0.2, 1] },
  }),
}

const scaleIn = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
}

/* ── Mock trend data for sparkline ────────────────────────────── */
const trendData = [
  { t: '00:00', fraud: 2,  total: 48  },
  { t: '04:00', fraud: 5,  total: 31  },
  { t: '08:00', fraud: 12, total: 120 },
  { t: '12:00', fraud: 8,  total: 98  },
  { t: '16:00', fraud: 19, total: 145 },
  { t: '20:00', fraud: 14, total: 112 },
  { t: '23:59', fraud: 7,  total: 75  },
]

/* ── Helpers ──────────────────────────────────────────────────── */
function riskLevel(score) {
  if (score === null || score === undefined) return null
  if (score >= 0.65) return 'high'
  if (score >= 0.35) return 'medium'
  return 'low'
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: '0.8rem',
      color: 'var(--text)',
    }}>
      <div style={{ marginBottom: 6, color: 'var(--text-muted)' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, fontFamily: 'var(--font-mono)' }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

/* ── Subcomponents ────────────────────────────────────────────── */
function StatusPip({ health }) {
  return (
    <div className="navbar-status">
      <span className={`status-pip ${health}`} />
      <span>
        {health === 'online'   ? 'Backend Live'    :
         health === 'offline'  ? 'Backend Offline' : 'Connecting…'}
      </span>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, trend, delay }) {
  return (
    <motion.div
      className={`stat-card ${color}`}
      variants={fadeUp} custom={delay}
      initial="hidden" animate="visible"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div className={`stat-icon ${color}`}><Icon size={18} /></div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {trend && <div className="stat-trend"><TrendingUp size={11} />{trend}</div>}
    </motion.div>
  )
}

function ScoreMeter({ score }) {
  const pct   = Math.round((score ?? 0) * 100)
  const level = riskLevel(score)
  const color = level === 'high'   ? 'var(--red)'   :
                level === 'medium' ? 'var(--amber)'  : 'var(--green)'
  return (
    <div className="score-meter-wrap">
      <div className="score-meter-label">
        <span>Fraud Risk Score</span>
        <span style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{pct}%</span>
      </div>
      <div className="score-meter-track">
        <motion.div
          className="score-meter-fill"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  )
}

function RiskBanner({ level, txId }) {
  const cfg = {
    high:   { icon: ShieldAlert,  title: 'HIGH RISK — Flag for Review',    sub: 'Confidence: Ensemble model agrees on fraud signal.',  },
    medium: { icon: AlertTriangle, title: 'MEDIUM RISK — Monitor Closely', sub: 'Partial fraud signals detected. Manual review advised.', },
    low:    { icon: ShieldCheck,  title: 'LOW RISK — Transaction Clear',   sub: 'No significant fraud pattern detected.',               },
  }
  const { icon: Icon, title, sub } = cfg[level]
  return (
    <motion.div
      className={`risk-banner ${level}`}
      variants={scaleIn} initial="hidden" animate="visible"
    >
      <div className="risk-icon-wrap"><Icon size={22} /></div>
      <div>
        <div className="risk-title">{title}</div>
        <div className="risk-sub">{sub}</div>
        {txId && <div className="risk-sub" style={{ marginTop: 5, fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>TX: {txId}</div>}
      </div>
    </motion.div>
  )
}

function FeatureImportanceBar({ features }) {
  const maxVal = Math.max(...Object.values(features).map(Math.abs))
  return (
    <div className="feature-list">
      {Object.entries(features).slice(0, 6).map(([k, v], i) => (
        <motion.div
          key={k} className="feature-item"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
        >
          <div className="feature-meta">
            <span className="feature-name">{k.replace(/_/g, ' ')}</span>
            <span className="feature-val">{Number(v).toFixed(4)}</span>
          </div>
          <div className="feature-track">
            <motion.div
              className="feature-fill"
              style={{ background: v > 0 ? 'var(--grad-brand)' : 'var(--grad-danger)' }}
              initial={{ width: 0 }}
              animate={{ width: `${(Math.abs(v) / maxVal) * 100}%` }}
              transition={{ duration: 0.7, delay: i * 0.06 }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function SimulationResults({ data }) {
  if (!data) return null
  const txns = data.transactions || data.results || []
  if (txns.length === 0) {
    return (
      <div className="json-output">{JSON.stringify(data, null, 2)}</div>
    )
  }
  return (
    <div className="sim-grid">
      {txns.slice(0, 12).map((tx, i) => {
        const score   = tx.fraud_score ?? tx.score ?? 0
        const level   = riskLevel(score)
        const dotCls  = level === 'high' ? 'fraud' : level === 'medium' ? 'suspect' : 'legit'
        return (
          <motion.div
            key={tx.transaction_id || i}
            className="sim-event"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <span className={`sim-dot ${dotCls}`} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span className="sim-id">{tx.transaction_id || `tx-${i+1}`}</span>
                <span className={`sim-risk ${level}`}>
                  {Math.round(score * 100)}% risk
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ₹{(tx.features?.amount ?? tx.amount ?? 0).toLocaleString()}
                {tx.label !== undefined && (
                  <span style={{ marginLeft: 8, color: level === 'high' ? 'var(--red)' : 'var(--green)' }}>
                    • {tx.label === 1 ? 'Fraud' : 'Legit'}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ── Radar chart for features ────────────────── */
function FeatureRadar({ features }) {
  const keys  = Object.keys(features).slice(0, 6)
  const max   = Math.max(...Object.values(features).map(Number))
  const data  = keys.map(k => ({
    subject: k.replace(/_/g, ' '),
    value: max > 0 ? (Math.abs(Number(features[k])) / max) * 100 : 0,
  }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data} margin={{ top: 0, right: 12, bottom: 0, left: 12 }}>
        <PolarGrid stroke="rgba(99,179,237,0.12)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
        <Radar dataKey="value" stroke="var(--cyan)" fill="var(--cyan)" fillOpacity={0.18}
               dot={{ fill: 'var(--cyan)', r: 3 }} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

/* ── Main App ─────────────────────────────────────────────────── */
function App() {
  const [form,     setForm]     = React.useState(initialForm)
  const [health,   setHealth]   = React.useState('checking')
  const [response, setResponse] = React.useState(null)
  const [busy,     setBusy]     = React.useState(false)
  const [tab,      setTab]      = React.useState('predict')
  const [count,    setCount]    = React.useState({ total: 0, flagged: 0 })

  /* health check */
  React.useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then(r => r.json())
      .then(() => setHealth('online'))
      .catch(() => setHealth('offline'))
  }, [])

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  /* predict */
  async function predict() {
    setBusy(true); setResponse(null)
    try {
      const payload = {
        transaction_id: `live-${Date.now()}`,
        features: {
          amount:               Number(form.amount),
          velocity_24h:         Number(form.velocity_24h),
          hour_of_transaction:  Number(form.hour_of_transaction),
          time_since_last_txn:  Number(form.time_since_last_txn),
          is_beneficiary_new:   Number(form.is_beneficiary_new),
          device_mismatch:      Number(form.device_mismatch),
        },
      }
      const res  = await fetch(`${API_BASE_URL}/predict/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || 'Prediction failed')
      setResponse(data)
      setCount(prev => ({
        total:   prev.total + 1,
        flagged: prev.flagged + ((data.fraud_score ?? 0) >= 0.5 ? 1 : 0),
      }))
    } catch (err) { setResponse({ error: err.message }) }
    finally { setBusy(false) }
  }

  /* simulate attack */
  async function simulateAttack() {
    setBusy(true); setResponse(null); setTab('simulation')
    try {
      const res  = await fetch(`${API_BASE_URL}/demo/simulate_attack`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || 'Simulation failed')
      setResponse({ simulation: data })
    } catch (err) { setResponse({ error: err.message }) }
    finally { setBusy(false) }
  }

  /* quantum vault */
  async function testVault() {
    setBusy(true); setResponse(null)
    try {
      const res  = await fetch(`${API_BASE_URL}/demo/secure_predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo_mode: true }),
      })
      const data = await res.json()
      setResponse(data)
    } catch (err) { setResponse({ error: err.message }) }
    finally { setBusy(false) }
  }

  const fraudScore = response?.fraud_score ?? null
  const level      = riskLevel(fraudScore)

  const TABS = [
    { id: 'predict',    icon: Gauge,     label: 'Predict'    },
    { id: 'simulation', icon: Activity,  label: 'Simulation' },
    { id: 'vault',      icon: Lock,      label: 'Vault'      },
  ]

  return (
    <div className="shell">

      {/* ── Navbar ──────────────────────────────── */}
      <motion.nav
        className="navbar"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="navbar-brand">
          <div className="navbar-logo">🛡️</div>
          <div>
            <div className="navbar-name">FinSpark</div>
            <div className="navbar-tagline">AI Fraud Engine</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StatusPip health={health} />
        </div>
      </motion.nav>

      {/* ── Hero ────────────────────────────────── */}
      <motion.section
        className="hero"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="hero-badge">
          <Zap size={12} />
          ML Ensemble · Quantum-Safe · Real-Time
        </div>
        <h1>
          Detect Fraud <br />
          <span className="highlight">Before It Happens</span>
        </h1>
        <p className="hero-sub">
          XGBoost · LightGBM · CatBoost ensemble with SHAP explainability,
          quantum-safe cryptography, and live attack simulation.
        </p>
        <div className="hero-actions">
          <motion.button
            className="btn btn-primary"
            onClick={() => { setTab('predict'); window.scrollBy({ top: 200, behavior: 'smooth' }) }}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          >
            <Shield size={16} /> Run Prediction <ChevronRight size={14} />
          </motion.button>
          <motion.button
            className="btn btn-secondary"
            onClick={simulateAttack} disabled={busy}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          >
            {busy ? <><div className="spinner" /> Working…</> : <><Sparkles size={16} /> Simulate Attack</>}
          </motion.button>
        </div>
      </motion.section>

      {/* ── Stats Row ───────────────────────────── */}
      <div className="stats-row">
        <StatCard icon={Globe}   label="Transactions Analysed" value={count.total.toString().padStart(3,'0')} color="cyan"   trend="+12% today" delay={0} />
        <StatCard icon={ShieldAlert} label="Flagged Alerts"    value={count.flagged.toString().padStart(2,'0')} color="orange" trend={null}       delay={1} />
        <StatCard icon={Cpu}     label="ML Models Active"      value="3"                                       color="violet" trend="XGB·LGB·CAT" delay={2} />
        <StatCard icon={GitBranch} label="Avg Response"        value="<200ms"                                  color="green"  trend="P99 < 800ms" delay={3} />
      </div>

      {/* ── Trend Chart ─────────────────────────── */}
      <motion.div
        className="panel"
        style={{ marginBottom: 18 }}
        variants={fadeUp} custom={4}
        initial="hidden" animate="visible"
      >
        <div className="panel-header">
          <div className="panel-title">
            <div className="panel-title-icon"><TrendingUp size={15} /></div>
            Today's Transaction Trend
          </div>
          <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
            <RefreshCw size={12} /> Live
          </button>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4cc9f0" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#4cc9f0" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gFraud" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(99,179,237,0.06)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="t" tick={{ fill: 'var(--text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="total" stroke="#4cc9f0" strokeWidth={1.5}
                  fill="url(#gTotal)" name="Total" dot={false} />
            <Area type="monotone" dataKey="fraud" stroke="#f43f5e" strokeWidth={1.5}
                  fill="url(#gFraud)" name="Fraud" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Main Grid ───────────────────────────── */}
      <div className="main-grid">

        {/* Left: Controls */}
        <motion.div className="panel" variants={fadeUp} custom={5} initial="hidden" animate="visible">
          {/* Tab bar */}
          <div className="tabs">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                className={`btn btn-ghost${tab === id ? ' active' : ''}`}
                onClick={() => setTab(id)}
                style={{ flex: 1, justifyContent: 'center', gap: 7 }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── Predict Tab ──────────────────── */}
            {tab === 'predict' && (
              <motion.div key="predict"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
              >
                <p className="section-label"><Gauge size={12} /> Transaction Parameters</p>
                <div className="field-grid">
                  <div className="field">
                    <label className="field-label">Amount (₹)</label>
                    <input className="field-input" type="number" value={form.amount}
                      onChange={e => update('amount', e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field-label">Velocity 24h</label>
                    <input className="field-input" type="number" value={form.velocity_24h}
                      onChange={e => update('velocity_24h', e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field-label">Hour of Transaction</label>
                    <input className="field-input" type="number" min={0} max={23} value={form.hour_of_transaction}
                      onChange={e => update('hour_of_transaction', e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field-label">Mins since Last Txn</label>
                    <input className="field-input" type="number" value={form.time_since_last_txn}
                      onChange={e => update('time_since_last_txn', e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field-label">New Beneficiary?</label>
                    <select className="field-input" value={form.is_beneficiary_new}
                      onChange={e => update('is_beneficiary_new', Number(e.target.value))}>
                      <option value={0}>No</option>
                      <option value={1}>Yes</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Device Mismatch?</label>
                    <select className="field-input" value={form.device_mismatch}
                      onChange={e => update('device_mismatch', Number(e.target.value))}>
                      <option value={0}>No</option>
                      <option value={1}>Yes</option>
                    </select>
                  </div>
                  <div className="full-col submit-row">
                    <motion.button
                      className="btn btn-primary"
                      onClick={predict} disabled={busy}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    >
                      {busy ? <><div className="spinner" /> Analysing…</> : <><Shield size={16} /> Run Fraud Detection</>}
                    </motion.button>
                  </div>
                </div>

                {/* Inline result for predict tab */}
                <AnimatePresence>
                  {response && !response.error && !response.simulation && fraudScore !== null && (
                    <motion.div
                      className="result-area"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <p className="section-label" style={{ marginTop: 20 }}><BadgeCheck size={12} /> Detection Result</p>
                      <RiskBanner level={level} txId={response.transaction_id} />
                      <ScoreMeter score={fraudScore} />
                      <div className="meta-grid">
                        {[
                          ['Prediction', response.prediction === 1 ? '🚨 Fraud' : '✅ Legit'],
                          ['Score',      `${(fraudScore * 100).toFixed(1)}%`],
                          ['TX ID',      response.transaction_id?.slice(-12) ?? '—'],
                          ['Models',     response.models_used ?? '3-ensemble'],
                        ].map(([k, v]) => (
                          <div key={k} className="meta-pill">
                            <div className="meta-pill-key">{k}</div>
                            <div className="meta-pill-val">{v}</div>
                          </div>
                        ))}
                      </div>
                      {response.shap_values && (
                        <>
                          <p className="section-label" style={{ marginTop: 16 }}><Brain size={12} /> Feature Radar</p>
                          <FeatureRadar features={response.shap_values} />
                        </>
                      )}
                    </motion.div>
                  )}
                  {response?.error && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{
                        background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
                        borderRadius: 10, padding: 14, marginTop: 14,
                        color: 'var(--red)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)',
                        display: 'flex', gap: 10, alignItems: 'center',
                      }}
                    >
                      <AlertOctagon size={16} /> {response.error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── Simulation Tab ───────────────── */}
            {tab === 'simulation' && (
              <motion.div key="simulation"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
              >
                <p className="section-label"><Activity size={12} /> Attack Simulation Engine</p>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.65 }}>
                  Fires the backend's fraud scenario generator — synthesises a batch of transactions
                  with varying fraud patterns and returns ensemble predictions in real time.
                </p>
                <motion.button
                  className="btn btn-danger"
                  onClick={simulateAttack} disabled={busy}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ width: '100%', justifyContent: 'center', marginBottom: 18 }}
                >
                  {busy
                    ? <><div className="spinner" /> Running simulation…</>
                    : <><Sparkles size={16} /> Launch Attack Simulation</>}
                </motion.button>
                {response?.simulation && (
                  <SimulationResults data={response.simulation} />
                )}
              </motion.div>
            )}

            {/* ── Vault Tab ────────────────────── */}
            {tab === 'vault' && (
              <motion.div key="vault"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
              >
                <p className="section-label"><Lock size={12} /> Quantum-Safe Vault</p>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.65 }}>
                  Sends an encrypted payload through the post-quantum cryptography pipeline
                  (liboqs Kyber / Dilithium) and returns the signed, decrypted result preview.
                </p>
                <motion.button
                  className="btn btn-primary"
                  onClick={testVault} disabled={busy}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{ width: '100%', justifyContent: 'center', marginBottom: 18,
                           background: 'linear-gradient(135deg, var(--violet), var(--cyan))' }}
                >
                  {busy
                    ? <><div className="spinner" /> Connecting to vault…</>
                    : <><Eye size={16} /> Test Quantum Vault</>}
                </motion.button>
                {response && !response.error && !response.simulation && (
                  <div className="json-output">{JSON.stringify(response, null, 2)}</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right: Live Output + SHAP */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <motion.div className="panel" variants={fadeUp} custom={6} initial="hidden" animate="visible">
            <div className="panel-header">
              <div className="panel-title">
                <div className="panel-title-icon"><BadgeCheck size={15} /></div>
                Live Output
              </div>
              {response && (
                <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '0.73rem' }}
                  onClick={() => setResponse(null)}>
                  Clear
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {!response ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Gauge size={24} /></div>
                    <strong style={{ color: 'var(--text-muted)' }}>No data yet</strong>
                    <p>Run a prediction or simulation to see live results here.</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="output" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="json-output">
                    {JSON.stringify(response, null, 2)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* SHAP feature importance panel (only when prediction has shap_values) */}
          {response?.shap_values && (
            <motion.div
              className="panel"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="panel-header">
                <div className="panel-title">
                  <div className="panel-title-icon" style={{ background: 'rgba(124,92,255,0.14)', color: 'var(--violet)' }}>
                    <Brain size={15} />
                  </div>
                  SHAP Feature Impact
                </div>
              </div>
              <FeatureImportanceBar features={response.shap_values} />
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────── */}
      <motion.footer
        style={{
          textAlign: 'center', marginTop: 48,
          fontSize: '0.78rem', color: 'var(--text-dim)',
          borderTop: '1px solid var(--border)', paddingTop: 24,
        }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
      >
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>FinSpark</span>
        {' '}· AI-powered fraud detection · Built with XGBoost, LightGBM & CatBoost
        <span style={{ display: 'block', marginTop: 4 }}>
          Ensemble confidence · SHAP explainability · Quantum-safe cryptography
        </span>
      </motion.footer>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
