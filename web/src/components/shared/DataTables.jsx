import React from 'react'
import { motion } from 'framer-motion'
import { Brain, FileJson } from 'lucide-react'
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell, ReferenceLine } from 'recharts'
import { formatCell } from '../../lib/formatters'
import { PanelHeader, ChartTooltip, Spinner } from './UI'

export function ExplainPanel({ txIds, explainTx, setExplainTx, explanation, explainTransaction, explaining }) {
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

export function DataTable({ title, rows, columns, action }) {
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
