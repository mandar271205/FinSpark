import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, HelpCircle, AlertCircle } from 'lucide-react'
import { callLlamaFast } from '@/lib/nvidia'
import { Spinner } from '../shared/UI'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const formSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  velocity_24h: z.coerce.number().min(0, 'Velocity must be 0 or more'),
  hour_of_transaction: z.coerce.number().min(0, 'Hour must be 0-23').max(23, 'Hour must be 0-23'),
  time_since_last_txn: z.coerce.number().min(0, 'Minutes must be 0 or more'),
  is_beneficiary_new: z.coerce.number().min(0).max(1),
  device_mismatch: z.coerce.number().min(0).max(1),
})

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
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

function FormNumberField({ label, register, name, error, min, max }) {
  return (
    <div className="field">
      <span>{label}</span>
      <input type="number" min={min} max={max} {...register(name)} className={error ? 'border-red-500/50' : ''} />
      {error && <span className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{error.message}</span>}
    </div>
  )
}

function FormSelectField({ label, register, name, help, error }) {
  return (
    <div className="field">
      <span className="field-label-row">
        {label}
        {help && (
          <TooltipProvider>
            <ShadcnTooltip>
              <TooltipTrigger asChild>
                <span className="help-mark cursor-help text-slate-400 hover:text-cyan-400 transition-colors" aria-label={help}>
                  <HelpCircle size={16} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-slate-900 border-slate-700 text-white font-medium">
                {help}
              </TooltipContent>
            </ShadcnTooltip>
          </TooltipProvider>
        )}
      </span>
      <select {...register(name)} className={error ? 'border-red-500/50' : ''}>
        <option value={0}>No</option>
        <option value={1}>Yes</option>
      </select>
      {error && <span className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{error.message}</span>}
    </div>
  )
}

export function TransactionTesting({ form: initialForm, busy, runPrediction }) {
  const [llmResult,     setLlmResult]     = React.useState(null)
  const [finalVerdict,  setFinalVerdict]  = React.useState(null)
  const [fusionLoading, setFusionLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialForm,
  })

  const onSubmit = async (data) => {
    setLlmResult(null)
    setFinalVerdict(null)
    setFusionLoading(true)

    const txContext = `Amount=${data.amount}, Velocity24h=${data.velocity_24h}, HourOfDay=${data.hour_of_transaction}, MinsSinceLast=${data.time_since_last_txn}, NewBeneficiary=${data.is_beneficiary_new}, DeviceMismatch=${data.device_mismatch}`

    // Parallel: ML backend + Llama 8B
    const [mlData, llmData] = await Promise.allSettled([
      runPrediction(data),
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

      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className="panel"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="form-grid">
          <FormNumberField label="Transaction Amount" register={register} name="amount" error={errors.amount} />
          <FormNumberField label="Velocity in 24h" register={register} name="velocity_24h" error={errors.velocity_24h} />
          <FormNumberField label="Hour of Day" register={register} name="hour_of_transaction" min={0} max={23} error={errors.hour_of_transaction} />
          <FormNumberField label="Mins Since Last Txn" register={register} name="time_since_last_txn" error={errors.time_since_last_txn} />
          <FormSelectField
            label="New Beneficiary?"
            register={register}
            name="is_beneficiary_new"
            help="1 means the receiver account is newly added. This is risky in phishing cash-outs."
            error={errors.is_beneficiary_new}
          />
          <FormSelectField
            label="Device Mismatch?"
            register={register}
            name="device_mismatch"
            help="1 means device, browser, or IP differs from the usual customer profile."
            error={errors.device_mismatch}
          />
        </div>
        <motion.button
          type="submit"
          className="primary-btn validate-btn"
          disabled={busy || fusionLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          {(busy || fusionLoading) ? <Spinner /> : <Shield size={18} />}
          {(busy || fusionLoading) ? 'Predicting…' : 'Predict Fraud (AI + ML)'}
        </motion.button>
      </motion.form>

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
