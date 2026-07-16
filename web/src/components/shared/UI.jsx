import React from 'react'

export function CountUp({ target, suffix = '', decimals }) {
  const num = Number(target)
  const dec = decimals !== undefined ? decimals : String(target).includes('.') ? 
    (String(target).split('.')[1] || '').length : 0
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
  }, [num, dec])
  
  return <>{isNaN(num) ? target : display}{suffix}</>
}

export function PanelHeader({ icon: Icon, title, action }) {
  return (
    <div className="panel-header flex items-center justify-between mb-4">
      <h2 className="flex items-center gap-2 text-lg font-medium text-white">
        <Icon size={20} className="text-cyan-400" /> {title}
      </h2>
      {action && <div>{action}</div>}
    </div>
  )
}

export function NumberField({ label, value, onChange, min, max }) {
  return (
    <label className="field flex flex-col gap-1">
      <span className="text-sm text-slate-400">{label}</span>
      <input 
        type="number" 
        min={min} 
        max={max} 
        value={value} 
        onChange={(event) => onChange(event.target.value)}
        className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white focus:outline-none focus:border-cyan-500" 
      />
    </label>
  )
}

export function SelectField({ label, value, onChange, children }) {
  return (
    <label className="field flex flex-col gap-1">
      <span className="text-sm text-slate-400">{label}</span>
      <select 
        value={value} 
        onChange={(event) => onChange(event.target.value)}
        className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded text-white focus:outline-none focus:border-cyan-500 [&>option]:bg-slate-900"
      >
        {children}
      </select>
    </label>
  )
}

export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip bg-slate-900/90 border border-slate-700 p-3 rounded shadow-xl backdrop-blur-sm">
      <strong className="block text-slate-300 mb-1">{label}</strong>
      {payload.map((entry) => (
        <span key={entry.dataKey} className="block text-sm" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </span>
      ))}
    </div>
  )
}

export function SmallMetric({ label, value }) {
  return (
    <div className="small-metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

export function Spinner() {
  return <span className="spinner" />
}
