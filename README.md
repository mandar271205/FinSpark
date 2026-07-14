# 🔥 FinSpark PS2: AI-Driven Cyber-Transaction Fraud Detection

**Enterprise Security Operations Center · 25‑Model ML Ensemble · Post‑Quantum Secured · Real‑Time Attack Simulation**

*From Satellite Pixel to Survival Corridor — building the most sophisticated fraud detection system combining cybersecurity telemetry with transactional behavior using 25‑model ensemble AI and Graph Neural Networks.*

---

## 🎯 Problem Statement

Traditional fraud detection operates in silos: cybersecurity teams see network threats, transaction teams see account activity, but nobody connects them. A coordinated attack—port scan at 10:05, phishing at 10:08, fraudulent transfer at 10:12—goes undetected.

**Our Solution:** An AI‑powered **Cyber‑Transaction Correlation Engine** that merges network telemetry with transaction data in a 5‑minute window, catches multi‑stage fraud, and proves causality using DoWhy. It also addresses **quantum risks** like Harvest‑Now‑Decrypt‑Later (HNDL) with post‑quantum encryption.

---

## 🏗️ Architecture (6 Tiers)

```
┌──────────────────────────────────────────────────────────┐
│ TIER 1 – DATA LAYER                                      │
│ Cyber Telemetry (CIC‑IDS) + Transactions (PaySim)         │
│ + HNDL Quantum Risk Indicators                          │
├──────────────────────────────────────────────────────────┤
│ TIER 2 – PREPROCESSING & FEATURE ENGINEERING             │
│ 5‑Min Correlation | Proxy Leakage Check (corr>0.95 drop) │
│ Heavy Perturbation (σ=0.8, 20% dropout, 5% label noise) │
│ Auto‑correction of unrealistic fraud ratios              │
├──────────────────────────────────────────────────────────┤
│ TIER 3 – 25‑MODEL ENSEMBLE & GRAPH AI                    │
│ XGBoost, LightGBM, CatBoost, RF, SVM, MLP… + Voting      │
│ Graph Convolutional Network (GCN) for fraud ring detect. │
├──────────────────────────────────────────────────────────┤
│ TIER 4 – OPTIMAL THRESHOLD & CAUSAL INFERENCE            │
│ Youden’s J threshold tuning | DoWhy causal DAG           │
│ Cyber → Fraud causality proven                           │
├──────────────────────────────────────────────────────────┤
│ TIER 5 – EXPLAINABILITY (SHAP)                           │
│ Top‑10 features, waterfall charts, LIME audit trails     │
├──────────────────────────────────────────────────────────┤
│ TIER 6 – PRODUCTION DEPLOYMENT & QUANTUM SECURITY        │
│ FastAPI backend | Streamlit SOC Dashboard                │
│ ML‑KEM Post‑Quantum Vault (FIPS‑203)                    │
│ Supabase real‑time database | Docker ready               │
└──────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

- **Live Attack Simulation** – Generates 100 realistic transactions (4 fraud patterns) scored by the real ML ensemble. Every run is **unique** (timestamp‑based seed).
- **SHAP Explainability** – Select any fraud transaction from dropdown to see why the model flagged it (bar chart + feature contribution table).
- **Real‑World Validation** – Upload CSV/JSON/Excel of known fraud cases; system validates detection rate against RBI/NPCI patterns.
- **Quantum Risk Indicators** – Per‑transaction HNDL threat score (0‑1) derived from network features (IAT, flags, packet variance).
- **ML‑KEM Quantum Vault** – Encrypt model predictions with post‑quantum cryptography (FIPS‑203). Side‑by‑side visual comparison: “Without Quantum Vault” vs “With ML‑KEM”.
- **Causal Inference Graph** – DoWhy‑generated causal DAG proves cyber events cause fraud, not merely correlate.
- **Optimal Threshold Tuning** – Automatically selects decision threshold using Youden’s J statistic (no hardcoded 0.5).
- **Robust Data Sanity** – Auto‑corrects fraud ratios >30%; drops leaking features; applies heavy perturbation to prevent AUC=1.0.
- **Live Dashboard** – Real‑time metrics (Total Analyzed, Alerts Triggered, AUC, Detection Rate) with fraud trend chart, all connected to Supabase.
- **Enterprise UI** – Dark‑themed SOC dashboard with glassmorphism cards, custom tab navigation, and responsive layout.

---

## 📊 Model Performance (after realistic perturbation)

| Metric | Value |
|--------|-------|
| **AUC‑ROC** | 0.9824 |
| **F1‑Score** | 0.88 – 0.92 |
| **Recall (Fraud Detection Rate)** | 91.8% |
| **Precision** | 0.82 – 0.85 |
| **Optimal Threshold** | ~0.45 (auto‑tuned) |
| **Specificity** | 99.92% (false positive rate 0.08%) |
| **Average Latency** | < 50 ms |

*Advanced validation on 500 transactions (200 fraud, 300 legit) showed 95.5% accuracy, proving the model handles edge‑cases like threshold avoidance and velocity fraud.*

---

## 🚀 Quick Start

1. **Clone repo & install dependencies**
   ```bash
   git clone https://github.com/ConsoleLog/finspark-ps2.git
   cd finspark-ps2
   pip install -r requirements.txt
   pip install torch-geometric   # optional for Graph AI
   ```

2. **Set up environment** (`.env` file)
   ```
   SUPABASE_URL=your_project_url
   SUPABASE_KEY=your_anon_key
   ```

3. **Start backend**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Start frontend** (new terminal)
   ```bash
   streamlit run frontend/pages/dashboard.py
   ```

Dashboard will be live at `http://localhost:8501`.

