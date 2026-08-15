# MetroLens AI — System Architecture

## 1. Executive Summary
MetroLens AI is an operational document intelligence platform designed specifically for transit networks like Kochi Metro Rail Limited (KMRL). It ingests multi-format operational logs, maintenance sheets, safety memos, and passenger feedback, utilizing bilingual entity extraction, semantic embedding comparison, and temporal correlation to detect recurring equipment defects and silent operational risks across shifts and departments.

---

## 2. End-to-End Data Flow

```
[USER / STATION OFFICER]
           │
           ▼
[SECURE AUTHENTICATION] (KMRL SSO & Role Authorization: Admin, Operator, Viewer)
           │
           ▼
[DOCUMENT INGESTION] (PDF, TXT, DOCX, CSV Drag & Drop / Upload)
           │
           ▼
[EXPRESS SERVER & ML ENGINE]
 ├── Bilingual Normalization (English & Malayalam OCR text)
 ├── Entity Extraction (Station, Asset, Sub-System, Symptom, Severity)
 ├── TF-IDF Vectorization & Cosine Similarity Matrix
 ├── Temporal Clustering (Windowed Cross-Document Aggregation)
 └── Risk Scoring Engine (Frequency, Criticality, Silent Signal Detection)
           │
           ▼
[PERSISTENCE & STATE STORE]
 ├── Document Store (Metadata, Raw Text, Verification State)
 ├── Incident Registry (Structured Extraction, Human Overrides)
 ├── Recurring Issue Clusters (Degradation Timelines, Correlated Reports)
 └── Operational Actions (Status, Due Dates, Assigned Department)
           │
           ▼
[PUBLIC-SECTOR RESPONSIVE DASHBOARD]
 ├── Home: Instant KPIs & Priority Alert Focus
 ├── Documents: Filterable Repository & In-Depth Incident Inspector
 ├── Issues: Recurring Defect Clusters & Chronological Event Timelines
 └── Reports: Cross-Station Distribution & Department Workload Analytics
```

---

## 3. Component Architecture

### Frontend Layer
- **Framework**: React 18+ with TypeScript and Vite
- **Styling**: Tailwind CSS with an institutional public-sector design system
- **Localization**: Bilingual dictionary system (`en`, `ml`) with real-time switching
- **Resilience**: Global `ErrorBoundary` preventing blank screens and unhandled crashes

### Backend & ML Service Layer
- **Server**: Express.js with TypeScript native execution (`tsx` in dev, bundled `esbuild` for production)
- **ML Engine**: Self-contained NLP and similarity module (`server/mlEngine.ts`) with deterministic fallback algorithms
- **API Surface**: RESTful endpoints documented in `docs/openapi.yaml` and `docs/API.md`
