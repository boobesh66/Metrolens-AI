# METROLENS AI — Operational Document Intelligence System

MetroLens AI is an AI-assisted operational document intelligence system tailored for public-sector transit networks (modeled for **Kochi Metro Rail Limited / KMRL**). It ingests multi-format operational logs, maintenance chits, and station incident reports, applying Applied Data Science (ADS) clustering, cross-document correlation, and explainable risk scoring to detect recurring defects and silent operational risks across shifts and stations.

---

## 1. System Overview & Purpose

Transit operations generate hundreds of daily maintenance sheets, station supervisor shift logs, and defect reports. Isolated low-severity events—such as recurring escalator vibrations or intermittent AFC gate reader delays—often go unnoticed until severe failure occurs.

**The Central Innovation**: Cross-Document Operational Intelligence.
```
Report A: "Escalator vibration observed at Aluva concourse."
Report B: "Unusual bearing noise from Escalator 03."
Report C: "Escalator step clicking and friction noted."
          ↓
[ METROLENS CROSS-DOCUMENT INTELLIGENCE ]
          ↓
RECURRING ISSUE DETECTED: Escalator 03 (Aluva)
• Related Reports: 3
• Temporal Trend: Increasing Frequency
• Prototype AI Risk Score: 85/100 (CRITICAL)
• Action Recommendation: Overhaul main drive bearing and lubricate drive chain.
```

---

## 2. Key Features

- **Document Management**: Ingest PDF, DOCX, CSV, and TXT logs with automated file integrity verification, SHA-256 checksums, and template authorization against official KMRL formats (`KMRL-STN-LOG-V2`, `KMRL-MAINT-F04`, etc.).
- **NLP Information & Entity Extraction**: Automated parsing of station, asset, subsystem, reported severity, and specific symptoms.
- **Cross-Document Clustering & Similarity**: TF-IDF vectorization and cosine similarity pairing to group related reports across time and stations.
- **Recurring Issue & Silent Risk Detection**: Identifies repeated hardware failures and flags clusters where multiple low-severity chits aggregate into high-consequence hazards.
- **Transparent & Explainable Risk Scoring**: Mathematical weighted formula (Frequency + Velocity + Severity + Asset Criticality + Semantic Similarity) providing clear rationale for operators.
- **Action Workflow Management**: Assign priority action orders (P1 Immediate to P4 Routine) with real-time status tracking (`NEW`, `UNDER_REVIEW`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`).
- **Statistical Analytics & Reports**: Concise public-sector visualizations covering station workload, category breakdown, monthly trends, and department allocation.
- **Bilingual Interface**: Full localization support for **English** and **Malayalam (മലയാളം)** (`en`, `ml`).
- **Zero-Blank-Screen Resilience**: Error boundary protection, safe initial session recovery, and deterministic routing.

---

## 3. Technology Stack & Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Node.js, Express, TypeScript (run with `tsx` in dev, bundled with `esbuild` for production)
- **Database**: Persistent JSON/SQLite-compatible relational state with cryptographic SHA-256 integrity ledger
- **AI & NLP Pipeline**: Applied Data Science (ADS) TF-IDF Vectorizer, Cosine Similarity Matrix, Rule-assisted Entity Normalizer, and Gemini 3.7 Flash Root-Cause Synthesis
- **Localization**: Native bilingual JSON dictionaries (`locales/en.json`, `locales/ml.json`)

---

## 4. Environment Variables

Create a `.env` file in the root directory (refer to `.env.example`):
```env
# Optional: Google Gemini API Key for server-side root-cause synthesis
GEMINI_API_KEY=
```
*Note: If no API key is provided, the application automatically uses deterministic local algorithms without external dependencies.*

---

## 5. Setup & Run Instructions

### Prerequisites
- Node.js (v18+)
- npm or bun

### Installation
```bash
npm install
```

### Running Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000` serving both the Express REST API and Vite frontend.

### Running Test Suite
```bash
npm test
```
Executes the automated 7-stage test suite covering database health, RBAC, file integrity, NLP entity extraction, similarity clustering, risk calculations, and bilingual localization.

### Production Build & Execution
```bash
npm run build
npm start
```

---

## 6. Complete User Journey

The prototype supports the complete end-to-end operational flow:
1. **Open & Sign In**: Authenticate using pre-configured Shift Officer / Admin credentials.
2. **Dashboard**: Review summary metrics (Documents Processed, Recurring Issues, Pending Actions).
3. **Documents**: Search, filter, inspect, and upload operational logs (PDF/DOCX/TXT/CSV).
4. **AI Processing**: Automated entity extraction, symptom recognition, and integrity validation.
5. **Issue Intelligence**: Explore recurring clusters, timeline history, and semantic similarity links.
6. **Action Dispatch**: Update action order workflow (`ASSIGNED` → `IN_PROGRESS` → `RESOLVED`).
7. **Reports**: View station distributions, monthly trends, and department workloads.
8. **Language Toggle**: Switch between English and Malayalam (`മലയാളം`).
9. **Sign Out**: Terminate session securely.

---

## 7. Documentation Index

- `docs/SYSTEM_ARCHITECTURE.md`: Technical architectural diagrams and data flow.
- `docs/AI_PIPELINE.md`: Applied Data Science NLP, TF-IDF clustering, and similarity mathematics.
- `docs/DATABASE.md`: Schema definition, table entities, and integrity ledger.
- `docs/API.md` & `docs/openapi.yaml`: Complete REST API endpoints and OpenAPI 3.0 specification.
- `docs/RISK_SCORING.md`: Detailed explanation of the 0–100 risk scoring algorithm and weights.
- `docs/TESTING.md`: Comprehensive test procedures, test commands, and test logs.
- `docs/TROUBLESHOOTING.md`: Solutions for common environment, upload, and runtime issues.