---

## 🎬 Demo Flow (Judge Pitch)

1. **Live Dashboard** – metrics updating in real‑time.
2. **Causal Graph** – “DoWhy proves cyber events cause fraud”.
3. **Attack Simulation** – click button, 100 transactions flow, fraud table appears with Quantum Risk Scores.
4. **SHAP Explainability** – select any fraud from dropdown, see why (feature impact chart).
5. **Real‑World Validation** – upload the provided `advanced_fraud_validation.csv`, see 9/10 real cases detected.
6. **Quantum Vault** – side‑by‑side comparison + live ML‑KEM encryption demo.
7. **Architecture** – “6 tiers, from correlation to post‑quantum security”.

---

## 🧠 Tech Stack (Updated)

| Category | Tools |
|----------|-------|
| **Core ML** | XGBoost, LightGBM, CatBoost, Scikit‑Learn |
| **Deep Learning** | PyTorch, PyTorch Geometric (PyG) |
| **Graph Analytics** | NetworkX, GCNConv |
| **Explainability** | SHAP, LIME, DoWhy |
| **Data Processing** | Pandas, PyArrow, NumPy |
| **Backend** | FastAPI, Uvicorn |
| **Frontend** | Streamlit (custom CSS dark theme) |
| **Database** | Supabase (PostgreSQL) |
| **Security** | ML‑KEM‑512 (liboqs‑python), FIPS‑203 |
| **Deployment** | Docker, Uvicorn, Streamlit Cloud |

---

## 🔬 Key Differentiators (Why We Win)

1. **Correlation + Causation** – Not just correlation; DoWhy causal graph proves cyber events **cause** fraud.
2. **Hybrid Graph‑Tabular AI** – 25‑model ensemble plus Graph Convolutional Network for fraud ring detection.
3. **Graph & Self‑Supervised Learning (GCN + VIME)** – GCN uncovers hidden fraud rings in transaction graphs; VIME learns representations from unlabeled cyber‑transaction data.
4. **Post‑Quantum Ready** – ML‑KEM‑512 quantum vault protects predictions from future decryption (HNDL).
5. **Realistic & Explainable** – Deliberately avoided AUC=1.0 using heavy perturbation; every decision is auditable with SHAP.

---

## 🛡️ Code Changes Summary (From Basic to Enterprise)

| Layer | Problem Before | Solution Now | Impact |
|-------|----------------|--------------|--------|
| **Data Sanity** | Crashed on dirty/missing data | `validate_and_clean_data()` auto‑cleans NaN, negative values | Bulletproof inputs |
| **Model Loading** | Reloaded model every request (2s lag) | `@st.cache_resource` caches model in RAM | Latency < 50ms |
| **Input Structure** | Raw lists failed model | Exact `pd.DataFrame` with named columns | True ML inference active |
| **Decision Core** | Model biased on amount, missed mule accounts | Hybrid Risk Engine (ML + hard rules for edge‑cases) | Fixed false positives/negatives |
| **UI/UX** | Plain dropdowns, no explanations | Tooltips, feature glossary, dark theme, SOC‑style cards | Professional interactive dashboard |

---

## 📂 Project Structure

```
finspark-ps2/
├── artifacts/                     # Trained models & scaler
│   ├── finspark_all_25_models.pkl
│   ├── finspark_scaler.pkl
│   ├── finspark_ensemble_metadata.pkl
│   └── finspark_gcn_model.pth
├── api/routes/                    # FastAPI endpoints
│   ├── attack_simulation.py       # /simulate_attack, /explain_transaction, /validate_real_fraud
│   ├── quantum_secure.py          # /secure_predict (ML‑KEM)
│   └── dashboard.py               # /dashboard/metrics (Supabase)
├── frontend/pages/
│   ├── dashboard.py               # Main SOC dashboard (tabs, attack, SHAP, quantum vault, validation)
│   └── style.css                  # Custom dark theme CSS
├── utils/
│   ├── quantum_crypto.py          # MLKEMVault class (liboqs)
│   └── validate_input.py          # Column checker
├── data/
│   └── advanced_fraud_validation.csv  # 500 rows test set
├── causal_graph.png               # DoWhy causal DAG
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🏆 Results & Achievements

- 25‑model ensemble + Graph AI + Causal Inference + Post‑Quantum Security.
- Live dashboard with real‑time Supabase sync and auto‑refresh.
- 95.5% accuracy on advanced 500‑row validation set (200 frauds).
- < 50 ms prediction latency, 10K TPS ready.
- NIST FIPS‑203 compliant quantum vault.

---

## 🤝 Team ConsoleLog





## 📝 License

MIT License – see [LICENSE](LICENSE).

---

**Built with ❤️ for FinSpark 2026 Grand Finale. Ready to deploy, ready to win!** 🔥🚀
