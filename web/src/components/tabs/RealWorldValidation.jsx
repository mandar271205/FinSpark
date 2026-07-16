import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe2, ShieldAlert, Eye, Activity, Gauge, Download, UploadCloud, FileJson, Shield, Brain, Sparkles, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { callLlamaFast } from '@/lib/nvidia'
import { toCsv } from '../../lib/formatters'
import { CountUp, Spinner } from '../shared/UI'
import { DataTable, ExplainPanel } from '../shared/DataTables'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
}

function getAccentForScore(val) {
  if (val == null) return 'cyan'
  if (val >= 0.85) return 'green'
  if (val >= 0.65) return 'amber'
  return 'red'
}

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

export function RealWorldValidation({
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
    const newBeneficiaryRows = (validation?.results || []).filter(row => row.is_beneficiary_new === true || row.is_beneficiary_new === 'true' || row.is_beneficiary_new === 1).length

    return {
      fallback: true,
      dataset_overview: {
        total_rows: total,
        columns: ['transaction_id', 'amount', 'new_beneficiary', 'risk_score', 'velocity_24h'],
        description: `This dataset contains ${total} transaction records processed by the ML model.`
      },
      fraud_statistics: {
        fused_verdict: fraudCount,
        fraud_rate_percent: Number(fraudPct),
        label_source: 'ML Risk Score threshold'
      },
      fraud_reasons: highRiskRows > 0
        ? `${highRiskRows} transactions crossed a high-risk score threshold, which is the strongest signal in this upload. New beneficiary activity appears in ${newBeneficiaryRows} rows and can increase fraud risk when combined with other signals.`
        : `The model did not find many high-risk rows in this upload. Fraud volume is mainly explained by the backend model's transaction-level risk scoring.`,
      patterns: [
        `${total} transactions validated from the uploaded file`,
        `${fraudCount} transactions marked suspicious by the ML model`,
        `${newBeneficiaryRows} rows involve new-beneficiary activity`,
      ],
      risk_factors: [
        'High model risk score',
        'New beneficiary or unusual transfer context',
      ],
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

      const allRows = (validation.results || []).map(r => ({
        id:            r.transaction_id,
        new_bene:      r.is_beneficiary_new,
        is_fraud:      r.is_fraud_actual,
        risk_score:    r.risk_score != null ? (r.risk_score * 100).toFixed(0) + '%' : 'N/A',
      }))

      const systemPrompt = `You are a senior data analyst. You will be given the **full CSV dataset** (all rows and columns) as a JSON array. Your task is to thoroughly analyze the entire dataset and produce a detailed, structured insight report. Respond **only** in valid JSON with the following keys:

{
  "dataset_overview": {
    "total_rows": number,
    "columns": ["col1", "col2", ...],
    "description": "Brief description of what this dataset represents (based on column names and data)."
  },
  "fraud_statistics": {
    "llm_estimated": number,
    "label_source": "Which column or logic determined the fraud count (e.g., 'is_fraud_actual' column, or 'risk_score > 0.5')."
  },
  "fraud_reasons": "Detailed explanation of why the fraud rate is high or low, referencing specific patterns found in the data.",
  "patterns": ["Pattern 1", "Pattern 2", ...],
  "risk_factors": ["Feature 1", "Feature 2", ...]
}

Important:
- Use the actual data to compute your estimate.
- If a column like 'is_fraud' or 'is_fraud_actual' exists, use it to get the true fraud count.
- If not, infer fraud from features like risk_score, prediction, or pattern analysis.
- Do NOT include ml_detected or fused_verdict; these will be computed on the backend.`

      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `ML System Report:\n- Total transactions processed: ${validation.total_processed}\n- Fraud detected by ML model: ${validation.fraud_detected} (${fraudPct}%)\n- Model accuracy: ${validation.accuracy != null ? (validation.accuracy * 100).toFixed(1) + '%' : 'N/A'}\n\nTransaction rows (${allRows.length} rows):\n${JSON.stringify(allRows, null, 2)}\n\nAnalyze: What is in this dataset? Why is there ${fraudPct}% fraud rate? What patterns explain this? Estimate your own fraud count based on the data.`
        }
      ]
      
      const res = await callLlamaFast(messages)
      
      // Fuse the verdicts
      const llmEstimate = res?.fraud_statistics?.llm_estimated || validation.fraud_detected
      const fusedVerdict = Math.round((validation.fraud_detected + llmEstimate) / 2)
      const fusedFraudRate = validation.total_processed > 0 
        ? ((fusedVerdict / validation.total_processed) * 100).toFixed(1) 
        : 0

      const fusedRes = {
        ...res,
        fraud_statistics: {
          fused_verdict: fusedVerdict,
          fraud_rate_percent: Number(fusedFraudRate),
          label_source: res?.fraud_statistics?.label_source || 'Unknown'
        }
      }
      
      setAiInsight(fusedRes)
    } catch (err) {
      console.error('AI Insight error:', err)
      setAiInsight(buildFallbackInsight(err.message))
    } finally {
      setInsightLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <motion.section className="section-heading flex items-center justify-between" {...fadeUp}>
        <h1 className="text-2xl font-bold text-white tracking-tight">Real-World Fraud Validation</h1>
        <a className="ghost-btn download border border-slate-700/50 px-3 py-1.5 rounded-md hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm text-slate-300" href={templateUrl} download="fraud_template.csv">
          <Download size={16} /> Download Template CSV
        </a>
      </motion.section>

      <motion.section
        className="panel"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <label className="dropzone border-2 border-dashed border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/50 hover:bg-slate-800/30 transition-all text-center">
          <UploadCloud size={42} className="text-slate-400 mb-3" />
          <span className="dropzone-copy block mb-3">
            <strong className="block text-slate-200">{file ? file.name : 'Drag and drop file here'}</strong>
            <small className="text-slate-500 text-xs block mt-1">Limit 200MB per file - CSV, JSON, XLSX, XLS</small>
          </span>
          <span className="browse-chip bg-slate-800 px-3 py-1 text-xs rounded text-slate-300">Browse files</span>
          <input
            type="file"
            accept=".csv,.json,.xlsx,.xls"
            onChange={(event) => handleFile(event.target.files?.[0])}
            className="hidden"
          />
        </label>
        <div className="mt-4 flex justify-center">
          <motion.button
            className="primary-btn validate-btn bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-md font-medium transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] w-full justify-center md:w-auto"
            onClick={validateUpload}
            disabled={!file || busy}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {busy ? <Spinner /> : <FileJson size={18} />} {busy ? 'Validating...' : 'Validate Model Against Upload'}
          </motion.button>
        </div>
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
            <div className="skeleton-grid grid grid-cols-2 md:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card bg-slate-800/50 h-24 rounded-xl border border-slate-700/30 animate-pulse flex flex-col justify-center px-4">
                  <div className="w-8 h-8 rounded-full bg-slate-700 mb-2" />
                  <div className="w-16 h-4 bg-slate-700 rounded mb-1" />
                  <div className="w-24 h-3 bg-slate-700/50 rounded" />
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
        <div className="space-y-8">
          <div className="space-y-4">
            <motion.div className="val-section-label flex items-center gap-2 text-sm font-semibold text-cyan-400 uppercase tracking-wider" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
              <Shield size={14} /> Core Metrics
            </motion.div>
            <section className="metric-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coreCards.map(({ label, value, icon: Icon, accent, suffix }, i) => (
                <motion.div
                  className={`metric-card val-card val-card--${accent} bg-slate-800/40 border border-${accent}-500/30 p-5 rounded-xl flex items-center gap-4`}
                  key={label}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.09, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                  whileHover={{ y: -5, transition: { duration: 0.18 } }}
                >
                  <div className={`metric-icon val-icon--${accent} w-12 h-12 rounded-full flex items-center justify-center bg-${accent}-500/10 text-${accent}-400`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {value != null ? <CountUp target={Number(value)} suffix={suffix} /> : 'N/A'}
                    </div>
                    <div className="text-sm text-slate-400">{label}</div>
                  </div>
                </motion.div>
              ))}
            </section>
          </div>

          {/* Advanced metrics (conditional) */}
          {hasAdvanced && (
            <div className="space-y-4">
              <motion.div className="val-section-label flex items-center gap-2 text-sm font-semibold text-cyan-400 uppercase tracking-wider" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
                <Brain size={14} /> Advanced Metrics
              </motion.div>
              <section className="metric-grid grid grid-cols-1 sm:grid-cols-3 gap-4">
                {advancedCards.map(({ label, value, suffix, accent, icon: Icon }, i) => (
                  <motion.div
                    className={`metric-card val-card val-card--${accent} bg-slate-800/40 border border-${accent}-500/30 p-4 rounded-xl flex items-center gap-3`}
                    key={label}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + i * 0.09, duration: 0.5 }}
                    whileHover={{ y: -5, transition: { duration: 0.18 } }}
                  >
                    <div className={`metric-icon val-icon--${accent} text-${accent}-400`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-white">
                        {value != null ? <CountUp target={Number(value)} suffix={suffix} /> : 'N/A'}
                      </div>
                      <div className="text-xs text-slate-400">{label}</div>
                    </div>
                  </motion.div>
                ))}
              </section>
            </div>
          )}

          {/* Confusion matrix (conditional) */}
          {hasConfusion && (
            <motion.section
              className="panel"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.4 }}
            >
              <div className="panel-header flex items-center gap-2 text-lg font-medium text-white mb-6">
                <Eye size={20} className="text-cyan-400" /> Confusion Matrix
              </div>
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
            <Card className="insight-panel bg-slate-900/60 border border-slate-700/60 shadow-xl overflow-hidden backdrop-blur-md">
              <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-500" />
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                      <Sparkles size={20} className="text-indigo-400" /> Dataset AI Insight
                    </h3>
                  </div>
                  <Button
                    onClick={handleAiInsight}
                    disabled={insightLoading}
                    variant="outline"
                    className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 bg-slate-800 hover:text-indigo-200"
                  >
                    {insightLoading ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Sparkles className="mr-2" size={16} />}
                    Analyze Upload
                  </Button>
                </div>

                {aiInsight && !aiInsight.error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 pt-5 border-t border-slate-800/60 space-y-5 overflow-hidden"
                  >
                    {/* Dataset Overview */}
                    {aiInsight.dataset_overview && (
                      <div className="relative bg-gradient-to-br from-slate-800/70 to-slate-900/70 p-5 rounded-2xl border border-slate-700/50 shadow-lg backdrop-blur-sm">
                        <div className="text-[11px] font-bold text-cyan-400/80 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <Brain size={14} /> Dataset Overview
                        </div>
                        <ul className="space-y-2 text-sm text-slate-300">
                          <li><strong className="text-slate-200">Total rows:</strong> {aiInsight.dataset_overview.total_rows}</li>
                          <li><strong className="text-slate-200">Columns:</strong> {aiInsight.dataset_overview.columns?.join(', ')}</li>
                          <li><strong className="text-slate-200">Description:</strong> {aiInsight.dataset_overview.description}</li>
                        </ul>
                      </div>
                    )}

                    {/* Fraud Statistics */}
                    {aiInsight.fraud_statistics && (
                      <div className="relative bg-gradient-to-r from-indigo-900/40 to-slate-900/60 p-5 rounded-2xl border border-indigo-500/30 shadow-lg backdrop-blur-sm">
                        <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <Sparkles size={14} /> ★ Fraud Statistics (Final Answer)
                        </div>
                        <div className="bg-slate-950/50 rounded-xl p-4 border border-indigo-500/20">
                          <div className="text-lg text-white font-medium mb-1">
                            Fused Verdict: <span className="text-indigo-400 font-bold">{aiInsight.fraud_statistics.fused_verdict} frauds</span> ({aiInsight.fraud_statistics.fraud_rate_percent}% fraud rate)
                          </div>
                          <div className="text-sm text-slate-400">
                            Source: {aiInsight.fraud_statistics.label_source}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fraud reason */}
                    {aiInsight.fraud_reasons && (
                      <div className="relative bg-gradient-to-br from-rose-950/40 to-slate-900/60 border border-rose-800/30 p-5 rounded-2xl text-slate-200 text-sm leading-relaxed shadow-lg backdrop-blur-sm">
                        <div className="text-[11px] font-bold text-rose-400/80 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                          <AlertTriangle size={14} /> Why is fraud rate high/low?
                        </div>
                        <p className="opacity-90">{aiInsight.fraud_reasons}</p>
                      </div>
                    )}

                    {/* Patterns + Risk factors */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {aiInsight.patterns?.length > 0 && (
                        <div className="bg-gradient-to-br from-cyan-950/40 to-slate-900/60 border border-cyan-800/30 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
                          <div className="text-cyan-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><Activity size={14} /> Transaction Patterns</div>
                          <ul className="space-y-2">
                            {aiInsight.patterns.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-300 text-xs leading-relaxed">
                                <span className="text-cyan-500 mt-0.5"><CheckCircle2 size={12} /></span>
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
            title="Validation Results"
            rows={rows}
            columns={resultColumns}
            action={
              <a className="ghost-btn" href={resultsCsvUrl} download="validation_results.csv">
                <Download size={14} /> Export CSV
              </a>
            }
          />
        </div>
      )}
    </div>
  )
}
