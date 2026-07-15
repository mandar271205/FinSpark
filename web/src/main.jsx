import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Brain,
  Eye,
  Gauge,
  Shield,
  Sparkles,
} from 'lucide-react'
import './styles.css'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://finspark-production-72a1.up.railway.app').replace(/\/$/, '')

const initialForm = {
  amount: 15000,
  velocity_24h: 2,
  hour_of_transaction: 14,
  time_since_last_txn: 120,
  is_beneficiary_new: 1,
  device_mismatch: 0,
}

function App() {
  const [form, setForm] = React.useState(initialForm)
  const [health, setHealth] = React.useState('checking')
  const [response, setResponse] = React.useState(null)
  const [busy, setBusy] = React.useState(false)
  const [tab, setTab] = React.useState('predict')

  React.useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((r) => r.json())
      .then(() => setHealth('online'))
      .catch(() => setHealth('offline'))
  }, [])

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  async function predict() {
    setBusy(true)
    setResponse(null)
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
      setResponse(data)
    } catch (err) {
      setResponse({ error: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function simulateAttack() {
    setBusy(true)
    setResponse(null)
    try {
      const res = await fetch(`${API_BASE_URL}/demo/simulate_attack`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || 'Simulation failed')
      setResponse({ simulation: data })
      setTab('simulation')
    } catch (err) {
      setResponse({ error: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="shell">
      <header className="hero">
        <div className="brand-row">
          <div className={`status-dot ${health}`} />
          <span>Backend {health === 'online' ? 'online' : health === 'offline' ? 'offline' : 'checking'}</span>
        </div>
        <h1>FinSpark</h1>
        <p>Fraud detection for payments, cyber signals, and quantum-safe experiments.</p>
        <div className="hero-actions">
          <button className="primary" onClick={() => setTab('predict')}><Gauge size={16} /> Predict</button>
          <button className="secondary" onClick={simulateAttack}><Sparkles size={16} /> Simulate Attack</button>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <div className="tabs">
            <button className={tab === 'predict' ? 'active' : ''} onClick={() => setTab('predict')}>Predict</button>
            <button className={tab === 'simulation' ? 'active' : ''} onClick={() => setTab('simulation')}>Simulation</button>
            <button className={tab === 'vault' ? 'active' : ''} onClick={() => setTab('vault')}>Vault</button>
          </div>

          {tab === 'predict' && (
            <div className="card-grid">
              <Field label="Amount" value={form.amount} onChange={(v) => update('amount', v)} />
              <Field label="Velocity 24h" value={form.velocity_24h} onChange={(v) => update('velocity_24h', v)} />
              <Field label="Hour" value={form.hour_of_transaction} onChange={(v) => update('hour_of_transaction', v)} />
              <Field label="Mins since last txn" value={form.time_since_last_txn} onChange={(v) => update('time_since_last_txn', v)} />
              <SelectField label="New Beneficiary" value={form.is_beneficiary_new} onChange={(v) => update('is_beneficiary_new', v)} />
              <SelectField label="Device Mismatch" value={form.device_mismatch} onChange={(v) => update('device_mismatch', v)} />

              <button className="full primary submit" onClick={predict} disabled={busy}>
                <Shield size={16} /> {busy ? 'Working...' : 'Predict Fraud'}
              </button>
            </div>
          )}

          {tab === 'simulation' && (
            <div className="story">
              <h2><Activity size={18} /> Attack Simulation</h2>
              <p>Runs the backend demo generator and shows the result summary here.</p>
              <button className="primary" onClick={simulateAttack} disabled={busy}>
                <Sparkles size={16} /> {busy ? 'Running...' : 'Run Simulation'}
              </button>
            </div>
          )}

          {tab === 'vault' && (
            <div className="story">
              <h2><Brain size={18} /> Quantum Vault</h2>
              <p>Calls the backend quantum-safe demo endpoint and returns the encrypted/decrypted payload preview.</p>
              <button className="primary" onClick={async () => {
                setBusy(true)
                try {
                  const res = await fetch(`${API_BASE_URL}/demo/secure_predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ demo_mode: true }),
                  })
                  const data = await res.json()
                  setResponse(data)
                } finally {
                  setBusy(false)
                }
              }} disabled={busy}>
                <Eye size={16} /> {busy ? 'Connecting...' : 'Test Vault'}
              </button>
            </div>
          )}
        </section>

        <aside className="panel results">
          <h2><BadgeCheck size={18} /> Live Output</h2>
          {response ? (
            <pre>{JSON.stringify(response, null, 2)}</pre>
          ) : (
            <div className="empty">
              <AlertTriangle size={18} />
              <p>No response yet. Run a prediction or simulation.</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

function SelectField({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        <option value={0}>No</option>
        <option value={1}>Yes</option>
      </select>
    </label>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
